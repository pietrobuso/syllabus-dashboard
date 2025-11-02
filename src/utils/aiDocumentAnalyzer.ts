import { supabase } from '@/integrations/supabase/client';
import { SUPABASE_URL, getFunctionHeaders } from '@/integrations/supabase/config';
import { CourseData } from '@/types/course';

export interface AnalyzedDocument {
  extractedData: CourseData;
  confidence: number;
  extractionLog: string[];
}

export const analyzeDocumentWithAI = async (documentText: string): Promise<AnalyzedDocument> => {
  try {
    // Try using Supabase SDK first
    let data, error;
    
    try {
      const response = await supabase.functions.invoke('analyze-syllabus', {
        body: { documentText }
      });
      data = response.data;
      error = response.error;
    } catch (sdkError) {
      console.log('Supabase SDK failed, trying direct fetch:', sdkError);
      
      // Fallback to direct fetch with explicit headers (works in incognito)
      const fetchResponse = await fetch(`${SUPABASE_URL}/functions/v1/analyze-syllabus`, {
        method: 'POST',
        headers: getFunctionHeaders(),
        body: JSON.stringify({ documentText })
      });
      
      if (!fetchResponse.ok) {
        throw new Error(`HTTP ${fetchResponse.status}: ${await fetchResponse.text()}`);
      }
      
      data = await fetchResponse.json();
    }

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

/**
 * Creates fallback course data when AI analysis fails.
 * Uses basic regex patterns to extract minimal information from the document text.
 */
const createFallbackData = (text: string): CourseData => {
  const titleMatch = text.match(/([A-Z][A-Za-z\s]{10,60})/);
  const codeMatch = text.match(/([A-Z]{2,4}\s*\d{3,4}[A-Z]?)/);
  const semesterMatch = text.match(/(spring|fall|summer|winter)\s*(\d{4})/i);
  const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
  
  return {
    course: { 
      title: titleMatch?.[1]?.trim() || "Course Title",
      code: codeMatch?.[1]?.trim() || "",
      semester: semesterMatch ? `${semesterMatch[1]} ${semesterMatch[2]}` : "Fall 2024",
      institution: ""
    },
    instructors: [{
      name: "Instructor",
      email: emailMatch?.[0] || "",
      office_hours: "",
      location: "",
      role: "professor" as const
    }],
    grading: [
      { component: "Assignments", weight: 0.4, description: "Regular assignments" },
      { component: "Exams", weight: 0.4, description: "Midterm and final exams" },
      { component: "Participation", weight: 0.2, description: "Class participation" }
    ],
    schedule: [{
      date: "2024-09-01",
      week: 1,
      topic: "Course Introduction",
      activities: ["lecture" as const],
      deliverables: [],
      readings: []
    }],
    policies: {
      late_work: "",
      attendance: "",
      honor_code: ""
    },
    important_dates: [
      { name: "Midterm Exam", date: "2024-10-15", type: "exam" as const },
      { name: "Final Exam", date: "2024-12-10", type: "exam" as const }
    ]
  };
};

/**
 * Validates and normalizes AI-extracted data to ensure type safety and completeness.
 * Provides sensible defaults for missing or invalid fields.
 */
const validateAndCleanData = (data: any): CourseData => {
  const DEFAULT_GRADING = [
    { component: "Assignments", weight: 0.4, description: "Regular assignments" },
    { component: "Exams", weight: 0.4, description: "Midterm and final exams" },
    { component: "Participation", weight: 0.2, description: "Class participation" }
  ];

  const DEFAULT_SCHEDULE = [{
    date: "2024-09-01",
    week: 1,
    topic: "Course Introduction",
    activities: ["lecture" as const],
    deliverables: [],
    readings: []
  }];

  const DEFAULT_DATES = [
    { name: "Midterm Exam", date: "2024-10-15", type: "exam" as const },
    { name: "Final Exam", date: "2024-12-10", type: "exam" as const }
  ];

  const VALID_DATE_TYPES = new Set(["exam", "deadline", "quiz", "project", "break", "other"]);

  return {
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
          role: inst.role === "ta" ? "ta" : "professor"
        }))
      : [{ name: "Instructor", email: "", office_hours: "", location: "", role: "professor" as const }],
    grading: Array.isArray(data.grading) && data.grading.length > 0
      ? data.grading.map((grade: any) => ({
          component: grade.component || "Component",
          weight: typeof grade.weight === 'number' ? grade.weight : 0.2,
          description: grade.description || ""
        }))
      : DEFAULT_GRADING,
    schedule: Array.isArray(data.schedule) && data.schedule.length > 0
      ? data.schedule.map((item: any) => ({
          date: item.date || "",
          week: typeof item.week === 'number' ? item.week : 1,
          topic: item.topic || "Topic",
          activities: Array.isArray(item.activities) ? item.activities : ["lecture"],
          deliverables: Array.isArray(item.deliverables) ? item.deliverables : [],
          readings: Array.isArray(item.readings) ? item.readings : []
        }))
      : DEFAULT_SCHEDULE,
    policies: {
      late_work: data.policies?.late_work || "",
      attendance: data.policies?.attendance || "",
      honor_code: data.policies?.honor_code || ""
    },
    important_dates: Array.isArray(data.important_dates) && data.important_dates.length > 0
      ? data.important_dates.map((item: any) => ({
          name: item.name || "Important Date",
          date: item.date || "",
          type: VALID_DATE_TYPES.has(item.type) ? item.type : "deadline"
        }))
      : DEFAULT_DATES
  };
};