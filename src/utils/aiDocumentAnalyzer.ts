import { CourseData } from '@/types/course';

export interface AnalyzedDocument {
  extractedData: CourseData;
  confidence: number;
  extractionLog: string[];
}

export const analyzeDocumentWithAI = async (documentText: string): Promise<AnalyzedDocument> => {
  try {
    const prompt = `
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

Return the response in this exact JSON structure:
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

    // Use the advanced extraction from our mock API for now
    const { analyzeDocument } = await import('../api/analyze-document');
    const analysisResult = await analyzeDocument(documentText);
    const result = { analysis: analysisResult };
    
    // Parse the AI response
    let extractedData: CourseData;
    try {
      // Try to extract JSON from the AI response
      const jsonMatch = result.analysis.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No valid JSON found in AI response');
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      // Fallback to basic extraction
      return {
        extractedData: createFallbackData(documentText),
        confidence: 0.2,
        extractionLog: ['AI parsing failed, using basic extraction', `Parse error: ${parseError}`]
      };
    }

    // Validate and clean the extracted data
    const cleanedData = validateAndCleanData(extractedData);
    
    return {
      extractedData: cleanedData,
      confidence: 0.8,
      extractionLog: [
        'Successfully analyzed with AI',
        'Extracted course information, instructors, and grading details'
      ]
    };

  } catch (error) {
    console.error('AI analysis failed:', error);
    
    // Fallback to basic extraction
    return {
      extractedData: createFallbackData(documentText),
      confidence: 0.3,
      extractionLog: [
        'AI analysis failed, using fallback extraction',
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