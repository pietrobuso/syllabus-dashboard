import { parseISO, isValid, format, addMinutes } from "date-fns";
import { ActivityType, CourseData, Deliverable } from "@/types/course";
import { occurrencesInRange, meetingOnWeekday, applyTimeToDate } from "@/utils/meetingTimes";
import { resolveScheduleDates } from "@/utils/scheduleDates";

export type CalendarEventType = "class" | "deliverable" | "important_date";

export interface CalendarEvent {
  id: string;
  courseId: string;
  course: string;
  courseCode: string;
  type: CalendarEventType;
  title: string;
  /** The calendar day this event belongs to (time component is not meaningful). */
  date: Date;
  /** Set only for events with a known clock time; absent means all-day. */
  start?: Date;
  end?: Date;
  activities?: ActivityType[];
  deliverable?: Deliverable;
  eventType?: "exam" | "deadline" | "quiz" | "project" | "break" | "other";
  /** True when the date was derived from the course start date, not stated. */
  isEstimated?: boolean;
}

export interface CourseWithData {
  id: string;
  data: CourseData;
}

const DEFAULT_CLASS_MINUTES = 60;

const dayKey = (date: Date) => format(date, "yyyy-MM-dd");

/**
 * Builds every calendar event for the given courses.
 *
 * Classes come from the course schedule (using resolved dates, so
 * session-numbered entries appear once a start date is set) and, for days
 * the schedule doesn't cover, from the recurring weekly meeting times.
 * A class gets a clock time when a meeting time exists for that weekday;
 * otherwise it - like deliverables and important dates - is all-day.
 *
 * Recurring meetings are only generated within [rangeStart, rangeEnd],
 * since they repeat forever; dated items are always included.
 */
export const buildCalendarEvents = (
  courses: CourseWithData[],
  rangeStart: Date,
  rangeEnd: Date
): CalendarEvent[] => {
  const events: CalendarEvent[] = [];

  courses.forEach(course => {
    const courseData = course.data;
    if (!courseData) return;

    const meetings = courseData.meeting_times ?? [];
    const shared = {
      courseId: course.id,
      course: courseData.course?.title ?? "",
      courseCode: courseData.course?.code ?? "",
    };

    // Days already covered by a real schedule entry: a generic recurring
    // meeting on the same day would just duplicate it.
    const scheduledDays = new Set<string>();

    resolveScheduleDates(courseData).forEach((item, index) => {
      if (item.resolvedDate) {
        scheduledDays.add(dayKey(item.resolvedDate));

        const meeting = meetingOnWeekday(meetings, item.resolvedDate);
        const start = meeting ? applyTimeToDate(item.resolvedDate, meeting.start_time) : null;
        const end = meeting && start
          ? applyTimeToDate(item.resolvedDate, meeting.end_time) ?? addMinutes(start, DEFAULT_CLASS_MINUTES)
          : null;

        events.push({
          ...shared,
          id: `${course.id}-schedule-${index}`,
          type: "class",
          title: item.topic,
          date: item.resolvedDate,
          start: start ?? undefined,
          end: end ?? undefined,
          activities: item.activities,
          isEstimated: item.isEstimated,
        });
      }

      item.deliverables.forEach((deliverable, deliverableIndex) => {
        const due = parseISO(deliverable.due);
        if (!isValid(due)) return;
        events.push({
          ...shared,
          id: `${course.id}-deliverable-${index}-${deliverableIndex}`,
          type: "deliverable",
          title: `${deliverable.name} Due`,
          date: due,
          deliverable,
        });
      });
    });

    courseData.important_dates?.forEach((importantDate, index) => {
      const date = parseISO(importantDate.date);
      if (!isValid(date)) return;
      events.push({
        ...shared,
        id: `${course.id}-important-${index}`,
        type: "important_date",
        title: importantDate.name,
        date,
        eventType: importantDate.type,
      });
    });

    occurrencesInRange(meetings, rangeStart, rangeEnd).forEach(({ date, meeting }) => {
      if (scheduledDays.has(dayKey(date))) return;

      const end = applyTimeToDate(date, meeting.end_time) ?? addMinutes(date, DEFAULT_CLASS_MINUTES);
      events.push({
        ...shared,
        id: `${course.id}-meeting-${meeting.day}-${meeting.start_time}-${date.toISOString()}`,
        type: "class",
        title: meeting.label || `${courseData.course?.code || courseData.course?.title || "Class"} Class`,
        date,
        start: date,
        end,
      });
    });
  });

  return events.sort((a, b) => {
    const byDay = a.date.getTime() - b.date.getTime();
    if (byDay !== 0) return byDay;
    // All-day events sort above timed ones within the same day.
    if (!a.start && b.start) return -1;
    if (a.start && !b.start) return 1;
    return 0;
  });
};
