import { supabase } from '@/integrations/supabase/client';
import { SUPABASE_URL, getFunctionHeaders } from '@/integrations/supabase/config';
import { CourseData } from '@/types/course';

export interface AnalyzedDocument {
  extractedData: CourseData;
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
      extractionLog: data.extractionLog || ['Successfully analyzed with AI']
    };

  } catch (error) {
    console.error('AI analysis failed:', error);

    // Fallback to basic extraction
    return {
      extractedData: createFallbackData(documentText),
      extractionLog: [
        'AI analysis failed, using fallback extraction',
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      ]
    };
  }
};

/**
 * Creates fallback course data when AI analysis fails entirely (network/parse error).
 * Uses basic regex patterns to pull out only what can actually be found in the text -
 * everything else is left empty rather than filled with a plausible-looking guess,
 * so the user isn't misled into thinking unverified data is real.
 */
const createFallbackData = (text: string): CourseData => {
  const titleMatch = text.match(/([A-Z][A-Za-z\s]{10,60})/);
  const codeMatch = text.match(/([A-Z]{2,4}\s*\d{3,4}[A-Z]?)/);
  const semesterMatch = text.match(/(spring|fall|summer|winter)\s*(\d{4})/i);
  const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);

  return {
    course: {
      title: titleMatch?.[1]?.trim() || "",
      code: codeMatch?.[1]?.trim() || "",
      semester: semesterMatch ? `${semesterMatch[1]} ${semesterMatch[2]}` : "",
      institution: "",
      start_date: ""
    },
    instructors: emailMatch ? [{
      name: "",
      email: emailMatch[0],
      office_hours: "",
      location: "",
      role: "professor" as const
    }] : [],
    grading: [],
    schedule: [],
    content: [],
    meeting_times: [],
    policies: {
      late_work: "",
      attendance: "",
      honor_code: ""
    },
    important_dates: []
  };
};

const VALID_DATE_TYPES = new Set(["exam", "deadline", "quiz", "project", "break", "other"]);
const VALID_ACTIVITY_TYPES = new Set(["lecture", "lab", "quiz", "exam", "assignment", "monitored"]);
const VALID_DELIVERABLE_TYPES = new Set(["assignment", "quiz", "exam", "project"]);
const VALID_DAYS = new Set(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]);
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Validates and normalizes AI-extracted data to ensure type safety.
 *
 * Deliberately does NOT invent plausible-looking values for missing fields
 * (e.g. a fake "Fall 2024" semester or a made-up "Midterm Exam" date) - a
 * field the AI didn't find is left empty/omitted so the user can tell what
 * still needs to be filled in, instead of silently trusting a guess.
 */
export const validateAndCleanData = (data: any): CourseData => {
  return {
    course: {
      title: data.course?.title || "",
      code: data.course?.code || "",
      semester: data.course?.semester || "",
      institution: data.course?.institution || "",
      start_date: ISO_DATE_PATTERN.test(data.course?.start_date) ? data.course.start_date : ""
    },
    instructors: Array.isArray(data.instructors)
      ? data.instructors
          .filter((inst: any) => inst?.name || inst?.email)
          .map((inst: any) => ({
            name: inst.name || "",
            email: inst.email || "",
            office_hours: inst.office_hours || "",
            location: inst.location || "",
            role: inst.role === "ta" ? "ta" : "professor"
          }))
      : [],
    grading: Array.isArray(data.grading)
      ? data.grading
          .filter((grade: any) => grade?.component && typeof grade.weight === 'number')
          .map((grade: any) => ({
            component: grade.component,
            weight: grade.weight,
            description: grade.description || ""
          }))
      : [],
    schedule: Array.isArray(data.schedule)
      ? data.schedule
          .filter((item: any) => item?.topic)
          .map((item: any) => ({
            date: item.date || "",
            week: typeof item.week === 'number' ? item.week : 0,
            topic: item.topic,
            activities: Array.isArray(item.activities)
              ? item.activities.filter((a: string) => VALID_ACTIVITY_TYPES.has(a))
              : [],
            deliverables: Array.isArray(item.deliverables)
              ? item.deliverables
                  .filter((d: any) => d?.name)
                  .map((d: any) => ({
                    name: d.name,
                    due: d.due || "",
                    type: VALID_DELIVERABLE_TYPES.has(d.type) ? d.type : "assignment"
                  }))
              : [],
            readings: Array.isArray(item.readings) ? item.readings.filter(Boolean) : []
          }))
      : [],
    content: Array.isArray(data.content)
      ? data.content
          .filter((unit: any) => unit?.title)
          .map((unit: any) => ({
            title: unit.title,
            description: unit.description || "",
            topics: Array.isArray(unit.topics) ? unit.topics.filter(Boolean) : [],
            readings: Array.isArray(unit.readings) ? unit.readings.filter(Boolean) : []
          }))
      : [],
    meeting_times: Array.isArray(data.meeting_times)
      ? data.meeting_times
          .filter((m: any) => VALID_DAYS.has(m?.day) && TIME_PATTERN.test(m?.start_time) && TIME_PATTERN.test(m?.end_time))
          .map((m: any) => ({
            day: m.day,
            start_time: m.start_time,
            end_time: m.end_time,
            label: m.label || ""
          }))
      : [],
    policies: {
      late_work: data.policies?.late_work || "",
      attendance: data.policies?.attendance || "",
      honor_code: data.policies?.honor_code || ""
    },
    important_dates: Array.isArray(data.important_dates)
      ? data.important_dates
          .filter((item: any) => item?.name && item?.date)
          .map((item: any) => ({
            name: item.name,
            date: item.date,
            type: VALID_DATE_TYPES.has(item.type) ? item.type : "other"
          }))
      : []
  };
};