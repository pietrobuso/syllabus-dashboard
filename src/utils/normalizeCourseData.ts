import { CourseData } from "@/types/course";

/**
 * Backfills fields that didn't exist yet when older courses were saved
 * (e.g. rows created before "content" and "meeting_times" were added),
 * so the rest of the app can always assume these arrays exist instead
 * of crashing on `undefined.map(...)`.
 */
export const normalizeCourseData = (data: any): CourseData => ({
  ...data,
  content: Array.isArray(data?.content) ? data.content : [],
  meeting_times: Array.isArray(data?.meeting_times) ? data.meeting_times : [],
});
