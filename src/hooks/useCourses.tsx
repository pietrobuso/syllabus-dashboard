import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { CourseData } from '@/types/course';

export interface Course {
  id: string;
  name: string;
  code: string;
  semester: string;
  data: CourseData;
  createdAt: string;
  lastModified: string;
}

interface CoursesContextType {
  courses: Course[];
  addCourse: (courseData: CourseData, fileName: string) => Course;
  updateCourse: (id: string, courseData: CourseData) => void;
  deleteCourse: (id: string) => void;
  getCourse: (id: string) => Course | undefined;
}

const CoursesContext = createContext<CoursesContextType | undefined>(undefined);

export const CoursesProvider = ({ children }: { children: ReactNode }) => {
  const [courses, setCourses] = useState<Course[]>([]);

  // Load courses from localStorage on mount
  useEffect(() => {
    const savedCourses = localStorage.getItem('syllabus-courses');
    if (savedCourses) {
      try {
        setCourses(JSON.parse(savedCourses));
      } catch (error) {
        console.error('Error loading courses from localStorage:', error);
      }
    }
  }, []);

  // Save courses to localStorage whenever courses change
  useEffect(() => {
    localStorage.setItem('syllabus-courses', JSON.stringify(courses));
  }, [courses]);

  const addCourse = (courseData: CourseData, fileName: string): Course => {
    const newCourse: Course = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: courseData.course.title || fileName.replace(/\.[^/.]+$/, ""),
      code: courseData.course.code || '',
      semester: courseData.course.semester || '',
      data: courseData,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    };

    setCourses(prev => [newCourse, ...prev]);
    return newCourse;
  };

  const updateCourse = (id: string, courseData: CourseData) => {
    setCourses(prev => 
      prev.map(course => 
        course.id === id 
          ? { 
              ...course, 
              data: courseData,
              name: courseData.course.title || course.name,
              code: courseData.course.code || course.code,
              semester: courseData.course.semester || course.semester,
              lastModified: new Date().toISOString() 
            }
          : course
      )
    );
  };

  const deleteCourse = (id: string) => {
    setCourses(prev => prev.filter(course => course.id !== id));
  };

  const getCourse = (id: string) => {
    return courses.find(course => course.id === id);
  };

  return (
    <CoursesContext.Provider value={{
      courses,
      addCourse,
      updateCourse,
      deleteCourse,
      getCourse
    }}>
      {children}
    </CoursesContext.Provider>
  );
};

export const useCourses = () => {
  const context = useContext(CoursesContext);
  if (context === undefined) {
    throw new Error('useCourses must be used within a CoursesProvider');
  }
  return context;
};