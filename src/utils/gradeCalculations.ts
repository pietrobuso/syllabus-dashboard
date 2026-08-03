import { GradeEntry, GradingComponent } from "@/types/course";

export const DEFAULT_TARGET_GRADE = 6;
export const DEFAULT_MAX_POINTS = 10;

export interface ScoreEntry {
  component: string;
  weight: number;
  score: number | null;
  maxPoints: number;
}

/**
 * Pairs the syllabus's grading components with any scores the student
 * has already saved, matching them by component name. A component the
 * student hasn't scored yet starts blank; a saved score whose component
 * no longer exists in the syllabus is dropped.
 */
export const buildScoreEntries = (
  grading: GradingComponent[],
  saved: GradeEntry[]
): ScoreEntry[] =>
  grading.map((component) => {
    const stored = saved.find((entry) => entry.component === component.component);
    return {
      component: component.component,
      weight: component.weight,
      score: stored?.score ?? null,
      maxPoints: stored?.maxPoints ?? DEFAULT_MAX_POINTS,
    };
  });

export interface RequiredScoreResult {
  /** Score needed in each remaining component, on a 0-10 scale. */
  score: number;
  /** False when even a perfect score everywhere remaining falls short. */
  achievable: boolean;
  /** True when the target is already secured whatever happens next. */
  alreadyAchieved: boolean;
}

export const isGraded = (entry: ScoreEntry): boolean =>
  entry.score !== null && entry.score >= 0 && entry.maxPoints > 0;

/** A single component's score on a 0-10 scale. */
export const entryGrade = (entry: ScoreEntry): number =>
  (entry.score! / entry.maxPoints) * 10;

/**
 * Weighted average of the components graded so far, on a 0-10 scale.
 * Returns null when nothing has been entered yet - that's "no grade
 * yet", which is not the same as scoring a zero.
 */
export const calculateCurrentGrade = (scores: ScoreEntry[]): number | null => {
  let weightedTotal = 0;
  let totalWeight = 0;

  scores.forEach((entry) => {
    if (isGraded(entry)) {
      weightedTotal += entryGrade(entry) * entry.weight;
      totalWeight += entry.weight;
    }
  });

  return totalWeight > 0 ? weightedTotal / totalWeight : null;
};

/**
 * The score needed in each still-ungraded component to finish on
 * targetGrade, assuming the same score in all of them. Since it's a
 * weighted average, that score is the same number for every remaining
 * component - what differs is how much each one moves the final grade.
 *
 * Returns null when there's nothing left to grade.
 */
export const calculateRequiredScore = (
  scores: ScoreEntry[],
  targetGrade: number
): RequiredScoreResult | null => {
  const remaining = scores.filter((entry) => !isGraded(entry));
  if (remaining.length === 0) return null;

  const remainingWeight = remaining.reduce((sum, entry) => sum + entry.weight, 0);
  if (remainingWeight === 0) return null;

  const securedGrade = scores
    .filter(isGraded)
    .reduce((sum, entry) => sum + entryGrade(entry) * entry.weight, 0);

  const required = (targetGrade - securedGrade) / remainingWeight;

  return {
    score: Math.max(0, Math.min(10, required)),
    achievable: required <= 10,
    alreadyAchieved: required <= 0,
  };
};
