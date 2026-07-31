import { describe, it, expect } from "vitest";
import { validateAndCleanData } from "./aiDocumentAnalyzer";

describe("validateAndCleanData", () => {
  it("fills in sensible defaults for a mostly-empty payload", () => {
    const result = validateAndCleanData({});

    expect(result.course.title).toBe("Course Title");
    expect(result.instructors).toHaveLength(1);
    expect(result.grading.length).toBeGreaterThan(0);
    expect(result.schedule).toHaveLength(1);
    expect(result.important_dates.length).toBeGreaterThan(0);
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

  it("falls back to 'deadline' for an unrecognized important_date type", () => {
    const result = validateAndCleanData({
      important_dates: [{ name: "Mystery Day", date: "2026-01-01", type: "not-a-real-type" }],
    });

    expect(result.important_dates[0].type).toBe("deadline");
  });
});
