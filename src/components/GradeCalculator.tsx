import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { GradingComponent } from "@/types/course";
import { Calculator, Target } from "lucide-react";

interface GradeCalculatorProps {
  grading: GradingComponent[];
}

interface ScoreEntry {
  component: string;
  weight: number;
  score: number | null;
  maxPoints: number;
}

export const GradeCalculator = ({ grading }: GradeCalculatorProps) => {
  const [scores, setScores] = useState<ScoreEntry[]>(
    grading.map(item => ({
      component: item.component,
      weight: item.weight,
      score: null,
      maxPoints: 100
    }))
  );
  const [targetGrade, setTargetGrade] = useState(70); // 7.0 out of 10 or 70%

  const updateScore = (index: number, score: number | null) => {
    const newScores = [...scores];
    newScores[index].score = score;
    setScores(newScores);
  };

  const updateMaxPoints = (index: number, maxPoints: number) => {
    const newScores = [...scores];
    newScores[index].maxPoints = maxPoints;
    setScores(newScores);
  };

  const calculateCurrentGrade = () => {
    let totalWeightedScore = 0;
    let totalWeight = 0;

    scores.forEach(entry => {
      if (entry.score !== null && entry.score >= 0) {
        const percentage = (entry.score / entry.maxPoints) * 100;
        totalWeightedScore += percentage * entry.weight;
        totalWeight += entry.weight;
      }
    });

    return totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
  };

  const calculateRequiredScore = () => {
    const remainingComponents = scores.filter(entry => entry.score === null || entry.score < 0);
    if (remainingComponents.length === 0) return null;

    const currentWeightedScore = scores
      .filter(entry => entry.score !== null && entry.score >= 0)
      .reduce((sum, entry) => sum + ((entry.score! / entry.maxPoints) * 100 * entry.weight), 0);

    const remainingWeight = remainingComponents.reduce((sum, entry) => sum + entry.weight, 0);

    if (remainingWeight === 0) return null;

    const requiredWeightedScore = (targetGrade - currentWeightedScore);
    const requiredPercentage = requiredWeightedScore / remainingWeight;

    return {
      percentage: Math.max(0, Math.min(100, requiredPercentage)),
      achievable: requiredPercentage <= 100
    };
  };

  const currentGrade = calculateCurrentGrade();
  const requiredScore = calculateRequiredScore();

  const getGradeColor = (grade: number) => {
    if (grade >= 90) return "text-success";
    if (grade >= 80) return "text-accent";
    if (grade >= 70) return "text-warning";
    return "text-destructive";
  };

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <Calculator className="w-5 h-5 text-primary" />
          Grade Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Target Grade Input */}
        <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            <Label htmlFor="target-grade" className="font-medium">Target Grade:</Label>
          </div>
          <div className="flex items-center gap-2">
            <Input
              id="target-grade"
              type="number"
              min="0"
              max="100"
              value={targetGrade}
              onChange={(e) => setTargetGrade(Number(e.target.value))}
              className="w-20 text-center"
            />
            <span className="text-sm text-muted-foreground">%</span>
          </div>
        </div>

        {/* Score Entries */}
        <div className="space-y-4">
          <h3 className="font-medium text-foreground">Enter your scores:</h3>
          {scores.map((entry, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end p-3 border border-border/50 rounded-lg">
              <div className="md:col-span-1">
                <Label className="text-sm font-medium">{entry.component}</Label>
                <Badge variant="secondary" className="mt-1 text-xs">
                  {Math.round(entry.weight * 100)}% weight
                </Badge>
              </div>
              
              <div>
                <Label className="text-xs text-muted-foreground">Score</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="Score"
                  value={entry.score === null ? "" : entry.score}
                  onChange={(e) => updateScore(index, e.target.value ? Number(e.target.value) : null)}
                  className="text-center"
                />
              </div>
              
              <div>
                <Label className="text-xs text-muted-foreground">Max Points</Label>
                <Input
                  type="number"
                  min="1"
                  step="0.1"
                  value={entry.maxPoints}
                  onChange={(e) => updateMaxPoints(index, Number(e.target.value) || 100)}
                  className="text-center"
                />
              </div>
              
              <div className="text-sm text-center">
                {entry.score !== null && entry.score >= 0 ? (
                  <div>
                    <span className="font-semibold">
                      {((entry.score / entry.maxPoints) * 100).toFixed(1)}%
                    </span>
                    <div className="text-xs text-muted-foreground">
                      {(((entry.score / entry.maxPoints) * 100) * entry.weight).toFixed(1)} pts
                    </div>
                  </div>
                ) : (
                  <span className="text-muted-foreground text-xs">Not entered</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Results */}
        <div className="space-y-4 p-4 bg-gradient-card rounded-lg border border-border/50">
          {/* Current Grade */}
          <div className="flex items-center justify-between">
            <span className="font-medium">Current Grade:</span>
            <span className={`text-2xl font-bold ${getGradeColor(currentGrade)}`}>
              {currentGrade.toFixed(1)}%
            </span>
          </div>

          {/* Required Score */}
          {requiredScore && (
            <div className="border-t border-border/30 pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Required Average for Remaining:</span>
                <span className={`text-xl font-semibold ${
                  requiredScore.achievable ? 'text-primary' : 'text-destructive'
                }`}>
                  {requiredScore.percentage.toFixed(1)}%
                </span>
              </div>
              
              {!requiredScore.achievable && (
                <div className="p-2 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
                  Target grade may not be achievable with current scores.
                </div>
              )}
              
              {requiredScore.achievable && requiredScore.percentage <= 70 && (
                <div className="p-2 bg-success/10 border border-success/20 rounded text-sm text-success">
                  Your target grade is easily achievable!
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};