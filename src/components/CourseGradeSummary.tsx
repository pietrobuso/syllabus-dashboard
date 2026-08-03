import { GradingComponent, StudentGrades } from "@/types/course";
import {
  buildScoreEntries,
  calculateCurrentGrade,
  calculateRequiredScore,
  gradeStatus,
  isGraded,
  GradeStatus,
} from "@/utils/gradeCalculations";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

/** Shared so the calculator and the summaries never disagree on colour. */
export const GRADE_STATUS_TEXT_CLASS: Record<GradeStatus, string> = {
  "on-track": "text-success",
  close: "text-warning",
  behind: "text-destructive",
};

interface CourseGradeSummaryProps {
  grading: GradingComponent[];
  grades: StudentGrades;
  variant?: "compact" | "full";
}

export const CourseGradeSummary = ({ grading, grades, variant = "full" }: CourseGradeSummaryProps) => {
  const scores = buildScoreEntries(grading, grades.entries);
  const gradedCount = scores.filter(isGraded).length;
  const currentGrade = calculateCurrentGrade(scores);
  const required = calculateRequiredScore(scores, grades.target);

  const gradeClass =
    currentGrade === null
      ? "text-muted-foreground"
      : GRADE_STATUS_TEXT_CLASS[gradeStatus(currentGrade, grades.target)];

  if (variant === "compact") {
    return (
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm text-muted-foreground">
          {gradedCount > 0
            ? `${gradedCount} of ${scores.length} graded`
            : scores.length > 0
              ? "No grades entered"
              : "No grading breakdown"}
        </div>
        <div className={cn("text-lg font-bold shrink-0", gradeClass)}>
          {currentGrade === null ? "—" : `${currentGrade.toFixed(1)} / 10`}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Current grade</p>
          <p className={cn("text-4xl font-bold leading-tight", gradeClass)}>
            {currentGrade === null ? "—" : currentGrade.toFixed(1)}
            <span className="text-lg font-medium text-muted-foreground"> / 10</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Target</p>
          <p className="text-xl font-semibold text-foreground">{grades.target.toFixed(1)}</p>
        </div>
      </div>

      <div>
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>{gradedCount} of {scores.length} components graded</span>
          <span>
            {scores.length > 0 ? Math.round((gradedCount / scores.length) * 100) : 0}%
          </span>
        </div>
        <Progress value={scores.length > 0 ? (gradedCount / scores.length) * 100 : 0} className="h-2" />
      </div>

      {required && (
        <div
          className={cn(
            "text-sm p-2 rounded border",
            required.alreadyAchieved
              ? "bg-success/10 border-success/20 text-success"
              : required.achievable
                ? "bg-primary/10 border-primary/20 text-primary"
                : "bg-destructive/10 border-destructive/20 text-destructive"
          )}
        >
          {required.alreadyAchieved
            ? `Target of ${grades.target.toFixed(1)} already secured.`
            : required.achievable
              ? `Need ${required.score.toFixed(1)} in each remaining component.`
              : `Target of ${grades.target.toFixed(1)} is no longer reachable.`}
        </div>
      )}
    </div>
  );
};
