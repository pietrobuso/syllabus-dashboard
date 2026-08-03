import { describe, it, expect } from "vitest";
import { calculateCurrentGrade, calculateRequiredScore, entryGrade, isGraded } from "./gradeCalculations";

describe("calculateCurrentGrade", () => {
  it("returns null when nothing has been graded yet, rather than a zero", () => {
    expect(calculateCurrentGrade([{ component: "Exam", weight: 1, score: null, maxPoints: 10 }])).toBeNull();
  });

  it("computes a weighted average on a 0-10 scale", () => {
    const scores = [
      { component: "Exam", weight: 0.6, score: 9, maxPoints: 10 },
      { component: "Homework", weight: 0.4, score: 8, maxPoints: 10 },
    ];
    // 9 * 0.6 + 8 * 0.4 = 8.6
    expect(calculateCurrentGrade(scores)).toBeCloseTo(8.6, 5);
  });

  it("handles components marked out of something other than 10", () => {
    const scores = [{ component: "Exam", weight: 1, score: 45, maxPoints: 50 }];
    expect(calculateCurrentGrade(scores)).toBeCloseTo(9, 5);
  });

  it("ignores components that have not been graded yet", () => {
    const scores = [
      { component: "Exam", weight: 0.5, score: 10, maxPoints: 10 },
      { component: "Project", weight: 0.5, score: null, maxPoints: 10 },
    ];
    expect(calculateCurrentGrade(scores)).toBeCloseTo(10, 5);
  });
});

describe("calculateRequiredScore", () => {
  it("returns null once every component is already graded", () => {
    const scores = [{ component: "Exam", weight: 1, score: 8, maxPoints: 10 }];
    expect(calculateRequiredScore(scores, 6)).toBeNull();
  });

  it("computes the score needed in each remaining component", () => {
    const scores = [
      { component: "Midterm", weight: 0.5, score: 4, maxPoints: 10 },
      { component: "Final", weight: 0.5, score: null, maxPoints: 10 },
    ];
    // Secured 4 * 0.5 = 2. Target 6 needs 4 more over 0.5 weight -> 8.0
    const result = calculateRequiredScore(scores, 6);
    expect(result?.score).toBeCloseTo(8, 5);
    expect(result?.achievable).toBe(true);
    expect(result?.alreadyAchieved).toBe(false);
  });

  it("spreads the requirement across several remaining components", () => {
    const scores = [
      { component: "Midterm", weight: 0.4, score: 5, maxPoints: 10 },
      { component: "Final", weight: 0.3, score: null, maxPoints: 10 },
      { component: "Project", weight: 0.3, score: null, maxPoints: 10 },
    ];
    // Secured 5 * 0.4 = 2. Need 4 more over 0.6 weight -> 6.67 in each
    const result = calculateRequiredScore(scores, 6);
    expect(result?.score).toBeCloseTo(6.667, 2);
  });

  it("flags a target that is already secured", () => {
    const scores = [
      { component: "Midterm", weight: 0.8, score: 9, maxPoints: 10 },
      { component: "Final", weight: 0.2, score: null, maxPoints: 10 },
    ];
    // Secured 7.2 already exceeds the target of 6
    const result = calculateRequiredScore(scores, 6);
    expect(result?.alreadyAchieved).toBe(true);
    expect(result?.score).toBe(0);
  });

  it("flags an unreachable target and clamps the required score to 10", () => {
    const scores = [
      { component: "Midterm", weight: 0.5, score: 2, maxPoints: 10 },
      { component: "Final", weight: 0.5, score: null, maxPoints: 10 },
    ];
    // Secured 1; a target of 10 would need 18 on the final
    const result = calculateRequiredScore(scores, 10);
    expect(result?.achievable).toBe(false);
    expect(result?.score).toBe(10);
  });
});

describe("isGraded / entryGrade", () => {
  it("treats a missing, negative or unusable entry as ungraded", () => {
    expect(isGraded({ component: "A", weight: 1, score: null, maxPoints: 10 })).toBe(false);
    expect(isGraded({ component: "A", weight: 1, score: -1, maxPoints: 10 })).toBe(false);
    expect(isGraded({ component: "A", weight: 1, score: 5, maxPoints: 0 })).toBe(false);
    expect(isGraded({ component: "A", weight: 1, score: 0, maxPoints: 10 })).toBe(true);
  });

  it("converts a raw score onto the 0-10 scale", () => {
    expect(entryGrade({ component: "A", weight: 1, score: 17, maxPoints: 20 })).toBeCloseTo(8.5, 5);
  });
});
