import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GradingComponent } from "@/types/course";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";

interface GradeBreakdownProps {
  grading: GradingComponent[];
}

export const GradeBreakdown = ({ grading }: GradeBreakdownProps) => {
  const totalWeight = grading.reduce((sum, item) => sum + item.weight, 0);
  const isValidTotal = Math.abs(totalWeight - 1) < 0.001; // Allow for floating point precision

  // Convert to percentages for display
  const gradingWithPercentages = grading.map(item => ({
    ...item,
    percentage: Math.round(item.weight * 100)
  }));

  const getComponentColor = (component: string) => {
    const colors = {
      'quiz': 'bg-quiz',
      'exam': 'bg-exam',
      'assignment': 'bg-assignment',
      'project': 'bg-accent',
      'participation': 'bg-primary',
      'default': 'bg-muted-foreground'
    };
    
    const key = component.toLowerCase();
    return Object.keys(colors).find(k => key.includes(k)) ? 
      colors[key as keyof typeof colors] : colors.default;
  };

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold">Grade Breakdown</CardTitle>
          {!isValidTotal && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Weights don't sum to 100%
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Grade Components List */}
        <div className="space-y-3">
          {gradingWithPercentages.map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${getComponentColor(item.component)}`} />
                  <span className="font-medium text-foreground">{item.component}</span>
                  {item.drop_lowest && (
                    <Badge variant="secondary" className="text-xs">Drop Lowest</Badge>
                  )}
                </div>
                <span className="text-lg font-semibold text-primary">{item.percentage}%</span>
              </div>
              
              <Progress value={item.percentage} className="h-2" />
              
              {item.description && (
                <p className="text-sm text-muted-foreground pl-5">{item.description}</p>
              )}
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="pt-4 border-t border-border">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Total Weight:</span>
            <span className={`font-semibold ${isValidTotal ? 'text-success' : 'text-destructive'}`}>
              {Math.round(totalWeight * 100)}%
            </span>
          </div>
        </div>

        {!isValidTotal && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive">
              Grade weights should total 100%. Current total: {Math.round(totalWeight * 100)}%
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};