export interface Course {
  title: string;
  code: string;
  semester: string;
  institution: string;
  /**
   * First day of classes, YYYY-MM-DD. Empty when unknown.
   * Used to derive dates for schedule entries that only have a
   * session/week number (common in Brazilian syllabi, where the
   * "programação aula-a-aula" lists Aula 01..N with no dates).
   */
  start_date: string;
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

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface MeetingTime {
  day: DayOfWeek;
  start_time: string; // 24h "HH:MM"
  end_time: string; // 24h "HH:MM"
  label?: string; // e.g. "Lecture", "Lab", "Discussion Section"
}

export interface CourseData {
  course: Course;
  instructors: Instructor[];
  grading: GradingComponent[];
  schedule: ScheduleItem[];
  /**
   * Free-text copy of the syllabus's content/topic outline section
   * (e.g. "CONTEÚDO", "EMENTA"), verbatim rather than restructured -
   * these sections vary too much in format (numbered paragraphs,
   * bullet lists, etc.) for a structured schema to fit reliably.
   */
  content: string;
  meeting_times: MeetingTime[];
  policies: {
    late_work: string;
    attendance: string;
    honor_code: string;
  };
  important_dates: {
    name: string;
    date: string;
    type: 'exam' | 'deadline' | 'quiz' | 'project' | 'break' | 'other';
  }[];
}