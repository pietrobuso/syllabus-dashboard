import { CourseData, ActivityType } from '@/types/course';

export interface ParsedDocument {
  content: string;
  pages: Array<{
    page_number: number;
    content: string;
  }>;
  images?: Array<{
    filename: string;
    path: string;
  }>;
}

export const extractCourseData = (parsedDoc: ParsedDocument): CourseData | null => {
  const fullText = parsedDoc.content.toLowerCase();
  const lines = parsedDoc.content.split('\n').filter(line => line.trim());
  
  try {
    // Extract course info
    const course = extractCourseInfo(lines, fullText);
    
    // Extract instructors
    const instructors = extractInstructors(lines, fullText);
    
    // Extract grading information
    const grading = extractGrading(lines, fullText);
    
    // Extract schedule
    const schedule = extractSchedule(lines, fullText);
    
    // Extract policies
    const policies = extractPolicies(lines, fullText);
    
    // Extract important dates
    const important_dates = extractImportantDates(lines, fullText);

    return {
      course,
      instructors,
      grading,
      schedule,
      policies,
      important_dates
    };
  } catch (error) {
    console.error('Error extracting course data:', error);
    return null;
  }
};

const extractCourseInfo = (lines: string[], fullText: string) => {
  // Look for course title and code patterns
  const coursePattern = /([A-Z]{2,4}\s*\d{3,4}[A-Z]?)\s*[-:]?\s*(.+)/i;
  const semesterPattern = /(spring|fall|summer|winter)\s*(\d{4})/i;
  const institutionPattern = /(university|college|institute|school)\s+of\s+\w+|(\w+\s+)?(university|college)/i;

  let title = "";
  let code = "";
  let semester = "";
  let institution = "";

  // Search through lines for course information
  for (const line of lines.slice(0, 20)) { // Check first 20 lines
    const courseMatch = line.match(coursePattern);
    if (courseMatch && !code) {
      code = courseMatch[1].trim();
      title = courseMatch[2].trim();
    }

    const semesterMatch = line.match(semesterPattern);
    if (semesterMatch && !semester) {
      semester = `${semesterMatch[1]} ${semesterMatch[2]}`;
    }

    const institutionMatch = line.match(institutionPattern);
    if (institutionMatch && !institution) {
      institution = institutionMatch[0].trim();
    }
  }

  return {
    title: title || "Course",
    code: code || "",
    semester: semester || "2024",
    institution: institution || ""
  };
};

const extractInstructors = (lines: string[], fullText: string) => {
  const instructors = [];
  const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const phonePattern = /(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  
  // Find email addresses
  const emails = fullText.match(emailPattern) || [];
  
  // Look for instructor information around emails
  for (const email of emails) {
    const emailIndex = fullText.indexOf(email);
    const contextStart = Math.max(0, emailIndex - 200);
    const contextEnd = Math.min(fullText.length, emailIndex + 200);
    const context = fullText.substring(contextStart, contextEnd);
    
    // Extract name (look for patterns before email)
    const namePattern = /(prof\.|professor|dr\.|instructor)\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/i;
    const nameMatch = context.match(namePattern);
    const name = nameMatch ? nameMatch[2] : email.split('@')[0];
    
    // Extract office hours
    const officeHoursPattern = /(office\s+hours?|hours?)\s*:?\s*([^.!\n]*)/i;
    const officeHoursMatch = context.match(officeHoursPattern);
    const office_hours = officeHoursMatch ? officeHoursMatch[2].trim() : "";
    
    // Extract location
    const locationPattern = /(room|office|location)\s*:?\s*([A-Z]?\d+[A-Z]?|[A-Z][a-z]+\s+\d+)/i;
    const locationMatch = context.match(locationPattern);
    const location = locationMatch ? locationMatch[2].trim() : "";
    
    instructors.push({
      name,
      email,
      office_hours,
      location,
      role: context.includes('ta') || context.includes('assistant') ? 'ta' : 'professor'
    });
  }

  return instructors.length > 0 ? instructors : [{
    name: "Instructor",
    email: "",
    office_hours: "",
    location: "",
    role: "professor" as const
  }];
};

const extractGrading = (lines: string[], fullText: string) => {
  const gradingComponents = [];
  
  // Common grading component patterns
  const componentPatterns = [
    /(\w+(?:\s+\w+)*)\s*[-:]?\s*(\d+)%/g,
    /(exam|quiz|assignment|homework|project|participation|attendance)\s*[-:]?\s*(\d+)%/gi,
  ];

  const foundComponents = new Set<string>();

  for (const pattern of componentPatterns) {
    let match;
    while ((match = pattern.exec(fullText)) !== null) {
      const component = match[1].trim();
      const weight = parseInt(match[2]) / 100;
      
      if (!foundComponents.has(component.toLowerCase()) && weight > 0 && weight <= 1) {
        foundComponents.add(component.toLowerCase());
        gradingComponents.push({
          component,
          weight,
          description: `${component} component`
        });
      }
    }
  }

  return gradingComponents.length > 0 ? gradingComponents : [
    { component: "Assignments", weight: 0.4, description: "Regular assignments" },
    { component: "Exams", weight: 0.4, description: "Midterm and final exams" },
    { component: "Participation", weight: 0.2, description: "Class participation" }
  ];
};

const extractSchedule = (lines: string[], fullText: string): CourseData["schedule"] => {
  const schedule: CourseData["schedule"] = [];
  const datePattern = /(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}|[A-Z][a-z]{2,8}\s+\d{1,2})/g;
  
  // Look for schedule-like patterns
  let week = 1;
  for (const line of lines) {
    const dateMatch = line.match(datePattern);
    if (dateMatch) {
      const topic = line.replace(datePattern[0], '').trim();
      if (topic.length > 5) { // Meaningful topic
        schedule.push({
          date: dateMatch[0],
          week: week++,
          topic: topic.substring(0, 100), // Limit topic length
          activities: extractActivitiesFromLine(line),
          deliverables: [],
          readings: []
        });
      }
    }
  }

  return schedule.length > 0 ? schedule : [];
};

const extractActivitiesFromLine = (line: string): ActivityType[] => {
  const activities: ActivityType[] = [];
  const lowerLine = line.toLowerCase();
  
  if (lowerLine.includes('quiz')) activities.push('quiz');
  if (lowerLine.includes('exam')) activities.push('exam');
  if (lowerLine.includes('lecture')) activities.push('lecture');
  if (lowerLine.includes('lab')) activities.push('lab');
  if (lowerLine.includes('assignment')) activities.push('assignment');
  
  return activities.length > 0 ? activities : ['lecture'];
};

const extractPolicies = (lines: string[], fullText: string) => {
  const policies: { late_work: string; attendance: string; honor_code: string } = {
    late_work: "",
    attendance: "",
    honor_code: "",
  };
  
  // Look for policy sections
  const latePolicyMatch = fullText.match(/(late\s+work|late\s+assignment|late\s+policy)[^.!?]*[.!?]/i);
  if (latePolicyMatch) {
    policies.late_work = latePolicyMatch[0].trim();
  }

  const attendanceMatch = fullText.match(/(attendance|absent)[^.!?]*[.!?]/i);
  if (attendanceMatch) {
    policies.attendance = attendanceMatch[0].trim();
  }

  const honorCodeMatch = fullText.match(/(honor\s+code|academic\s+integrity|plagiarism)[^.!?]*[.!?]/i);
  if (honorCodeMatch) {
    policies.honor_code = honorCodeMatch[0].trim();
  }

  return policies;
};

const extractImportantDates = (lines: string[], fullText: string) => {
  const dates = [];
  const importantDatePattern = /(exam|project|assignment|quiz).*?(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2})/gi;
  
  let match;
  while ((match = importantDatePattern.exec(fullText)) !== null) {
    dates.push({
      name: match[1],
      date: match[2],
      type: match[1].toLowerCase().includes('exam') ? 'exam' : 'deadline'
    });
  }

  return dates;
};