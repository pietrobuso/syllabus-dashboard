import { describe, it, expect } from "vitest";
import { normalizeCourseData } from "./normalizeCourseData";

describe("normalizeCourseData", () => {
  it("backfills content and meeting_times when a legacy row doesn't have them", () => {
    const legacyRow = {
      course: { title: "Old Course", code: "CS100", semester: "Fall 2023", institution: "" },
      instructors: [],
      grading: [],
      schedule: [],
      policies: { late_work: "", attendance: "", honor_code: "" },
      important_dates: [],
    };

    const result = normalizeCourseData(legacyRow);

    expect(result.content).toEqual([]);
    expect(result.meeting_times).toEqual([]);
    expect(result.course.start_date).toBe("");
    expect(result.course.title).toBe("Old Course");
  });

  it("leaves existing content and meeting_times untouched", () => {
    const data = {
      content: [{ title: "Unit 1" }],
      meeting_times: [{ day: "monday", start_time: "10:00", end_time: "11:00" }],
    };

    const result = normalizeCourseData(data);

    expect(result.content).toBe(data.content);
    expect(result.meeting_times).toBe(data.meeting_times);
  });
});
