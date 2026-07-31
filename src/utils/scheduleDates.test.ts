import { describe, it, expect } from "vitest";
import { resolveScheduleDate, resolveScheduleDates } from "./scheduleDates";
import { CourseData, MeetingTime, ScheduleItem } from "@/types/course";

const item = (overrides: Partial<ScheduleItem> = {}): ScheduleItem => ({
  date: "",
  week: 1,
  topic: "Topic",
  activities: [],
  deliverables: [],
  ...overrides,
});

// Wednesday 2026-08-05 (matches the Latin America syllabus start)
const START = new Date(2026, 7, 5);

describe("resolveScheduleDate", () => {
  it("uses an explicit date from the syllabus and does not mark it estimated", () => {
    const result = resolveScheduleDate(item({ date: "2026-09-30", week: 8 }), START, []);
    expect(result.resolvedDate?.getMonth()).toBe(8); // September
    expect(result.resolvedDate?.getDate()).toBe(30);
    expect(result.isEstimated).toBe(false);
  });

  it("derives one week per session when no meeting times are known", () => {
    const result = resolveScheduleDate(item({ week: 3 }), START, []);
    // Week 3 = start + 14 days = 2026-08-19
    expect(result.resolvedDate?.getDate()).toBe(19);
    expect(result.isEstimated).toBe(true);
  });

  it("follows the real meeting pattern for a class that meets twice a week", () => {
    const meetings: MeetingTime[] = [
      { day: "wednesday", start_time: "09:00", end_time: "10:40" },
      { day: "friday", start_time: "09:00", end_time: "10:40" },
    ];
    // Session 1 = Wed Aug 5, session 2 = Fri Aug 7, session 3 = Wed Aug 12
    expect(resolveScheduleDate(item({ week: 1 }), START, meetings).resolvedDate?.getDate()).toBe(5);
    expect(resolveScheduleDate(item({ week: 2 }), START, meetings).resolvedDate?.getDate()).toBe(7);
    expect(resolveScheduleDate(item({ week: 3 }), START, meetings).resolvedDate?.getDate()).toBe(12);
  });

  it("keeps the weekly cadence for a once-a-week class", () => {
    const meetings: MeetingTime[] = [{ day: "wednesday", start_time: "09:00", end_time: "10:40" }];
    expect(resolveScheduleDate(item({ week: 2 }), START, meetings).resolvedDate?.getDate()).toBe(12);
    expect(resolveScheduleDate(item({ week: 3 }), START, meetings).resolvedDate?.getDate()).toBe(19);
  });

  it("returns no date when there's no explicit date and no start date", () => {
    const result = resolveScheduleDate(item({ week: 4 }), null, []);
    expect(result.resolvedDate).toBeNull();
    expect(result.isEstimated).toBe(false);
  });

  it("returns no date when the entry has no usable session number", () => {
    expect(resolveScheduleDate(item({ week: 0 }), START, []).resolvedDate).toBeNull();
  });

  it("ignores an unparseable explicit date and falls back to deriving one", () => {
    const result = resolveScheduleDate(item({ date: "Week 2", week: 2 }), START, []);
    expect(result.resolvedDate?.getDate()).toBe(12);
    expect(result.isEstimated).toBe(true);
  });
});

describe("resolveScheduleDates", () => {
  it("resolves a whole course's schedule", () => {
    const courseData = {
      course: { title: "T", code: "C", semester: "2nd 2026", institution: "", start_date: "2026-08-05" },
      schedule: [item({ week: 1 }), item({ week: 2, date: "2026-12-01" })],
      meeting_times: [],
    } as unknown as CourseData;

    const resolved = resolveScheduleDates(courseData);

    expect(resolved[0].isEstimated).toBe(true);
    expect(resolved[0].resolvedDate?.getDate()).toBe(5);
    expect(resolved[1].isEstimated).toBe(false);
    expect(resolved[1].resolvedDate?.getMonth()).toBe(11); // December
  });
});
