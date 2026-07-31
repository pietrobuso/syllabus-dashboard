import { CourseData } from "@/types/course";

/**
 * Backfills fields that didn't exist yet when older courses were saved
 * (e.g. rows created before "content", "meeting_times" and
 * "course.start_date" were added), so the rest of the app can always
 * assume these exist instead of crashing on `undefined.map(...)`.
 */
export const normalizeCourseData = (data: any): CourseData => ({
  ...data,
  course: {
    ...data?.course,
    start_date: data?.course?.start_date ?? "",
  },
  content: Array.isArray(data?.content) ? data.content : [],
  meeting_times: Array.isArray(data?.meeting_times) ? data.meeting_times : [],
});
