import { CourseData } from "@/types/course";

/**
 * "content" was briefly a structured unit list ({ title, description,
 * topics, readings }[]) before becoming free text. Join any row saved
 * during that window back into a single block of text instead of
 * losing it.
 */
const normalizeContent = (content: any): string => {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((unit) => [unit?.title, unit?.description, ...(unit?.topics ?? [])].filter(Boolean).join(". "))
      .filter(Boolean)
      .join("\n\n");
  }
  return "";
};

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
  content: normalizeContent(data?.content),
  meeting_times: Array.isArray(data?.meeting_times) ? data.meeting_times : [],
});
