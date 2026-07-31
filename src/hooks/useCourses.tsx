import { createContext, useContext, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CourseData } from '@/types/course';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { normalizeCourseData } from '@/utils/normalizeCourseData';
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

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : 'Unknown error');

export const CoursesProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const coursesQueryKey = ['courses', user?.id] as const;

  const { data: courses = [] } = useQuery({
    queryKey: coursesQueryKey,
    queryFn: async (): Promise<Course[]> => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('user_id', user!.id)
        .order('last_modified', { ascending: false });

      if (error) throw error;

      return (data ?? []).map(course => ({
        id: course.id,
        name: course.name,
        code: course.code,
        semester: course.semester,
        data: normalizeCourseData(course.data),
        createdAt: course.created_at,
        lastModified: course.last_modified,
      }));
    },
    enabled: !!user,
  });

  const addCourseMutation = useMutation({
    mutationFn: async ({ courseData, fileName }: { courseData: CourseData; fileName: string }): Promise<Course> => {
      if (!user) throw new Error('You must be logged in to add courses');

      const { data, error } = await supabase
        .from('courses')
        .insert({
          user_id: user.id,
          name: courseData.course.title || fileName.replace(/\.[^/.]+$/, ''),
          code: courseData.course.code || '',
          semester: courseData.course.semester || '',
          data: courseData as unknown as Json,
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        name: data.name,
        code: data.code,
        semester: data.semester,
        data: normalizeCourseData(data.data),
        createdAt: data.created_at,
        lastModified: data.last_modified,
      };
    },
    onSuccess: (newCourse) => {
      queryClient.setQueryData<Course[]>(coursesQueryKey, (prev = []) => [newCourse, ...prev]);
    },
    onError: (error) => {
      toast({ title: 'Error adding course', description: errorMessage(error), variant: 'destructive' });
    },
  });

  const updateCourseMutation = useMutation({
    mutationFn: async ({ id, courseData }: { id: string; courseData: CourseData }) => {
      if (!user) throw new Error('You must be logged in to update courses');

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

      if (error) throw error;
      return { id, courseData };
    },
    onSuccess: ({ id, courseData }) => {
      const now = new Date().toISOString();
      queryClient.setQueryData<Course[]>(coursesQueryKey, (prev = []) =>
        prev.map(course =>
          course.id === id
            ? {
                ...course,
                data: courseData,
                name: courseData.course.title,
                code: courseData.course.code,
                semester: courseData.course.semester,
                lastModified: now,
              }
            : course
        )
      );
    },
    onError: (error) => {
      toast({ title: 'Error updating course', description: errorMessage(error), variant: 'destructive' });
    },
  });

  const deleteCourseMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('You must be logged in to delete courses');

      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return id;
    },
    onSuccess: (id) => {
      queryClient.setQueryData<Course[]>(coursesQueryKey, (prev = []) => prev.filter(course => course.id !== id));
    },
    onError: (error) => {
      toast({ title: 'Error deleting course', description: errorMessage(error), variant: 'destructive' });
    },
  });

  const addCourse = async (courseData: CourseData, fileName: string) => {
    try {
      return await addCourseMutation.mutateAsync({ courseData, fileName });
    } catch {
      return undefined;
    }
  };

  const updateCourse = async (id: string, courseData: CourseData) => {
    try {
      await updateCourseMutation.mutateAsync({ id, courseData });
    } catch {
      // error already surfaced via toast in onError
    }
  };

  const deleteCourse = async (id: string) => {
    try {
      await deleteCourseMutation.mutateAsync(id);
    } catch {
      // error already surfaced via toast in onError
    }
  };

  const getCourse = (id: string) => courses.find(course => course.id === id);

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
