export interface ScoreEntry {
  component: string;
  weight: number;
  score: number | null;
  maxPoints: number;
}

export interface RequiredScoreResult {
  score: number;
  achievable: boolean;
}

/**
 * Weighted average of entered scores, on a 0-10 scale.
 */
export const calculateCurrentGrade = (scores: ScoreEntry[]): number => {
  let totalWeightedScore = 0;
  let totalWeight = 0;

  scores.forEach((entry) => {
    if (entry.score !== null && entry.score >= 0) {
      const percentage = (entry.score / entry.maxPoints) * 100;
      totalWeightedScore += percentage * entry.weight;
      totalWeight += entry.weight;
    }
  });

  const percentageGrade = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
  return percentageGrade / 10;
};

/**
 * Average score (0-10 scale) needed on the remaining, ungraded components
 * to reach targetGrade (0-10 scale). Returns null when every component is
 * already graded.
 */
export const calculateRequiredScore = (
  scores: ScoreEntry[],
  targetGrade: number
): RequiredScoreResult | null => {
  const remainingComponents = scores.filter((entry) => entry.score === null || entry.score < 0);
  if (remainingComponents.length === 0) return null;

  const remainingWeight = remainingComponents.reduce((sum, entry) => sum + entry.weight, 0);
  if (remainingWeight === 0) return null;

  const currentWeightedScore = scores
    .filter((entry) => entry.score !== null && entry.score >= 0)
    .reduce((sum, entry) => sum + (entry.score! / entry.maxPoints) * 100 * entry.weight, 0);

  const targetPercentage = targetGrade * 10;
  const requiredPercentage = (targetPercentage - currentWeightedScore) / remainingWeight;

  return {
    score: Math.max(0, Math.min(100, requiredPercentage)) / 10,
    achievable: requiredPercentage <= 100,
  };
};
