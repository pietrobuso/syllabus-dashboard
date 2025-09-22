import { GoogleGenerativeAI } from '@google/generative-ai';
import { CourseData } from '@/types/course';

export interface AnalyzedDocument {
  extractedData: CourseData;
  confidence: number;
  extractionLog: string[];
}

const getGeminiApiKey = (): string => {
  // In a production environment, this would come from Supabase Edge Functions
  // For now, we'll need to handle it client-side with user input
  const apiKey = localStorage.getItem('gemini_api_key');
  if (!apiKey) {
    throw new Error('Gemini API key not found. Please add your API key in settings.');
  }
  return apiKey;
};

export const analyzeDocumentWithAI = async (documentText: string): Promise<AnalyzedDocument> => {
  try {
    let apiKey: string;
    try {
      apiKey = getGeminiApiKey();
    } catch (keyError) {
      // If no API key, prompt user for it
      const userApiKey = window.prompt('Please enter your Google Gemini API key to analyze the document:');
      if (!userApiKey) {
        throw new Error('API key required for document analysis');
      }
      localStorage.setItem('gemini_api_key', userApiKey);
      apiKey = userApiKey;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const analysisPrompt = `
You are an AI assistant specialized in analyzing academic syllabus documents. Extract the following information from the provided syllabus text and return it in a structured JSON format.

Please extract:

1. **Course Information**:
   - Title (course name)
   - Code (e.g., CS101, MATH250)
   - Semester (e.g., Fall 2024, Spring 2025)
   - Institution (university/college name)

2. **Instructor Information** (can be multiple):
   - Name
   - Email
   - Office hours
   - Office location
   - Role (professor, ta, assistant, etc.)

3. **Grading Components** (with percentages):
   - Component name (e.g., "Assignments", "Midterm Exam")
   - Weight (as decimal, e.g., 0.3 for 30%)
   - Description

4. **Weekly Schedule** (extract weekly topics and activities):
   - Date or week number
   - Topic/theme for the week
   - Activities (lecture, lab, quiz, exam, assignment, monitored)
   - Deliverables (assignments, projects, exams due)
   - Required readings

5. **Important Dates** (extract all significant dates):
   - Event name (e.g., "Midterm Exam", "Project 1 Due", "Quiz 3")
   - Date (in YYYY-MM-DD format if possible)
   - Type (exam, deadline, quiz, project, break)

6. **Course Policies**:
   - Late work policy
   - Attendance policy
   - Honor code/academic integrity policy

Return ONLY a valid JSON response in this exact structure:
{
  "course": {
    "title": "string",
    "code": "string", 
    "semester": "string",
    "institution": "string"
  },
  "instructors": [{
    "name": "string",
    "email": "string",
    "office_hours": "string",
    "location": "string",
    "role": "professor" | "ta"
  }],
  "grading": [{
    "component": "string",
    "weight": number,
    "description": "string"
  }],
  "schedule": [{
    "date": "YYYY-MM-DD or week description",
    "week": number,
    "topic": "string (main topic/theme)",
    "activities": ["lecture", "lab", "quiz", "exam", "assignment", "monitored"],
    "deliverables": [{
      "name": "string",
      "due": "YYYY-MM-DD",
      "type": "assignment" | "quiz" | "exam" | "project"
    }],
    "readings": ["string (optional reading assignments)"]
  }],
  "important_dates": [{
    "name": "string (e.g., Midterm Exam, Project Due)",
    "date": "YYYY-MM-DD",
    "type": "exam" | "deadline" | "quiz" | "project" | "break"
  }],
  "policies": {
    "late_work": "string",
    "attendance": "string", 
    "honor_code": "string"
  }
}

IMPORTANT EXTRACTION GUIDELINES:
- Extract ALL dates mentioned in the syllabus (exams, quizzes, assignment due dates, project deadlines)
- Look for weekly schedules, course calendars, or timeline sections
- Identify monitored activities (in-class exercises, labs, participation activities)
- Pay attention to recurring activities (weekly quizzes, bi-weekly assignments)
- If dates are relative (e.g., "Week 3"), convert to actual dates if semester start is mentioned
- If information is not available, use empty strings or empty arrays
- Ensure grading weights are decimals that sum to approximately 1.0

Syllabus Text:
${documentText}
`;

    const result = await model.generateContent(analysisPrompt);
    const response = await result.response;
    const analysisResult = response.text();
    
    // Parse the AI response
    let extractedData: CourseData;
    try {
      // Try to extract JSON from the AI response
      const jsonMatch = analysisResult.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
      } else {
        // Try parsing the entire response as JSON
        extractedData = JSON.parse(analysisResult);
      }
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError);
      // Fallback to basic extraction
      return {
        extractedData: createFallbackData(documentText),
        confidence: 0.2,
        extractionLog: ['Gemini parsing failed, using basic extraction', `Parse error: ${parseError}`]
      };
    }

    // Validate and clean the extracted data
    const cleanedData = validateAndCleanData(extractedData);
    
    return {
      extractedData: cleanedData,
      confidence: 0.9,
      extractionLog: [
        'Successfully analyzed with Google Gemini',
        'Extracted course information, instructors, and grading details'
      ]
    };

  } catch (error) {
    console.error('Gemini analysis failed:', error);
    
    // Fallback to basic extraction
    return {
      extractedData: createFallbackData(documentText),
      confidence: 0.3,
      extractionLog: [
        'Gemini analysis failed, using fallback extraction',
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      ]
    };
  }
};

const createFallbackData = (text: string): CourseData => {
  // Basic regex-based extraction as fallback
  const lines = text.split('\n').filter(line => line.trim());
  const lowerText = text.toLowerCase();

  // Extract course title (first significant line or from patterns)
  let title = "Course Title";
  const titleMatch = text.match(/([A-Z][A-Za-z\s]{10,60})/);
  if (titleMatch) {
    title = titleMatch[1].trim();
  }

  // Extract course code
  let code = "";
  const codeMatch = text.match(/([A-Z]{2,4}\s*\d{3,4}[A-Z]?)/);
  if (codeMatch) {
    code = codeMatch[1].trim();
  }

  // Extract semester
  let semester = "Fall 2024";
  const semesterMatch = text.match(/(spring|fall|summer|winter)\s*(\d{4})/i);
  if (semesterMatch) {
    semester = `${semesterMatch[1]} ${semesterMatch[2]}`;
  }

  // Extract email for instructor
  const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
  
  return {
    course: { title, code, semester, institution: "" },
    instructors: [{
      name: "Instructor",
      email: emailMatch ? emailMatch[0] : "",
      office_hours: "",
      location: "",
      role: "professor" as const
    }],
    grading: [
      { component: "Assignments", weight: 0.4, description: "Regular assignments" },
      { component: "Exams", weight: 0.4, description: "Midterm and final exams" },
      { component: "Participation", weight: 0.2, description: "Class participation" }
    ],
    schedule: [
      {
        date: "2024-09-01",
        week: 1,
        topic: "Course Introduction",
        activities: ["lecture" as const],
        deliverables: [],
        readings: []
      }
    ],
    policies: {
      late_work: "",
      attendance: "",
      honor_code: ""
    },
    important_dates: [
      {
        name: "Midterm Exam",
        date: "2024-10-15",
        type: "exam" as const
      },
      {
        name: "Final Exam",
        date: "2024-12-10",
        type: "exam" as const
      }
    ]
  };
};

const validateAndCleanData = (data: any): CourseData => {
  // Ensure required structure exists
  const cleanData: CourseData = {
    course: {
      title: data.course?.title || "Course Title",
      code: data.course?.code || "",
      semester: data.course?.semester || "Fall 2024",
      institution: data.course?.institution || ""
    },
    instructors: Array.isArray(data.instructors) && data.instructors.length > 0 
      ? data.instructors.map((inst: any) => ({
          name: inst.name || "Instructor",
          email: inst.email || "",
          office_hours: inst.office_hours || "",
          location: inst.location || "",
          role: (inst.role === "ta" ? "ta" : "professor") as "professor" | "ta"
        }))
      : [{
          name: "Instructor",
          email: "",
          office_hours: "",
          location: "",
          role: "professor" as const
        }],
    grading: Array.isArray(data.grading) && data.grading.length > 0
      ? data.grading.map((grade: any) => ({
          component: grade.component || "Component",
          weight: typeof grade.weight === 'number' ? grade.weight : 0.2,
          description: grade.description || ""
        }))
      : [
          { component: "Assignments", weight: 0.4, description: "Regular assignments" },
          { component: "Exams", weight: 0.4, description: "Midterm and final exams" },
          { component: "Participation", weight: 0.2, description: "Class participation" }
        ],
    schedule: Array.isArray(data.schedule) && data.schedule.length > 0
      ? data.schedule.map((item: any) => ({
          date: item.date || "",
          week: typeof item.week === 'number' ? item.week : 1,
          topic: item.topic || "Topic",
          activities: Array.isArray(item.activities) ? item.activities : ["lecture"],
          deliverables: Array.isArray(item.deliverables) ? item.deliverables : [],
          readings: Array.isArray(item.readings) ? item.readings : []
        }))
      : [{
          date: "2024-09-01",
          week: 1,
          topic: "Course Introduction",
          activities: ["lecture"],
          deliverables: [],
          readings: []
        }],
    policies: {
      late_work: data.policies?.late_work || "",
      attendance: data.policies?.attendance || "",
      honor_code: data.policies?.honor_code || ""
    },
    important_dates: Array.isArray(data.important_dates) && data.important_dates.length > 0
      ? data.important_dates.map((item: any) => ({
          name: item.name || "Important Date",
          date: item.date || "",
          type: (["exam", "deadline", "quiz", "project", "break", "other"].includes(item.type)) 
            ? item.type 
            : "deadline"
        }))
      : [
          { name: "Midterm Exam", date: "2024-10-15", type: "exam" },
          { name: "Final Exam", date: "2024-12-10", type: "exam" }
        ]
  };

  return cleanData;
};