import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { GradingComponent, StudentGrades } from "@/types/course";
import { Calculator, Target } from "lucide-react";
import {
  buildScoreEntries,
  calculateCurrentGrade,
  calculateRequiredScore,
  entryGrade,
  isGraded,
  DEFAULT_MAX_POINTS,
  ScoreEntry,
} from "@/utils/gradeCalculations";
import { cn } from "@/lib/utils";

interface GradeCalculatorProps {
  grading: GradingComponent[];
  grades: StudentGrades;
  onGradesChange: (grades: StudentGrades) => void;
}

const SAVE_DEBOUNCE_MS = 800;

export const GradeCalculator = ({ grading, grades, onGradesChange }: GradeCalculatorProps) => {
  const [scores, setScores] = useState<ScoreEntry[]>(() => buildScoreEntries(grading, grades.entries));
  const [targetGrade, setTargetGrade] = useState(grades.target);

  // Held in a ref so saving never re-triggers the effect below.
  const onGradesChangeRef = useRef(onGradesChange);
  onGradesChangeRef.current = onGradesChange;

  const isInitialRender = useRef(true);
  const unsavedRef = useRef<StudentGrades | null>(null);

  // Save shortly after typing stops, rather than on every keystroke.
  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }

    const payload: StudentGrades = {
      target: targetGrade,
      entries: scores.map(({ component, score, maxPoints }) => ({ component, score, maxPoints })),
    };
    unsavedRef.current = payload;

    const timer = setTimeout(() => {
      onGradesChangeRef.current(payload);
      unsavedRef.current = null;
    }, SAVE_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [scores, targetGrade]);

  // Switching tabs unmounts this component, which would cancel a pending
  // save mid-debounce and lose the last thing typed - so flush it.
  useEffect(
    () => () => {
      if (unsavedRef.current) onGradesChangeRef.current(unsavedRef.current);
    },
    []
  );

  const updateScore = (index: number, score: number | null) => {
    setScores(prev => prev.map((entry, i) => (i === index ? { ...entry, score } : entry)));
  };

  const updateMaxPoints = (index: number, maxPoints: number) => {
    setScores(prev => prev.map((entry, i) => (i === index ? { ...entry, maxPoints } : entry)));
  };

  const currentGrade = calculateCurrentGrade(scores);
  const requiredScore = calculateRequiredScore(scores, targetGrade);

  // Colour is judged against the target the student actually set, not
  // against fixed thresholds.
  const gradeColor = (grade: number) => {
    if (grade >= targetGrade) return "text-success";
    if (grade >= targetGrade - 1) return "text-warning";
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
              max="10"
              step="0.1"
              value={targetGrade}
              onChange={(e) => setTargetGrade(Number(e.target.value))}
              className="w-20 text-center"
            />
            <span className="text-sm text-muted-foreground">/ 10</span>
          </div>
        </div>

        {/* Score Entries */}
        <div className="space-y-4">
          <h3 className="font-medium text-foreground">Enter your scores:</h3>
          {scores.map((entry, index) => {
            const graded = isGraded(entry);

            return (
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
                  <Label className="text-xs text-muted-foreground">Out of</Label>
                  <Input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={entry.maxPoints}
                    onChange={(e) => updateMaxPoints(index, Number(e.target.value) || DEFAULT_MAX_POINTS)}
                    className="text-center"
                  />
                </div>

                <div className="text-sm text-center">
                  {graded ? (
                    <div>
                      <span className={cn("font-semibold", gradeColor(entryGrade(entry)))}>
                        {entryGrade(entry).toFixed(1)} / 10
                      </span>
                      <div className="text-xs text-muted-foreground">
                        {(entryGrade(entry) * entry.weight).toFixed(2)} pts of final
                      </div>
                    </div>
                  ) : requiredScore ? (
                    requiredScore.alreadyAchieved ? (
                      <div>
                        <span className="font-semibold text-success">Any score</span>
                        <div className="text-xs text-muted-foreground">target already secured</div>
                      </div>
                    ) : (
                      <div>
                        <span className={cn(
                          "font-semibold",
                          requiredScore.achievable ? "text-primary" : "text-destructive"
                        )}>
                          Need {requiredScore.score.toFixed(1)}
                        </span>
                        <div className="text-xs text-muted-foreground">
                          {requiredScore.achievable ? "to hit your target" : "not reachable"}
                        </div>
                      </div>
                    )
                  ) : (
                    <span className="text-muted-foreground text-xs">Not entered</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Results */}
        <div className="space-y-4 p-4 bg-gradient-card rounded-lg border border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium">Current Grade</span>
              <p className="text-xs text-muted-foreground">
                Weighted average of what's been graded so far
              </p>
            </div>
            {currentGrade === null ? (
              <span className="text-2xl font-bold text-muted-foreground">—</span>
            ) : (
              <span className={cn("text-2xl font-bold", gradeColor(currentGrade))}>
                {currentGrade.toFixed(1)} / 10
              </span>
            )}
          </div>

          {requiredScore && (
            <div className="border-t border-border/30 pt-4">
              {requiredScore.alreadyAchieved ? (
                <div className="p-2 bg-success/10 border border-success/20 rounded text-sm text-success">
                  You've already secured your target of {targetGrade.toFixed(1)} — whatever you score on what's left.
                </div>
              ) : requiredScore.achievable ? (
                <div className="p-2 bg-primary/10 border border-primary/20 rounded text-sm text-primary">
                  Score {requiredScore.score.toFixed(1)} in each remaining component to finish on {targetGrade.toFixed(1)}.
                </div>
              ) : (
                <div className="p-2 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
                  A target of {targetGrade.toFixed(1)} is no longer reachable, even with a perfect 10 on everything left.
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
