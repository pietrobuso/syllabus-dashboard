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
  let title = "";
  let code = "";
  let semester = "";
  let institution = "";

  // More flexible course title extraction
  const titlePatterns = [
    /course\s+title\s*[:]\s*(.+)/i,
    /([A-Z]{2,4}\s*\d{3,4}[A-Z]?)\s*[-:]\s*(.+)/i,
    /^([A-Z][A-Z\s]{10,50})\s*$/m, // All caps titles
    /introduction\s+to\s+.+/i,
    /principles\s+of\s+.+/i,
    /fundamentals\s+of\s+.+/i
  ];

  // More flexible course code patterns
  const codePatterns = [
    /course\s+code\s*[:]\s*([A-Z]{2,4}\s*\d{3,4}[A-Z]?)/i,
    /([A-Z]{2,4}\s*\d{3,4}[A-Z]?)\s*[-:]/i,
    /^([A-Z]{2,4}\s*\d{3,4}[A-Z]?)$/m
  ];

  // Enhanced semester patterns
  const semesterPatterns = [
    /(spring|fall|summer|winter)\s*semester\s*(\d{4})/i,
    /(spring|fall|summer|winter)\s*(\d{4})/i,
    /semester\s*[:]\s*(spring|fall|summer|winter)\s*(\d{4})/i,
    /(\d{4})\s*(spring|fall|summer|winter)/i
  ];

  // Enhanced institution patterns
  const institutionPatterns = [
    /(university|college|institute|school)\s+of\s+[\w\s]+/i,
    /[\w\s]+(university|college|institute|school)/i,
    /^[\w\s]+(university|college)[\w\s]*$/im,
    /(state university|community college|technical institute)/i
  ];

  // Extract information from first 30 lines and full text
  const searchLines = [...lines.slice(0, 30), fullText];
  
  for (const searchText of searchLines) {
    // Try to extract course code
    if (!code) {
      for (const pattern of codePatterns) {
        const match = searchText.match(pattern);
        if (match) {
          code = match[1]?.trim() || match[0]?.trim();
          break;
        }
      }
    }

    // Try to extract title
    if (!title) {
      for (const pattern of titlePatterns) {
        const match = searchText.match(pattern);
        if (match) {
          // If we found a course code + title pattern
          if (match.length > 2) {
            title = match[2]?.trim();
          } else {
            title = match[1]?.trim();
          }
          // Clean up title
          if (title && title.length > 5 && title.length < 100) {
            title = title.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
            break;
          }
        }
      }
    }

    // Try to extract semester
    if (!semester) {
      for (const pattern of semesterPatterns) {
        const match = searchText.match(pattern);
        if (match) {
          if (match[3]) {
            semester = `${match[1]} ${match[2]}`;
          } else {
            semester = `${match[1]} ${match[2]}`;
          }
          break;
        }
      }
    }

    // Try to extract institution
    if (!institution) {
      for (const pattern of institutionPatterns) {
        const match = searchText.match(pattern);
        if (match) {
          institution = match[0]?.trim();
          // Clean up institution name
          if (institution && institution.length > 5 && institution.length < 100) {
            institution = institution.replace(/\s+/g, ' ').trim();
            break;
          }
        }
      }
    }
  }

  return {
    title: title || "Course Title",
    code: code || "",
    semester: semester || "Fall 2024",
    institution: institution || ""
  };
};

const extractInstructors = (lines: string[], fullText: string) => {
  const instructors = [];
  const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  
  // Find email addresses first
  const emails = Array.from(new Set(fullText.match(emailPattern) || []));
  
  // Enhanced name patterns
  const namePatterns = [
    /(prof\.|professor|dr\.|instructor)\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/gi,
    /(teacher|faculty)\s*[:]\s*([A-Z][a-z]+\s+[A-Z][a-z]+)/gi,
    /([A-Z][a-z]+\s+[A-Z][a-z]+),?\s+(ph\.?d\.?|professor|dr\.)/gi
  ];

  // Look for instructor information around emails
  for (const email of emails) {
    const emailIndex = fullText.indexOf(email);
    const contextStart = Math.max(0, emailIndex - 300);
    const contextEnd = Math.min(fullText.length, emailIndex + 300);
    const context = fullText.substring(contextStart, contextEnd);
    
    let name = "";
    
    // Try different name extraction patterns
    for (const namePattern of namePatterns) {
      const nameMatch = context.match(namePattern);
      if (nameMatch) {
        name = nameMatch[2] || nameMatch[1];
        break;
      }
    }
    
    // Fallback: use email prefix or look for capitalized words near email
    if (!name) {
      const wordsNearEmail = context.match(/\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g);
      if (wordsNearEmail && wordsNearEmail.length > 0) {
        name = wordsNearEmail[0];
      } else {
        name = email.split('@')[0].replace(/[._]/g, ' ');
      }
    }
    
    // Extract office hours with better patterns
    const officeHoursPatterns = [
      /office\s+hours?\s*[:]\s*([^.\n!]{5,50})/i,
      /hours?\s*[:]\s*([^.\n!]{5,50})/i,
      /(monday|tuesday|wednesday|thursday|friday|mon|tue|wed|thu|fri)[\s\w,:-]+\d{1,2}:\d{2}/i
    ];
    
    let office_hours = "";
    for (const pattern of officeHoursPatterns) {
      const match = context.match(pattern);
      if (match) {
        office_hours = match[1]?.trim() || match[0]?.trim();
        break;
      }
    }
    
    // Extract location with better patterns
    const locationPatterns = [
      /office\s*[:]\s*([A-Z]?\d+[A-Z]?|[A-Z][a-z]+\s+\d+|building\s+[A-Z]\s*,?\s*room\s+\d+)/i,
      /room\s*[:]\s*([A-Z]?\d+[A-Z]?|[A-Z][a-z]+\s+\d+)/i,
      /location\s*[:]\s*([^.\n!]{5,30})/i
    ];
    
    let location = "";
    for (const pattern of locationPatterns) {
      const match = context.match(pattern);
      if (match) {
        location = match[1]?.trim();
        break;
      }
    }
    
    // Determine role
    const role = context.toLowerCase().includes('ta') || 
                 context.toLowerCase().includes('teaching assistant') ||
                 context.toLowerCase().includes('graduate student') ? 'ta' : 'professor';
    
    instructors.push({
      name: name || "Instructor",
      email,
      office_hours: office_hours || "",
      location: location || "",
      role
    });
  }

  // If no emails found, try to extract names without emails
  if (instructors.length === 0) {
    for (const namePattern of namePatterns) {
      const matches = Array.from(fullText.matchAll(namePattern));
      for (const match of matches) {
        const name = match[2] || match[1];
        if (name && name.length > 3) {
          instructors.push({
            name: name.trim(),
            email: "",
            office_hours: "",
            location: "",
            role: "professor" as const
          });
          break; // Just get the first one
        }
      }
      if (instructors.length > 0) break;
    }
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
  
  // Enhanced grading component patterns
  const componentPatterns = [
    /(\w+(?:\s+\w+)*)\s*[-:]\s*(\d+)%/g,
    /(exam|quiz|assignment|homework|project|participation|attendance|midterm|final|essay|paper|lab|discussion)\s*[-:]\s*(\d+)%/gi,
    /(\w+(?:\s+\w+)*)\s+(\d+)%/g,
    /(\d+)%\s*[-:]\s*(\w+(?:\s+\w+)*)/g,
  ];

  const foundComponents = new Map<string, number>();

  // Search for grading breakdown sections
  const gradingSections = [
    /grading\s+(breakdown|policy|scheme|criteria)[^]*?(?=\n\s*\n|\n[A-Z]|\n\d|\Z)/gi,
    /grade\s+distribution[^]*?(?=\n\s*\n|\n[A-Z]|\n\d|\Z)/gi,
    /assessment[^]*?(?=\n\s*\n|\n[A-Z]|\n\d|\Z)/gi
  ];

  let gradingText = fullText;
  
  // Try to find dedicated grading sections first
  for (const sectionPattern of gradingSections) {
    const sectionMatch = fullText.match(sectionPattern);
    if (sectionMatch) {
      gradingText = sectionMatch[0];
      break;
    }
  }

  for (const pattern of componentPatterns) {
    let match;
    pattern.lastIndex = 0; // Reset regex state
    while ((match = pattern.exec(gradingText)) !== null) {
      let component = "";
      let weight = 0;
      
      // Handle different match groups based on pattern
      if (match[1] && match[2]) {
        component = match[1].trim();
        weight = parseInt(match[2]) / 100;
      } else if (match[2] && match[1]) {
        weight = parseInt(match[1]) / 100;
        component = match[2].trim();
      }
      
      // Clean up component name
      component = component.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
      const componentKey = component.toLowerCase();
      
      if (component && 
          weight > 0 && 
          weight <= 1 && 
          component.length > 2 && 
          component.length < 50 &&
          !foundComponents.has(componentKey)) {
        
        foundComponents.set(componentKey, weight);
        gradingComponents.push({
          component: component.charAt(0).toUpperCase() + component.slice(1),
          weight,
          description: `${component} component`
        });
      }
    }
  }

  // If no components found, look for common grading terms
  if (gradingComponents.length === 0) {
    const commonComponents = [
      { name: "Assignments", pattern: /assignment|homework|hw/i },
      { name: "Exams", pattern: /exam|test|midterm|final/i },
      { name: "Quizzes", pattern: /quiz/i },
      { name: "Projects", pattern: /project|paper|essay/i },
      { name: "Participation", pattern: /participation|attendance|discussion/i }
    ];

    for (const comp of commonComponents) {
      if (fullText.match(comp.pattern)) {
        gradingComponents.push({
          component: comp.name,
          weight: 0.2, // Default 20% each
          description: `${comp.name} component`
        });
      }
    }
  }

  // Ensure we have at least some basic components
  if (gradingComponents.length === 0) {
    return [
      { component: "Assignments", weight: 0.4, description: "Regular assignments and homework" },
      { component: "Exams", weight: 0.4, description: "Midterm and final exams" },
      { component: "Participation", weight: 0.2, description: "Class participation and attendance" }
    ];
  }

  return gradingComponents;
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