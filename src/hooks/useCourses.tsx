import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { CourseData } from '@/types/course';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

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
  addCourse: (courseData: CourseData, fileName: string) => Promise<Course | undefined>;
  updateCourse: (id: string, courseData: CourseData) => Promise<void>;
  deleteCourse: (id: string) => Promise<void>;
  getCourse: (id: string) => Course | undefined;
}

const CoursesContext = createContext<CoursesContextType | undefined>(undefined);

export const CoursesProvider = ({ children }: { children: ReactNode }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  // Load courses from Supabase when user is authenticated
  useEffect(() => {
    if (user) {
      loadCourses();
    } else {
      setCourses([]);
    }
  }, [user]);

  const loadCourses = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('user_id', user.id)
      .order('last_modified', { ascending: false });

    if (error) {
      console.error('Error loading courses:', error);
      toast({
        title: "Error loading courses",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    if (data) {
      setCourses(data.map(course => ({
        id: course.id,
        name: course.name,
        code: course.code,
        semester: course.semester,
        data: course.data as unknown as CourseData,
        createdAt: course.created_at,
        lastModified: course.last_modified,
      })));
    }
  };

  const addCourse = async (courseData: CourseData, fileName: string): Promise<Course | undefined> => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to add courses",
        variant: "destructive",
      });
      return;
    }

    const { data, error } = await supabase
      .from('courses')
      .insert({
        user_id: user.id,
        name: courseData.course.title || fileName.replace(/\.[^/.]+$/, ""),
        code: courseData.course.code || '',
        semester: courseData.course.semester || '',
        data: courseData as unknown as Json,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding course:', error);
      toast({
        title: "Error adding course",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    if (data) {
      const newCourse: Course = {
        id: data.id,
        name: data.name,
        code: data.code,
        semester: data.semester,
        data: data.data as unknown as CourseData,
        createdAt: data.created_at,
        lastModified: data.last_modified,
      };
      setCourses(prev => [newCourse, ...prev]);
      return newCourse;
    }
  };

  const updateCourse = async (id: string, courseData: CourseData) => {
    if (!user) return;

    const { error } = await supabase
      .from('courses')
      .update({
        name: courseData.course.title,
        code: courseData.course.code,
        semester: courseData.course.semester,
        data: courseData as unknown as Json,
      })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating course:', error);
      toast({
        title: "Error updating course",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

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

  const deleteCourse = async (id: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting course:', error);
      toast({
        title: "Error deleting course",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

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