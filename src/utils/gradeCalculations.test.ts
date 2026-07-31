import { describe, it, expect } from "vitest";
import { calculateCurrentGrade, calculateRequiredScore } from "./gradeCalculations";

describe("calculateCurrentGrade", () => {
  it("returns 0 when no scores have been entered", () => {
    expect(calculateCurrentGrade([{ component: "Exam", weight: 1, score: null, maxPoints: 100 }])).toBe(0);
  });

  it("computes a weighted average on a 0-10 scale", () => {
    const scores = [
      { component: "Exam", weight: 0.6, score: 90, maxPoints: 100 },
      { component: "Homework", weight: 0.4, score: 8, maxPoints: 10 },
    ];
    // Exam: 90% * 0.6 = 54; Homework: 80% * 0.4 = 32; total = 86% -> 8.6/10
    expect(calculateCurrentGrade(scores)).toBeCloseTo(8.6, 5);
  });

  it("ignores components that have not been graded yet", () => {
    const scores = [
      { component: "Exam", weight: 0.5, score: 100, maxPoints: 100 },
      { component: "Project", weight: 0.5, score: null, maxPoints: 100 },
    ];
    expect(calculateCurrentGrade(scores)).toBeCloseTo(10, 5);
  });
});

describe("calculateRequiredScore", () => {
  it("returns null once every component is already graded", () => {
    const scores = [{ component: "Exam", weight: 1, score: 80, maxPoints: 100 }];
    expect(calculateRequiredScore(scores, 7)).toBeNull();
  });

  it("computes the average needed on remaining components to hit the target", () => {
    const scores = [
      { component: "Midterm", weight: 0.5, score: 60, maxPoints: 100 },
      { component: "Final", weight: 0.5, score: null, maxPoints: 100 },
    ];
    // target 7/10 = 70%; locked-in 30%, need 40% more over 0.5 remaining weight -> 80% -> 8.0/10
    const result = calculateRequiredScore(scores, 7);
    expect(result?.score).toBeCloseTo(8, 5);
    expect(result?.achievable).toBe(true);
  });

  it("flags an unachievable target and clamps the required score to 10", () => {
    const scores = [
      { component: "Midterm", weight: 0.5, score: 20, maxPoints: 100 },
      { component: "Final", weight: 0.5, score: null, maxPoints: 100 },
    ];
    // target 10/10 = 100%; locked-in 10%, need 90% more over 0.5 remaining weight -> 180%, impossible
    const result = calculateRequiredScore(scores, 10);
    expect(result?.achievable).toBe(false);
    expect(result?.score).toBe(10);
  });
});
