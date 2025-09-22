import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CourseData } from "@/types/course";
import { Calendar, Clock, GraduationCap, Users } from "lucide-react";
import { format, parseISO, isAfter, startOfDay, isSameDay } from "date-fns";

interface CourseStatsProps {
  courseData: CourseData;
}

export const CourseStats = ({ courseData }: CourseStatsProps) => {
  const today = new Date();
  
  // Find next class (today or future)
  const upcomingClasses = courseData.schedule
    .filter(item => {
      try {
        const classDate = parseISO(item.date);
        return isSameDay(classDate, today) || isAfter(classDate, startOfDay(today));
      } catch {
        return false;
      }
    })
    .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());

  const nextClass = upcomingClasses[0];
  
  // Find next deliverable
  const allDeliverables = courseData.schedule
    .flatMap(item => item.deliverables.map(deliverable => ({
      ...deliverable,
      classDate: item.date,
      topic: item.topic
    })))
    .filter(deliverable => {
      try {
        const dueDate = parseISO(deliverable.due);
        return isSameDay(dueDate, today) || isAfter(dueDate, startOfDay(today));
      } catch {
        return false;
      }
    })
    .sort((a, b) => parseISO(a.due).getTime() - parseISO(b.due).getTime());

  const nextDeliverable = allDeliverables[0];

  // Count activities
  const activityCounts = courseData.schedule.reduce((counts, item) => {
    item.activities.forEach(activity => {
      counts[activity] = (counts[activity] || 0) + 1;
    });
    return counts;
  }, {} as Record<string, number>);

  const formatDateShort = (dateString: string) => {
    try {
      return format(parseISO(dateString), "MMM dd");
    } catch {
      return dateString;
    }
  };

  const StatCard = ({ 
    icon: Icon, 
    title, 
    value, 
    subtitle, 
    color = "primary" 
  }: { 
    icon: any; 
    title: string; 
    value: string; 
    subtitle?: string;
    color?: string;
  }) => (
    <Card className="shadow-soft hover:shadow-medium transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-${color}/10`}>
            <Icon className={`w-5 h-5 text-${color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground truncate">{title}</p>
            <p className="text-lg font-semibold text-foreground truncate">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Course Header */}
      <Card className="bg-gradient-hero shadow-medium">
        <CardContent className="p-6">
          <div className="text-center text-primary-foreground">
            <h1 className="text-3xl font-bold mb-2">{courseData.course.title}</h1>
            <div className="flex items-center justify-center gap-4 text-primary-foreground/90">
              <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground border-primary-foreground/20">
                {courseData.course.code}
              </Badge>
              <span>{courseData.course.semester}</span>
              <span>{courseData.course.institution}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Calendar}
          title="Next Class"
          value={nextClass ? nextClass.topic : "No upcoming classes"}
          subtitle={nextClass ? formatDateShort(nextClass.date) : undefined}
        />
        
        <StatCard
          icon={Clock}
          title="Next Due"
          value={nextDeliverable ? nextDeliverable.name : "No upcoming deadlines"}
          subtitle={nextDeliverable ? `Due ${formatDateShort(nextDeliverable.due)}` : undefined}
          color="accent"
        />
        
        <StatCard
          icon={GraduationCap}
          title="Total Classes"
          value={courseData.schedule.length.toString()}
          subtitle={`${activityCounts.quiz || 0} quizzes, ${activityCounts.exam || 0} exams`}
          color="success"
        />
        
        <StatCard
          icon={Users}
          title="Instructors"
          value={courseData.instructors.length.toString()}
          subtitle={`${courseData.instructors.filter(i => i.role === 'professor').length} professors`}
          color="warning"
        />
      </div>

      {/* Upcoming Activities */}
      {(nextClass || nextDeliverable) && (
        <Card className="shadow-soft">
          <CardContent className="p-4">
            <h3 className="font-semibold text-foreground mb-3">Coming Up</h3>
            <div className="space-y-2">
              {nextClass && (
                <div className="flex items-center justify-between p-2 bg-primary/5 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span className="font-medium">{nextClass.topic}</span>
                  </div>
                  <Badge variant="secondary">{formatDateShort(nextClass.date)}</Badge>
                </div>
              )}
              
              {nextDeliverable && (
                <div className="flex items-center justify-between p-2 bg-accent/5 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-accent" />
                    <span className="font-medium">{nextDeliverable.name}</span>
                  </div>
                  <Badge variant="secondary">Due {formatDateShort(nextDeliverable.due)}</Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};