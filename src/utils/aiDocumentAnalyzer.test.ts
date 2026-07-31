import { describe, it, expect } from "vitest";
import { validateAndCleanData } from "./aiDocumentAnalyzer";

describe("validateAndCleanData", () => {
  it("leaves missing fields empty instead of inventing placeholder data", () => {
    const result = validateAndCleanData({});

    expect(result.course.title).toBe("");
    expect(result.course.semester).toBe("");
    expect(result.instructors).toEqual([]);
    expect(result.grading).toEqual([]);
    expect(result.schedule).toEqual([]);
    expect(result.content).toEqual([]);
    expect(result.meeting_times).toEqual([]);
    expect(result.important_dates).toEqual([]);
  });

  it("preserves valid extracted data instead of overwriting it", () => {
    const input = {
      course: { title: "Intro to AI", code: "CS101", semester: "Fall 2026", institution: "MIT" },
      instructors: [{ name: "Dr. Smith", email: "s@mit.edu", office_hours: "", location: "", role: "ta" }],
      grading: [{ component: "Exams", weight: 0.5, description: "" }],
      schedule: [{ date: "2026-09-01", week: 1, topic: "Intro", activities: ["lecture"], deliverables: [], readings: [] }],
      policies: { late_work: "no late work", attendance: "", honor_code: "" },
      important_dates: [{ name: "Final", date: "2026-12-01", type: "exam" }],
    };

    const result = validateAndCleanData(input);

    expect(result.course.title).toBe("Intro to AI");
    expect(result.instructors[0].role).toBe("ta");
    expect(result.policies.late_work).toBe("no late work");
  });

  it("drops grading components missing a name or a numeric weight instead of guessing one", () => {
    const result = validateAndCleanData({
      grading: [
        { component: "Exams", weight: 0.6, description: "" },
        { component: "", weight: 0.4 },
        { component: "Participation" },
      ],
    });

    expect(result.grading).toEqual([{ component: "Exams", weight: 0.6, description: "" }]);
  });

  it("drops schedule items and important dates missing their required text", () => {
    const result = validateAndCleanData({
      schedule: [{ week: 2, topic: "" }, { week: 3, topic: "Recursion" }],
      important_dates: [{ name: "", date: "2026-01-01", type: "exam" }, { name: "Quiz 1", date: "" }],
    });

    expect(result.schedule).toHaveLength(1);
    expect(result.schedule[0].topic).toBe("Recursion");
    expect(result.important_dates).toEqual([]);
  });

  it("falls back to 'other' for an unrecognized important_date type", () => {
    const result = validateAndCleanData({
      important_dates: [{ name: "Mystery Day", date: "2026-01-01", type: "not-a-real-type" }],
    });

    expect(result.important_dates[0].type).toBe("other");
  });

  it("accepts quiz and project as valid important_date types", () => {
    const result = validateAndCleanData({
      important_dates: [
        { name: "Pop Quiz", date: "2026-02-01", type: "quiz" },
        { name: "Capstone", date: "2026-03-01", type: "project" },
      ],
    });

    expect(result.important_dates.map((d) => d.type)).toEqual(["quiz", "project"]);
  });

  it("keeps content units with a title and drops ones without", () => {
    const result = validateAndCleanData({
      content: [
        { title: "Unit 1: Functions", topics: ["Recursion", ""], readings: ["Ch. 3"] },
        { description: "no title, should be dropped" },
      ],
    });

    expect(result.content).toEqual([
      { title: "Unit 1: Functions", description: "", topics: ["Recursion"], readings: ["Ch. 3"] },
    ]);
  });

  it("keeps only meeting_times with a valid day and HH:MM start/end times", () => {
    const result = validateAndCleanData({
      meeting_times: [
        { day: "monday", start_time: "14:00", end_time: "15:20", label: "Lecture" },
        { day: "someday", start_time: "14:00", end_time: "15:20" },
        { day: "tuesday", start_time: "2pm", end_time: "3pm" },
        { day: "friday", start_time: "10:00", end_time: "10:50" },
      ],
    });

    expect(result.meeting_times).toEqual([
      { day: "monday", start_time: "14:00", end_time: "15:20", label: "Lecture" },
      { day: "friday", start_time: "10:00", end_time: "10:50", label: "" },
    ]);
  });
});
