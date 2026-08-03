import { describe, it, expect } from "vitest";
import { buildCalendarEvents, CourseWithData } from "./calendarEvents";
import { CourseData } from "@/types/course";

const courseData = (overrides: Partial<CourseData> = {}): CourseData => ({
  course: { title: "Service Management", code: "CGA", semester: "2nd 2026", institution: "", start_date: "" },
  instructors: [],
  grading: [],
  schedule: [],
  content: "",
  meeting_times: [],
  policies: { late_work: "", attendance: "", honor_code: "" },
  important_dates: [],
  grades: { target: 6, entries: [] },
  ...overrides,
});

const course = (data: CourseData, id = "c1"): CourseWithData => ({ id, data });

// Wednesday 2026-08-05 .. Wednesday 2026-09-02. The end is the *end* of
// that day: the range boundary is a precise instant, so a midnight end
// would exclude a class held at 09:00 on that same day.
const RANGE_START = new Date(2026, 7, 5);
const RANGE_END = new Date(2026, 8, 2, 23, 59, 59);

describe("buildCalendarEvents", () => {
  it("gives a schedule class the clock time of that weekday's meeting", () => {
    const events = buildCalendarEvents(
      [course(courseData({
        course: { title: "T", code: "CGA", semester: "", institution: "", start_date: "2026-08-05" },
        meeting_times: [{ day: "wednesday", start_time: "09:00", end_time: "10:40" }],
        schedule: [{ date: "", week: 1, topic: "Intro", activities: ["lecture"], deliverables: [] }],
      }))],
      RANGE_START,
      RANGE_END
    );

    const classEvent = events.find(event => event.title === "Intro");
    expect(classEvent?.start?.getHours()).toBe(9);
    expect(classEvent?.end?.getHours()).toBe(10);
    expect(classEvent?.end?.getMinutes()).toBe(40);
  });

  it("leaves a class all-day when no meeting time covers its weekday", () => {
    const events = buildCalendarEvents(
      [course(courseData({
        schedule: [{ date: "2026-08-10", week: 1, topic: "Untimed", activities: [], deliverables: [] }],
      }))],
      RANGE_START,
      RANGE_END
    );

    const classEvent = events.find(event => event.title === "Untimed");
    expect(classEvent).toBeDefined();
    expect(classEvent?.start).toBeUndefined();
  });

  it("does not emit a recurring meeting on a day the schedule already covers", () => {
    const events = buildCalendarEvents(
      [course(courseData({
        course: { title: "T", code: "CGA", semester: "", institution: "", start_date: "2026-08-05" },
        meeting_times: [{ day: "wednesday", start_time: "09:00", end_time: "10:40" }],
        schedule: [{ date: "", week: 1, topic: "Intro", activities: [], deliverables: [] }],
      }))],
      RANGE_START,
      RANGE_END
    );

    const onFirstWednesday = events.filter(
      event => event.type === "class" && event.date.getDate() === 5 && event.date.getMonth() === 7
    );
    expect(onFirstWednesday).toHaveLength(1);
    expect(onFirstWednesday[0].title).toBe("Intro");
  });

  it("still fills uncovered weeks from the recurring meeting times", () => {
    const events = buildCalendarEvents(
      [course(courseData({
        meeting_times: [{ day: "wednesday", start_time: "09:00", end_time: "10:40", label: "Lecture" }],
      }))],
      RANGE_START,
      RANGE_END
    );

    const lectures = events.filter(event => event.title === "Lecture");
    // Wednesdays from 5 Aug to 2 Sep 2026: 5, 12, 19, 26, 2
    expect(lectures).toHaveLength(5);
    expect(lectures.every(event => event.start?.getHours() === 9)).toBe(true);
  });

  it("treats deliverables and important dates as all-day events", () => {
    const events = buildCalendarEvents(
      [course(courseData({
        schedule: [{
          date: "2026-08-12",
          week: 1,
          topic: "Week 1",
          activities: [],
          deliverables: [{ name: "Essay", due: "2026-08-20", type: "assignment" }],
        }],
        important_dates: [{ name: "Final Exam", date: "2026-09-01", type: "exam" }],
      }))],
      RANGE_START,
      RANGE_END
    );

    const deliverable = events.find(event => event.type === "deliverable");
    const important = events.find(event => event.type === "important_date");
    expect(deliverable?.start).toBeUndefined();
    expect(deliverable?.title).toBe("Essay Due");
    expect(important?.start).toBeUndefined();
    expect(important?.eventType).toBe("exam");
  });

  it("skips unparseable deliverable and important dates instead of crashing", () => {
    const events = buildCalendarEvents(
      [course(courseData({
        schedule: [{
          date: "2026-08-12",
          week: 1,
          topic: "Week 1",
          activities: [],
          deliverables: [{ name: "Broken", due: "sometime", type: "assignment" }],
        }],
        important_dates: [{ name: "Broken", date: "", type: "exam" }],
      }))],
      RANGE_START,
      RANGE_END
    );

    expect(events.filter(event => event.title.includes("Broken"))).toHaveLength(0);
  });

  it("keeps each course's events tagged with its own id", () => {
    const events = buildCalendarEvents(
      [
        course(courseData({ important_dates: [{ name: "A", date: "2026-08-10", type: "exam" }] }), "c1"),
        course(courseData({ important_dates: [{ name: "B", date: "2026-08-11", type: "exam" }] }), "c2"),
      ],
      RANGE_START,
      RANGE_END
    );

    expect(events.find(event => event.title === "A")?.courseId).toBe("c1");
    expect(events.find(event => event.title === "B")?.courseId).toBe("c2");
  });
});
