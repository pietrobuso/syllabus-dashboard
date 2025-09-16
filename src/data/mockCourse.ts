import { CourseData } from '@/types/course';

export const mockCourseData: CourseData = {
  course: {
    title: "Introduction to Machine Learning",
    code: "CS 229",
    semester: "Spring 2024",
    institution: "Stanford University"
  },
  instructors: [
    {
      name: "Dr. Andrew Ng",
      email: "ang@cs.stanford.edu",
      office_hours: "Tuesdays 2:00-4:00 PM",
      location: "Gates 156",
      role: "professor"
    },
    {
      name: "Sarah Chen",
      email: "schen@cs.stanford.edu", 
      office_hours: "Fridays 10:00 AM-12:00 PM",
      location: "Gates 204",
      role: "ta"
    }
  ],
  grading: [
    {
      component: "Problem Sets",
      weight: 0.30,
      description: "4 problem sets throughout the semester",
      drop_lowest: true
    },
    {
      component: "Midterm Exam",
      weight: 0.25,
      description: "In-class examination"
    },
    {
      component: "Final Project", 
      weight: 0.35,
      description: "Original research project with presentation"
    },
    {
      component: "Participation",
      weight: 0.10,
      description: "Class participation and discussion"
    }
  ],
  schedule: [
    {
      date: "2024-01-15",
      week: 1,
      topic: "Introduction to ML and Linear Regression",
      activities: ["lecture"],
      deliverables: [],
      readings: ["Chapter 1-2 of textbook"]
    },
    {
      date: "2024-01-17", 
      week: 1,
      topic: "Linear Regression Continued",
      activities: ["lecture", "quiz"],
      deliverables: [
        { name: "Problem Set 1", due: "2024-01-24", type: "assignment" }
      ]
    },
    {
      date: "2024-01-22",
      week: 2, 
      topic: "Logistic Regression",
      activities: ["lecture", "monitored"],
      deliverables: []
    },
    {
      date: "2024-01-24",
      week: 2,
      topic: "Neural Networks Basics", 
      activities: ["lecture"],
      deliverables: [
        { name: "Quiz 1", due: "2024-01-24", type: "quiz" }
      ]
    },
    {
      date: "2024-02-15",
      week: 6,
      topic: "Midterm Review",
      activities: ["lecture"],
      deliverables: []
    },
    {
      date: "2024-02-19",
      week: 7,
      topic: "Midterm Examination",
      activities: ["exam"],
      deliverables: [
        { name: "Midterm Exam", due: "2024-02-19", type: "exam" }
      ]
    }
  ],
  policies: {
    late_work: "Late assignments will be penalized 10% per day. No late work accepted after 3 days.",
    attendance: "Attendance is mandatory. More than 2 unexcused absences may result in grade reduction.",
    honor_code: "All work must be your own. Collaboration is encouraged on problem sets but solutions must be written independently."
  },
  important_dates: [
    { name: "Midterm Exam", date: "2024-02-19", type: "exam" },
    { name: "Final Project Due", date: "2024-04-15", type: "deadline" },
    { name: "Spring Break", date: "2024-03-25", type: "break" }
  ]
};