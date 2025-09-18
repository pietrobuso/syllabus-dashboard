// This would be an API route for AI analysis
// For now, we'll use a mock implementation that simulates AI analysis
export const analyzeDocument = async (documentText: string): Promise<string> => {
  // Simulate AI analysis with intelligent extraction
  const analysis = await intelligentExtraction(documentText);
  return JSON.stringify(analysis);
};

const intelligentExtraction = async (text: string) => {
  const lines = text.split('\n').filter(line => line.trim());
  const lowerText = text.toLowerCase();

  // Enhanced extraction logic
  const courseInfo = extractAdvancedCourseInfo(text, lines);
  const instructors = extractAdvancedInstructors(text, lines);
  const grading = extractAdvancedGrading(text, lines);
  const policies = extractAdvancedPolicies(text);

  return {
    course: courseInfo,
    instructors,
    grading,
    policies,
    schedule: [],
    important_dates: []
  };
};

const extractAdvancedCourseInfo = (text: string, lines: string[]) => {
  // More sophisticated title extraction
  let title = "";
  let code = "";
  let semester = "";
  let institution = "";

  // Look for course titles in first few lines
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const line = lines[i].trim();
    
    // Course code + title pattern
    const codeTitle = line.match(/^([A-Z]{2,4}\s*\d{3,4}[A-Z]?)\s*[-–:]\s*(.+)/);
    if (codeTitle && !code && !title) {
      code = codeTitle[1].trim();
      title = codeTitle[2].trim();
      continue;
    }
    
    // Standalone title (longer lines early in document)
    if (!title && line.length > 15 && line.length < 80 && 
        /^[A-Z]/.test(line) && !line.includes('@') && 
        !/^\d/.test(line)) {
      title = line;
    }
  }

  // Semester extraction with better patterns
  const semesterPatterns = [
    /(fall|spring|summer|winter)\s+(\d{4})/gi,
    /(\d{4})\s+(fall|spring|summer|winter)/gi,
    /(fall|spring|summer|winter)\s+semester\s+(\d{4})/gi
  ];

  for (const pattern of semesterPatterns) {
    const match = text.match(pattern);
    if (match) {
      if (match[2] && /^\d{4}$/.test(match[2])) {
        semester = `${match[1]} ${match[2]}`;
      } else if (match[1] && /^\d{4}$/.test(match[1])) {
        semester = `${match[2]} ${match[1]}`;
      }
      break;
    }
  }

  // Institution extraction
  const institutionPatterns = [
    /\b(.*?(?:university|college|institute|school).*?)\b/gi,
    /\b([A-Z][a-z]+\s+(?:University|College|Institute|School))\b/g
  ];

  for (const pattern of institutionPatterns) {
    const match = text.match(pattern);
    if (match && match[1] && match[1].length < 80) {
      institution = match[1].trim();
      break;
    }
  }

  return {
    title: title || "Course Title",
    code: code || "",
    semester: semester || "Fall 2024",
    institution: institution || ""
  };
};

const extractAdvancedInstructors = (text: string, lines: string[]) => {
  const instructors = [];
  const emails = Array.from(text.matchAll(/\b([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,})\b/g));
  
  for (const emailMatch of emails) {
    const email = emailMatch[1];
    const emailIndex = text.indexOf(email);
    
    // Get context around email (500 chars before and after)
    const contextStart = Math.max(0, emailIndex - 500);
    const contextEnd = Math.min(text.length, emailIndex + 500);
    const context = text.substring(contextStart, contextEnd);
    
    // Extract name near email
    let name = "";
    
    // Look for "Dr./Prof./Instructor Name" patterns
    const namePatterns = [
      /((?:dr\.?|prof\.?|professor|instructor)\s+([A-Z][a-z]+\s+[A-Z][a-z]+))/gi,
      /([A-Z][a-z]+\s+[A-Z][a-z]+)(?:\s*,?\s*(?:ph\.?d\.?|dr\.?|professor))/gi,
      /([A-Z][a-z]+\s+[A-Z][a-z]+)/g // Generic name pattern
    ];
    
    for (const pattern of namePatterns) {
      const match = context.match(pattern);
      if (match) {
        name = match[2] || match[1];
        if (name && name.length > 5 && name.length < 40) break;
      }
    }
    
    // Extract office hours
    let office_hours = "";
    const hoursMatch = context.match(/(?:office\s+hours?|hours?)\s*:?\s*([^.\n]{10,80})/i);
    if (hoursMatch) {
      office_hours = hoursMatch[1].trim();
    }
    
    // Extract office location
    let location = "";
    const locationMatch = context.match(/(?:office|room|location)\s*:?\s*([A-Z]?\d+[A-Z]?|[A-Z][a-z]+\s+\d+|building\s+[A-Z])/i);
    if (locationMatch) {
      location = locationMatch[1].trim();
    }
    
    // Determine role
    const role = context.toLowerCase().includes('ta') || 
                 context.toLowerCase().includes('teaching assistant') ? 'ta' : 'professor';
    
    instructors.push({
      name: name || "Instructor",
      email,
      office_hours,
      location,
      role
    });
  }
  
  // If no emails found, try to find instructor names
  if (instructors.length === 0) {
    const nameMatch = text.match(/((?:dr\.?|prof\.?|professor|instructor)\s+([A-Z][a-z]+\s+[A-Z][a-z]+))/i);
    if (nameMatch) {
      instructors.push({
        name: nameMatch[2] || nameMatch[1],
        email: "",
        office_hours: "",
        location: "",
        role: "professor" as const
      });
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

const extractAdvancedGrading = (text: string, lines: string[]) => {
  const gradingComponents = [];
  
  // Find grading sections
  const gradingSection = text.match(/(grading|grade\s+breakdown|assessment)[\s\S]{0,800}/gi);
  const searchText = gradingSection ? gradingSection[0] : text;
  
  // Enhanced patterns for grading components
  const patterns = [
    /([A-Za-z][A-Za-z\s]{2,30})\s*[-:]\s*(\d{1,2})%/g,
    /(\d{1,2})%\s*[-:]\s*([A-Za-z][A-Za-z\s]{2,30})/g,
    /(assignments?|homework|hw|exams?|tests?|quiz{1,2}es?|projects?|papers?|participation|attendance|midterms?|finals?)\s*[-:]\s*(\d{1,2})%/gi
  ];
  
  const foundComponents = new Map();
  
  for (const pattern of patterns) {
    let match;
    pattern.lastIndex = 0;
    while ((match = pattern.exec(searchText)) !== null) {
      let component = "";
      let weight = 0;
      
      if (match[1] && match[2] && !isNaN(parseInt(match[2]))) {
        component = match[1].trim();
        weight = parseInt(match[2]) / 100;
      } else if (match[2] && match[1] && !isNaN(parseInt(match[1]))) {
        component = match[2].trim();
        weight = parseInt(match[1]) / 100;
      }
      
      // Clean component name
      component = component.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
      const key = component.toLowerCase();
      
      if (component && weight > 0 && weight <= 1 && 
          component.length > 2 && component.length < 40 &&
          !foundComponents.has(key)) {
        
        foundComponents.set(key, true);
        gradingComponents.push({
          component: component.charAt(0).toUpperCase() + component.slice(1),
          weight,
          description: `${component} assessment component`
        });
      }
    }
  }
  
  // Default components if none found
  if (gradingComponents.length === 0) {
    return [
      { component: "Assignments", weight: 0.4, description: "Regular assignments and homework" },
      { component: "Exams", weight: 0.4, description: "Midterm and final examinations" },
      { component: "Participation", weight: 0.2, description: "Class participation and engagement" }
    ];
  }
  
  return gradingComponents;
};

const extractAdvancedPolicies = (text: string) => {
  const policies = {
    late_work: "",
    attendance: "",
    honor_code: ""
  };
  
  // Late work policy
  const lateMatches = [
    /late\s+work[^.!?]*[.!?]/gi,
    /late\s+assignment[^.!?]*[.!?]/gi,
    /late\s+submission[^.!?]*[.!?]/gi
  ];
  
  for (const pattern of lateMatches) {
    const match = text.match(pattern);
    if (match && match[0].length < 300) {
      policies.late_work = match[0].trim();
      break;
    }
  }
  
  // Attendance policy
  const attendanceMatches = [
    /attendance[^.!?]*[.!?]/gi,
    /absent[^.!?]*[.!?]/gi
  ];
  
  for (const pattern of attendanceMatches) {
    const match = text.match(pattern);
    if (match && match[0].length < 300) {
      policies.attendance = match[0].trim();
      break;
    }
  }
  
  // Honor code policy
  const honorMatches = [
    /(?:honor\s+code|academic\s+integrity|cheating|plagiarism)[^.!?]*[.!?]/gi
  ];
  
  for (const pattern of honorMatches) {
    const match = text.match(pattern);
    if (match && match[0].length < 300) {
      policies.honor_code = match[0].trim();
      break;
    }
  }
  
  return policies;
};