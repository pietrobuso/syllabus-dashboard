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

4. **Course Policies**:
   - Late work policy
   - Attendance policy
   - Honor code/academic integrity policy

5. **Important Dates** (if available):
   - Event name
   - Date
   - Type (exam, deadline, etc.)

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
  "policies": {
    "late_work": "string",
    "attendance": "string", 
    "honor_code": "string"
  },
  "schedule": [],
  "important_dates": [{
    "name": "string",
    "date": "string",
    "type": "exam" | "deadline"
  }]
}

If information is not available, use empty strings or empty arrays. Ensure grading weights are decimals that sum to approximately 1.0.

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
    schedule: [],
    policies: {
      late_work: "",
      attendance: "",
      honor_code: ""
    },
    important_dates: []
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
    schedule: data.schedule || [],
    policies: {
      late_work: data.policies?.late_work || "",
      attendance: data.policies?.attendance || "",
      honor_code: data.policies?.honor_code || ""
    },
    important_dates: Array.isArray(data.important_dates) ? data.important_dates : []
  };

  return cleanData;
};