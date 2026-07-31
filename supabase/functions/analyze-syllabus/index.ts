import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEMINI_MODEL = "gemini-flash-latest";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const SYSTEM_PROMPT = `You are a seasoned university professor with decades of experience designing and teaching courses. You deeply understand syllabus structure, academic terminology, and how information flows in course documents.

Your expertise allows you to:
- Distinguish between course codes, titles, and catalog descriptions naturally
- Identify all instructional staff (professors, TAs, guest lecturers) and their specific roles
- Recognize various grading schemes (weighted averages, point-based, participation, etc.)
- Parse complex weekly schedules with lectures, labs, discussions, and office hours
- Spot critical dates buried in text (drop deadlines, exam dates, project milestones)
- Understand academic policies in context (late penalties, attendance rules, academic integrity)

When analyzing this syllabus:
- Think like a professor organizing a course dashboard for students
- Extract what students ACTUALLY need to know for day-to-day success
- Distinguish between "nice to know" and "must know" information
- Recognize common syllabus patterns (weekly topics, bi-weekly assignments, multi-part projects)
- Extrapolate a pattern ONLY when the document itself states it applies every time (e.g. the syllabus literally says "lab every Friday" -> create a lab entry for each Friday). This is completing a stated rule, not guessing.
- Convert informal language to structured data ONLY when the document supplies the underlying fact (e.g. "midterm around Oct 15" -> 2024-10-15, because the date is in the text). Never invent a date, name, or number that has no basis in the document.
- Identify the PRIMARY instructor vs TAs/assistants based on context and title

CRITICAL - do not fabricate: if a field's information is simply not present anywhere in the document, leave it as an empty string (or omit that array item entirely). Do NOT invent placeholder dates, names, percentages, or office hours to make the output look more complete. A blank field the student can fill in themselves is far better than a confident-looking wrong answer they might trust. Before writing any value, be able to point to the exact text in the document that supports it.

Be comprehensive but honest-extract everything that is actually in the document, and nothing that isn't.`;

// Gemini function-calling schemas are OpenAPI-subset: uppercase types, no additionalProperties.
const EXTRACT_SYLLABUS_FUNCTION = {
  name: "extract_syllabus_data",
  description: "Extract structured course data from a syllabus document",
  parameters: {
    type: "OBJECT",
    properties: {
      course: {
        type: "OBJECT",
        properties: {
          title: {
            type: "STRING",
            description: "The official course title as students would recognize it. Not the course code, not a description-the actual name (e.g., 'Introduction to Data Structures', 'Advanced Molecular Biology')"
          },
          code: {
            type: "STRING",
            description: "Course identifier/code as used in registration systems. Format varies by institution (e.g., 'CS 2310', 'BIOL-445', 'ENG101'). Extract exactly as written."
          },
          semester: {
            type: "STRING",
            description: "Academic term with year. Common formats: 'Fall 2024', 'Spring 2025', 'Summer Session I 2024'. Match the syllabus wording."
          },
          institution: {
            type: "STRING",
            description: "University/college name if mentioned (official name preferred). Leave empty if not stated."
          }
        },
        required: ["title", "code", "semester"]
      },
      instructors: {
        type: "ARRAY",
        description: "All teaching staff. List primary instructor first, then TAs/assistants.",
        items: {
          type: "OBJECT",
          properties: {
            name: {
              type: "STRING",
              description: "Full name with proper title if given (Dr., Prof., Mr., Ms.). Extract exactly as written."
            },
            email: {
              type: "STRING",
              description: "Contact email address. Essential for students to reach instructors."
            },
            office_hours: {
              type: "STRING",
              description: "When students can meet this person. Include days/times and format (in-person, Zoom, by appointment). Examples: 'Mon/Wed 2-4pm, Room 305', 'By appointment via email', 'Tuesdays 10am-12pm (Zoom link in Canvas)'"
            },
            location: {
              type: "STRING",
              description: "Where to find them: office room number, building name, or virtual location. Examples: 'Science Hall 402', 'Engineering Building 3rd Floor', 'Virtual office on Teams'"
            },
            role: {
              type: "STRING",
              enum: ["professor", "ta"],
              description: "Use 'professor' for primary instructor (Professor, Lecturer, Instructor). Use 'ta' for Teaching Assistants, Graduate Assistants, or Lab Instructors. When unclear, default to professor if they're the main point of contact."
            }
          },
          required: ["name", "email"]
        }
      },
      grading: {
        type: "ARRAY",
        description: "Complete breakdown of how the final grade is calculated. Every component that counts toward the grade.",
        items: {
          type: "OBJECT",
          properties: {
            component: {
              type: "STRING",
              description: "Name of this grade component as students would recognize it. Use the syllabus terminology. Examples: 'Homework Assignments', 'Midterm Exam', 'Lab Reports', 'Class Participation', 'Final Project', 'Quizzes'. Group similar items (e.g., if there are 10 homeworks worth 40% total, use one entry 'Homework Assignments' at 0.4)."
            },
            weight: {
              type: "NUMBER",
              description: "Percentage of final grade as a decimal between 0 and 1. Example: 35% = 0.35, 12.5% = 0.125. Must sum to 1.0 across all components. Convert point-based systems to percentages (e.g., '300 points out of 1000' = 0.3)."
            },
            description: {
              type: "STRING",
              description: "Additional context students need: how many of this item, frequency, what it covers, drop policy. Examples: '4 exams, lowest dropped', 'Weekly, total of 12', 'Individual research paper, 8-10 pages', 'Cumulative final', 'Best 8 of 10 count'."
            }
          },
          required: ["component", "weight"]
        }
      },
      schedule: {
        type: "ARRAY",
        description: "Week-by-week course schedule. Create one entry per week/session with all relevant information for that time period.",
        items: {
          type: "OBJECT",
          properties: {
            date: {
              type: "STRING",
              description: "Start date of this week/session in YYYY-MM-DD format. If only week numbers given, estimate dates based on semester start. If ranges like 'Sept 5-9', use Sept 5. Format must be YYYY-MM-DD (e.g., '2024-09-15')."
            },
            week: {
              type: "NUMBER",
              description: "Sequential week number in the course (Week 1, Week 2, etc.). Start from 1 and increment."
            },
            topic: {
              type: "STRING",
              description: "Main subject/theme for this week. What students will learn. Extract from syllabus headers like 'Week 5: Object-Oriented Programming' -> 'Object-Oriented Programming'. Be concise but descriptive."
            },
            activities: {
              type: "ARRAY",
              items: { type: "STRING", enum: ["lecture", "lab", "quiz", "exam", "assignment", "monitored"] },
              description: "What happens this week. Use 'lecture' for standard classes, 'lab' for hands-on sessions, 'quiz' for in-class quizzes, 'exam' for major tests, 'assignment' when homework is assigned, 'monitored' for proctored activities."
            },
            deliverables: {
              type: "ARRAY",
              description: "Assignments/assessments DUE this week. Not what's assigned, but what's due.",
              items: {
                type: "OBJECT",
                properties: {
                  name: {
                    type: "STRING",
                    description: "Specific name of the deliverable (e.g., 'Problem Set 3', 'Lab Report 2', 'Midterm Exam', 'Project Proposal')"
                  },
                  due: {
                    type: "STRING",
                    description: "When it's due in YYYY-MM-DD format or specific time if critical (e.g., '2024-10-15' or '2024-10-15 11:59pm')"
                  },
                  type: {
                    type: "STRING",
                    enum: ["assignment", "quiz", "exam", "project"],
                    description: "Category: 'assignment' for homework/problem sets, 'quiz' for short assessments, 'exam' for major tests, 'project' for long-term deliverables"
                  }
                }
              }
            },
            readings: {
              type: "ARRAY",
              items: { type: "STRING" },
              description: "Required readings for this week. Include textbook chapters, articles, pages. Examples: 'Chapter 5: Neural Networks', 'Pages 142-178', 'Smith et al. (2023) paper on Canvas', 'Textbook sections 3.1-3.4'"
            }
          },
          required: ["week", "topic"]
        }
      },
      important_dates: {
        type: "ARRAY",
        description: "Critical dates students must remember. Major milestones that deserve calendar reminders.",
        items: {
          type: "OBJECT",
          properties: {
            name: {
              type: "STRING",
              description: "Clear, specific name for this date. Examples: 'Midterm Exam 1', 'Final Project Due', 'Last Day to Drop', 'Spring Break', 'No Class - Holiday'. Students should immediately understand what happens."
            },
            date: {
              type: "STRING",
              description: "Date in YYYY-MM-DD format. For multi-day events (like breaks), use the START date. Must be parseable. Examples: '2024-10-15', '2024-12-08'. Convert text dates to this format."
            },
            type: {
              type: "STRING",
              enum: ["exam", "deadline", "quiz", "project", "break", "other"],
              description: "Category for filtering: 'exam' for any test/midterm/final, 'deadline' for major assignment due dates, 'quiz' for graded quizzes, 'project' for project milestones/deadlines, 'break' for holidays/recesses/no-class periods, 'other' for guest lectures, field trips, administrative dates like drop/add deadlines"
            }
          },
          required: ["name", "date", "type"]
        }
      },
      policies: {
        type: "OBJECT",
        description: "Course policies students need to follow. Extract the actual rules and consequences.",
        properties: {
          late_work: {
            type: "STRING",
            description: "Policy for late assignments: penalties, grace periods, whether late work is accepted. Examples: '10% penalty per day, max 3 days late', 'Not accepted after deadline', '24-hour grace period with no penalty', 'Lowest grade dropped so use that for emergencies'. Extract exact wording when possible."
          },
          attendance: {
            type: "STRING",
            description: "Attendance requirements and consequences. Include: is attendance mandatory, how many absences allowed, excused absence policy, impact on grade. Examples: 'Attendance mandatory, >3 unexcused absences = grade penalty', 'Not required but strongly encouraged', 'Participation grade includes attendance', 'Excused with documentation only'."
          },
          honor_code: {
            type: "STRING",
            description: "Academic integrity policy: what collaboration is allowed, plagiarism consequences, honor code references. Examples: 'Zero tolerance for plagiarism, will result in failing grade', 'May discuss approaches but write your own code', 'All work must be original unless cited', 'Follow university academic integrity policy'. Include specific collaboration rules if stated."
          }
        }
      }
    },
    required: ["course", "instructors", "grading", "schedule", "policies"]
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentText } = await req.json();

    if (!documentText || documentText.trim().length < 50) {
      return new Response(
        JSON.stringify({ error: "Document text is too short or empty" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const response = await fetch(GEMINI_ENDPOINT, {
      method: "POST",
      headers: {
        "x-goog-api-key": GEMINI_API_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [
          {
            role: "user",
            parts: [{ text: `Analyze this syllabus and extract all course information:\n\n${documentText.slice(0, 50000)}` }]
          }
        ],
        tools: [{ functionDeclarations: [EXTRACT_SYLLABUS_FUNCTION] }],
        toolConfig: {
          functionCallingConfig: { mode: "ANY", allowedFunctionNames: ["extract_syllabus_data"] }
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (response.status === 401 || response.status === 403) {
        return new Response(
          JSON.stringify({ error: "AI provider authentication failed. Check the GEMINI_API_KEY secret." }),
          { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error(`Gemini API error: ${response.status}`);
    }

    const result = await response.json();
    const parts = result.candidates?.[0]?.content?.parts ?? [];
    const functionCallPart = parts.find((part: { functionCall?: unknown }) => part.functionCall);

    if (!functionCallPart?.functionCall?.args) {
      throw new Error("No structured data returned from AI");
    }

    const extractedData = functionCallPart.functionCall.args;

    return new Response(
      JSON.stringify({
        extractedData,
        extractionLog: [`Successfully analyzed with Google Gemini (${GEMINI_MODEL})`]
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Analysis error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        extractedData: null,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
