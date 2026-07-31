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
- Tell apart three DIFFERENT things syllabi often mix together, and route each to its own field:
  1. "schedule" = a week-by-week or date-by-date calendar (each entry tied to a specific week/date).
  2. "content" = a topic/unit outline with NO week or date attached (e.g. "Unit 1: Functions", "Module 3: Thermodynamics", a numbered list of topics/readings that isn't mapped onto specific weeks). If you cannot point to a specific date or week number for an entry, it belongs in "content", not "schedule" - do not invent a date or week number just to force it into "schedule".
  3. "meeting_times" = the recurring day-of-week/time pattern the class regularly meets (e.g. "Lectures MWF 10:00-10:50am", "Discussion section Tuesdays 3-4pm"). This is a weekly recurring pattern, not a dated event - it also does not belong in "schedule".

When analyzing this syllabus:
- Think like a professor organizing a course dashboard for students
- Extract what students ACTUALLY need to know for day-to-day success
- Distinguish between "nice to know" and "must know" information
- Recognize common syllabus patterns (weekly topics, bi-weekly assignments, multi-part projects)
- Extrapolate a pattern ONLY when the document itself states it applies every time (e.g. the syllabus literally says "lab every Friday" -> create a lab entry for each Friday). This is completing a stated rule, not guessing.
- Convert informal language to structured data ONLY when the document supplies the underlying fact (e.g. "midterm around Oct 15" -> 2024-10-15, because the date is in the text). Never invent a date, name, or number that has no basis in the document.
- Identify the PRIMARY instructor vs TAs/assistants based on context and title

CRITICAL - do not fabricate: if a field's information is simply not present anywhere in the document, leave it as an empty string (or omit that array item entirely). Do NOT invent placeholder dates, names, percentages, or office hours to make the output look more complete. A blank field the student can fill in themselves is far better than a confident-looking wrong answer they might trust. Before writing any value, be able to point to the exact text in the document that supports it.

BRAZILIAN / PORTUGUESE SYLLABI - many documents you will see are Brazilian and written in Portuguese. Handle them as follows.

Section headings map to fields like this:
- "CONTEÚDO", "CONTEÚDO PROGRAMÁTICO", "EMENTA", "PROGRAMA" -> the "content" field. This is the official topic/unit outline. It is NOT a class schedule, even when its items are numbered 1., 2., 3. Those numbers are unit numbers, not class sessions or week numbers. NEVER turn this list into "schedule" entries.
- "PROGRAMAÇÃO AULA-A-AULA", "CRONOGRAMA", "CALENDÁRIO", "PLANO DE AULAS" -> the "schedule" field. This is the session-by-session plan.
- "CRITÉRIOS DE AVALIAÇÃO", "AVALIAÇÃO" (with weights/"PESO EM %") -> "grading"
- "REFERÊNCIAS", "BIBLIOGRAFIA" -> readings, not schedule entries
- "CONTATO E OFFICE HOURS", "PROFESSORES", "DOCENTES" -> "instructors"
- "METODOLOGIA", "COMPROMISSO ÉTICO" -> "policies" where relevant
- "OBJETIVOS DA DISCIPLINA", "LEARNING GOALS" -> not extracted; ignore

The same topics often appear BOTH in "CONTEÚDO" and in "PROGRAMAÇÃO AULA-A-AULA". That is normal and is not a duplicate to be merged: the CONTEÚDO list goes to "content", and the aula-a-aula list goes to "schedule". Keep both.

Dates are day/month, NOT month/day. "05/08" means 5 August, never 8 May. Watch for consecutive rows increasing by 7 days (05/08, 12/08, 19/08) as confirmation. If a date has no year, take the year from the semester header ("2º 2026", "2nd/2026", "2º semestre de 2026" all mean the second semester of 2026) and pick the year that makes the date fall inside that term.

Placeholder phrases mean the information DOES NOT EXIST YET. Treat them as absent and leave the field empty or the array empty - never fill the gap with something invented:
- "Em elaboração", "A definir", "A ser definido", "A combinar", "A ser divulgado", "Será disponibilizada na 1ª aula", "TBD", "TBA"
For example, if "PROGRAMAÇÃO AULA-A-AULA" only says "Em elaboração", then "schedule" must be an empty array - do NOT populate it from the CONTEÚDO list to compensate.

Session-numbered schedules without dates are common ("Aula 01 ... Aula 15", "Class 1 ... Class 14"). Put them in "schedule", use the session number as "week", and leave "date" empty. Do NOT invent calendar dates for them - the app derives those from a start date the student provides.

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
          },
          start_date: {
            type: "STRING",
            description: "First day of classes in YYYY-MM-DD format, ONLY if the document actually states it (e.g. the first row of a dated class schedule, or a line like 'início das aulas: 05/08'). Remember dates are day/month. Leave empty if the document never says when classes start - do not guess it from the semester."
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
        description: "The session-by-session or week-by-week class plan (e.g. a 'CLASS SCHEDULE' table, or 'PROGRAMAÇÃO AULA-A-AULA'). One entry per class session. Only include entries that the document actually lists as sessions - never build this list out of a topic outline (see the 'content' field).",
        items: {
          type: "OBJECT",
          properties: {
            date: {
              type: "STRING",
              description: "The date of this session in YYYY-MM-DD format, ONLY if the document states a date for it. Dates are day/month (05/08 = 5 August); take the year from the semester header if the date omits it. If the document lists sessions without dates (e.g. 'Aula 01', 'Class 1' with an empty date column), leave this EMPTY - the app derives the real date from the course start date. Never invent a date."
            },
            week: {
              type: "NUMBER",
              description: "The session/week number as the document numbers it: 'Aula 07' -> 7, 'Class 3' -> 3, 'Semana 2'/'Week 2' -> 2. If sessions are listed in order without numbers, number them sequentially from 1."
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
      content: {
        type: "ARRAY",
        description: "The course's topic/unit outline - the syllabus section listing what the course covers, independent of any calendar. In Portuguese syllabi this is the 'CONTEÚDO', 'CONTEÚDO PROGRAMÁTICO' or 'EMENTA' section; in English ones it's a topic/unit/module list. Its items are usually numbered (1., 2., 3.) but those are UNIT numbers, not class sessions - this list must never be turned into 'schedule' entries. It is expected and correct for these topics to also appear in the session schedule; extract both. Leave empty only if the document has no such outline.",
        items: {
          type: "OBJECT",
          properties: {
            title: {
              type: "STRING",
              description: "Name of this unit/topic/module exactly as the syllabus labels it (e.g. 'Unit 1: Functions', 'Module 3: Thermodynamics')."
            },
            description: {
              type: "STRING",
              description: "One or two sentences describing what this unit covers, only if the syllabus actually says so. Leave empty if not stated."
            },
            topics: {
              type: "ARRAY",
              items: { type: "STRING" },
              description: "Sub-topics listed under this unit, exactly as written (e.g. 'Recursion', 'Higher-order functions')."
            },
            readings: {
              type: "ARRAY",
              items: { type: "STRING" },
              description: "Readings associated with this unit (chapters, articles, pages), if stated."
            }
          },
          required: ["title"]
        }
      },
      meeting_times: {
        type: "ARRAY",
        description: "The recurring day-of-week/time pattern this class regularly meets, e.g. 'Lectures MWF 10:00-10:50am', 'Discussion section Tuesdays 3-4pm', 'TEACHING DAY & TIME: WEDNESDAYS; 9:00 - 10:40', or Portuguese equivalents ('Aulas às quartas-feiras, 9h-10h40', 'HORÁRIO: SEG e QUA 14:00-15:40'). Portuguese weekday names map as: segunda(-feira)=monday, terça=tuesday, quarta=wednesday, quinta=thursday, sexta=friday, sábado=saturday, domingo=sunday. One entry per weekday the class meets (so 'MWF 10:00-10:50am' becomes three entries: monday, wednesday, friday). Only include a meeting time if the syllabus explicitly states a recurring day and time - never guess one.",
        items: {
          type: "OBJECT",
          properties: {
            day: {
              type: "STRING",
              enum: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
              description: "Day of the week this recurring meeting happens."
            },
            start_time: {
              type: "STRING",
              description: "Start time in 24-hour HH:MM format (e.g. '14:00' for 2:00pm). Convert from whatever format the syllabus uses."
            },
            end_time: {
              type: "STRING",
              description: "End time in 24-hour HH:MM format (e.g. '15:20' for 3:20pm)."
            },
            label: {
              type: "STRING",
              description: "What kind of meeting this is, if stated (e.g. 'Lecture', 'Lab', 'Discussion Section'). Leave empty if the syllabus doesn't distinguish."
            }
          },
          required: ["day", "start_time", "end_time"]
        }
      },
      important_dates: {
        type: "ARRAY",
        description: "Critical dates students must remember. Major milestones that deserve calendar reminders. This includes rows inside a class-schedule table that carry a date but are not a regular class - e.g. 'NO REGULAR CLASSES DUE TO SPRING BREAK', 'SEM AULA - FERIADO', 'Semana de Provas', 'Final Exam' - put those here (type 'break' or 'exam' as appropriate) rather than as schedule sessions.",
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
