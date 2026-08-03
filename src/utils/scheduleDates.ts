import { parseISO, isValid, addDays } from "date-fns";
import { CourseData, MeetingTime, ScheduleItem } from "@/types/course";
import { nthOccurrence } from "@/utils/meetingTimes";

export interface ResolvedScheduleItem extends ScheduleItem {
  /** Actual date to display/use, or null when it can't be determined. */
  resolvedDate: Date | null;
  /**
   * True when resolvedDate was derived from the course start date rather
   * than stated in the syllabus, so the UI can mark it as an estimate.
   */
  isEstimated: boolean;
}

const parseDate = (value: string | undefined): Date | null => {
  if (!value) return null;
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : null;
};

/**
 * Works out when a schedule entry actually happens.
 *
 * A date stated in the syllabus always wins. Otherwise, if the user (or
 * the syllabus) gave a course start date, derive it from the entry's
 * session/week number: following the class's real meeting pattern when
 * meeting times are known, or one week per session when they aren't.
 * Derived dates are flagged so they're never shown as if the document
 * had stated them.
 */
export const resolveScheduleDate = (
  item: ScheduleItem,
  startDate: Date | null,
  meetingTimes: MeetingTime[]
): { resolvedDate: Date | null; isEstimated: boolean } => {
  const explicitDate = parseDate(item.date);
  if (explicitDate) {
    return { resolvedDate: explicitDate, isEstimated: false };
  }

  if (!startDate || !item.week || item.week < 1) {
    return { resolvedDate: null, isEstimated: false };
  }

  if (meetingTimes.length > 0) {
    const derived = nthOccurrence(meetingTimes, startDate, item.week);
    if (derived) {
      return { resolvedDate: derived, isEstimated: true };
    }
  }

  return { resolvedDate: addDays(startDate, (item.week - 1) * 7), isEstimated: true };
};

export const resolveScheduleDates = (courseData: CourseData): ResolvedScheduleItem[] => {
  const startDate = parseDate(courseData.course?.start_date);
  const meetingTimes = courseData.meeting_times ?? [];

  return (courseData.schedule ?? []).map(item => ({
    ...item,
    ...resolveScheduleDate(item, startDate, meetingTimes),
  }));
};
