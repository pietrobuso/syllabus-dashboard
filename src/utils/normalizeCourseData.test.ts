import { describe, it, expect } from "vitest";
import { normalizeCourseData } from "./normalizeCourseData";

describe("normalizeCourseData", () => {
  it("backfills content, meeting_times and start_date when a legacy row doesn't have them", () => {
    const legacyRow = {
      course: { title: "Old Course", code: "CS100", semester: "Fall 2023", institution: "" },
      instructors: [],
      grading: [],
      schedule: [],
      policies: { late_work: "", attendance: "", honor_code: "" },
      important_dates: [],
    };

    const result = normalizeCourseData(legacyRow);

    expect(result.content).toBe("");
    expect(result.meeting_times).toEqual([]);
    expect(result.course.start_date).toBe("");
    expect(result.course.title).toBe("Old Course");
    expect(result.grades).toEqual({ target: 6, entries: [] });
  });

  it("keeps saved grades and drops malformed entries", () => {
    const result = normalizeCourseData({
      grades: {
        target: 7.5,
        entries: [
          { component: "Exams", score: 8, maxPoints: 10 },
          { score: 5, maxPoints: 10 },
        ],
      },
    });

    expect(result.grades.target).toBe(7.5);
    expect(result.grades.entries).toEqual([{ component: "Exams", score: 8, maxPoints: 10 }]);
  });

  it("leaves existing free-text content and meeting_times untouched", () => {
    const data = {
      content: "1. Unit one\n2. Unit two",
      meeting_times: [{ day: "monday", start_time: "10:00", end_time: "11:00" }],
    };

    const result = normalizeCourseData(data);

    expect(result.content).toBe(data.content);
    expect(result.meeting_times).toBe(data.meeting_times);
  });

  it("joins a briefly-structured content list back into text instead of dropping it", () => {
    const result = normalizeCourseData({
      content: [
        { title: "Unit 1: Functions", description: "Covers recursion.", topics: ["Recursion", "Closures"] },
        { title: "Unit 2: Types" },
      ],
    });

    expect(result.content).toBe(
      "Unit 1: Functions. Covers recursion.. Recursion. Closures\n\nUnit 2: Types"
    );
  });
});
