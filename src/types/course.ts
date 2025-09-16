export interface Course {
  title: string;
  code: string;
  semester: string;
  institution: string;
}

export interface Instructor {
  name: string;
  email: string;
  office_hours: string;
  location: string;
  role?: 'professor' | 'ta';
}

export interface GradingComponent {
  component: string;
  weight: number;
  rubric?: string;
  drop_lowest?: boolean;
  description?: string;
}

export interface Deliverable {
  name: string;
  due: string;
  type: 'assignment' | 'quiz' | 'exam' | 'project';
}

export interface ScheduleItem {
  date: string;
  week: number;
  topic: string;
  activities: ActivityType[];
  deliverables: Deliverable[];
  readings?: string[];
}

export type ActivityType = 'quiz' | 'exam' | 'assignment' | 'monitored' | 'lecture' | 'lab';

export interface CourseData {
  course: Course;
  instructors: Instructor[];
  grading: GradingComponent[];
  schedule: ScheduleItem[];
  policies: {
    late_work: string;
    attendance: string;
    honor_code: string;
  };
  important_dates: {
    name: string;
    date: string;
    type: 'exam' | 'deadline' | 'break' | 'other';
  }[];
}