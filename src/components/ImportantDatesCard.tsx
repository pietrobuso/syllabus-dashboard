import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CourseData } from "@/types/course";
import { format, parseISO, isValid, isBefore, startOfDay, formatDistanceToNowStrict } from "date-fns";
import { CalendarClock } from "lucide-react";
import { cn } from "@/lib/utils";

type ImportantDate = CourseData["important_dates"][number];

interface ImportantDatesCardProps {
  importantDates: ImportantDate[];
  /** How many upcoming dates to show before collapsing the rest. */
  limit?: number;
}

const TYPE_CLASS: Record<ImportantDate["type"], string> = {
  exam: "bg-destructive/10 text-destructive border-destructive/20",
  quiz: "bg-warning/10 text-warning border-warning/20",
  deadline: "bg-warning/10 text-warning border-warning/20",
  project: "bg-accent/10 text-accent border-accent/20",
  break: "bg-success/10 text-success border-success/20",
  other: "bg-muted text-muted-foreground border-border",
};

export const ImportantDatesCard = ({ importantDates, limit = 6 }: ImportantDatesCardProps) => {
  const today = startOfDay(new Date());

  const parsed = importantDates
    .map(item => ({ ...item, parsedDate: parseISO(item.date) }))
    .filter(item => isValid(item.parsedDate))
    .sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime());

  const upcoming = parsed.filter(item => !isBefore(item.parsedDate, today));
  const past = parsed.filter(item => isBefore(item.parsedDate, today));
  const visible = upcoming.slice(0, limit);

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <CalendarClock className="w-5 h-5 text-primary" />
          Important Dates
        </CardTitle>
      </CardHeader>
      <CardContent>
        {visible.length > 0 ? (
          <div className="space-y-2">
            {visible.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between gap-3 p-2 rounded-lg border border-border/50"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(item.parsedDate, "EEE, d MMM yyyy")} ·{" "}
                    {formatDistanceToNowStrict(item.parsedDate, { addSuffix: true })}
                  </p>
                </div>
                <Badge variant="outline" className={cn("capitalize shrink-0", TYPE_CLASS[item.type])}>
                  {item.type}
                </Badge>
              </div>
            ))}

            {upcoming.length > visible.length && (
              <p className="text-xs text-muted-foreground pt-1">
                +{upcoming.length - visible.length} more upcoming
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            {past.length > 0
              ? `No upcoming dates — all ${past.length} have passed.`
              : "No important dates recorded."}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
