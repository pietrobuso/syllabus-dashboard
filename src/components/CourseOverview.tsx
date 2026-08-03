import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CourseData } from "@/types/course";
import { ResolvedScheduleItem } from "@/utils/scheduleDates";
import { CourseGradeSummary } from "./CourseGradeSummary";
import { GradeBreakdown } from "./GradeBreakdown";
import { ContactInfo } from "./ContactInfo";
import { CoursePolicies } from "./CoursePolicies";
import { ImportantDatesCard } from "./ImportantDatesCard";
import { MeetingTimesCard } from "./MeetingTimesCard";
import { format, isBefore, startOfDay, parseISO, isValid, formatDistanceToNowStrict } from "date-fns";
import { Award, Building2, CalendarRange, Clock, GraduationCap } from "lucide-react";

interface CourseOverviewProps {
  courseData: CourseData;
  schedule: ResolvedScheduleItem[];
}

export const CourseOverview = ({ courseData, schedule }: CourseOverviewProps) => {
  const today = startOfDay(new Date());

  const upcomingDeliverables = schedule
    .flatMap(item => item.deliverables.map(deliverable => ({ ...deliverable, parsedDue: parseISO(deliverable.due) })))
    .filter(deliverable => isValid(deliverable.parsedDue) && !isBefore(deliverable.parsedDue, today))
    .sort((a, b) => a.parsedDue.getTime() - b.parsedDue.getTime())
    .slice(0, 5);

  const remainingClasses = schedule.filter(
    item => item.resolvedDate && !isBefore(item.resolvedDate, today)
  ).length;

  return (
    <div className="space-y-6">
      {/* Course facts */}
      <Card className="shadow-soft">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-start gap-2">
              <CalendarRange className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-muted-foreground text-xs">Semester</p>
                <p className="font-medium text-foreground truncate">
                  {courseData.course.semester || "—"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Building2 className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-muted-foreground text-xs">Institution</p>
                <p className="font-medium text-foreground truncate">
                  {courseData.course.institution || "—"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <GraduationCap className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-muted-foreground text-xs">Classes left</p>
                <p className="font-medium text-foreground">
                  {remainingClasses} of {schedule.length}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-muted-foreground text-xs">Starts</p>
                <p className="font-medium text-foreground truncate">
                  {courseData.course.start_date
                    ? format(parseISO(courseData.course.start_date), "d MMM yyyy")
                    : "—"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          {/* Where you stand */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                Where You Stand
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CourseGradeSummary grading={courseData.grading} grades={courseData.grades} />
            </CardContent>
          </Card>

          <GradeBreakdown grading={courseData.grading} />
          <CoursePolicies policies={courseData.policies} />
        </div>

        <div className="space-y-6">
          <ImportantDatesCard importantDates={courseData.important_dates} />

          {/* Upcoming deliverables */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Upcoming Deliverables
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingDeliverables.length > 0 ? (
                <div className="space-y-2">
                  {upcomingDeliverables.map((deliverable, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between gap-3 p-2 rounded-lg border border-border/50"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{deliverable.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(deliverable.parsedDue, "EEE, d MMM")} ·{" "}
                          {formatDistanceToNowStrict(deliverable.parsedDue, { addSuffix: true })}
                        </p>
                      </div>
                      <Badge variant="secondary" className="capitalize shrink-0">
                        {deliverable.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nothing due coming up.
                </p>
              )}
            </CardContent>
          </Card>

          <MeetingTimesCard meetingTimes={courseData.meeting_times} />
          <ContactInfo instructors={courseData.instructors} />
        </div>
      </div>
    </div>
  );
};
