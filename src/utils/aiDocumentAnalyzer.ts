import { supabase } from '@/integrations/supabase/client';
import { CourseData } from '@/types/course';

export interface AnalyzedDocument {
  extractedData: CourseData;
  confidence: number;
  extractionLog: string[];
}

export const analyzeDocumentWithAI = async (documentText: string): Promise<AnalyzedDocument> => {
  try {
    // Call Lovable AI backend for analysis
    const { data, error } = await supabase.functions.invoke('analyze-syllabus', {
      body: { documentText }
    });

    if (error) {
      console.error('Supabase function error:', error);
      throw error;
    }

    if (!data || data.error) {
      throw new Error(data?.error || 'Analysis failed');
    }

    // Validate and clean the extracted data
    const cleanedData = validateAndCleanData(data.extractedData);
    
    return {
      extractedData: cleanedData,
      confidence: data.confidence || 0.9,
      extractionLog: data.extractionLog || ['Successfully analyzed with Lovable AI']
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