import { useState, useMemo } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCourses } from "@/hooks/useCourses";
import { ActivityBadge } from "@/components/ActivityBadge";
import { format, parseISO, isSameDay, startOfMonth, endOfMonth } from "date-fns";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, BookOpen } from "lucide-react";
import { ActivityType, CourseData, Deliverable, ScheduleItem } from "@/types/course";

interface CalendarEvent {
  id: string;
  date: Date;
  type: 'class' | 'deliverable' | 'important_date';
  title: string;
  course: string;
  courseCode: string;
  activities?: ActivityType[];
  deliverable?: Deliverable;
  eventType?: 'exam' | 'deadline' | 'break' | 'other';
  description?: string;
}

const CalendarView = () => {
  const { courses } = useCourses();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  // Generate calendar events from all courses
  const calendarEvents = useMemo(() => {
    const events: CalendarEvent[] = [];

    courses.forEach(course => {
      if (!course.data) return;

      const courseData = course.data as CourseData;

      // Add schedule items (classes)
      courseData.schedule.forEach((item: ScheduleItem) => {
        try {
          const eventDate = parseISO(item.date);
          events.push({
            id: `${course.id}-schedule-${item.date}`,
            date: eventDate,
            type: 'class',
            title: item.topic,
            course: courseData.course.title,
            courseCode: courseData.course.code,
            activities: item.activities,
          });

          // Add deliverables
          item.deliverables.forEach((deliverable: Deliverable) => {
            try {
              const dueDate = parseISO(deliverable.due);
              events.push({
                id: `${course.id}-deliverable-${deliverable.name}-${deliverable.due}`,
                date: dueDate,
                type: 'deliverable',
                title: `${deliverable.name} Due`,
                course: courseData.course.title,
                courseCode: courseData.course.code,
                deliverable,
              });
            } catch {
              // Skip invalid dates
            }
          });
        } catch {
          // Skip invalid dates
        }
      });

      // Add important dates
      courseData.important_dates?.forEach((importantDate) => {
        try {
          const eventDate = parseISO(importantDate.date);
          events.push({
            id: `${course.id}-important-${importantDate.name}-${importantDate.date}`,
            date: eventDate,
            type: 'important_date',
            title: importantDate.name,
            course: courseData.course.title,
            courseCode: courseData.course.code,
            eventType: importantDate.type,
          });
        } catch {
          // Skip invalid dates
        }
      });
    });

    return events.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [courses]);

  // Get events for selected date
  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];
    return calendarEvents.filter(event => isSameDay(event.date, selectedDate));
  }, [calendarEvents, selectedDate]);

  // Get events for current month (for calendar display)
  const monthEvents = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    return calendarEvents.filter(event => 
      event.date >= monthStart && event.date <= monthEnd
    );
  }, [calendarEvents, currentMonth]);

  // Check if a date has events
  const hasEvents = (date: Date) => {
    return calendarEvents.some(event => isSameDay(event.date, date));
  };

  const getEventTypeColor = (event: CalendarEvent) => {
    switch (event.type) {
      case 'class':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'deliverable':
        return 'bg-accent/10 text-accent border-accent/20';
      case 'important_date':
        switch (event.eventType) {
          case 'exam':
            return 'bg-destructive/10 text-destructive border-destructive/20';
          case 'deadline':
            return 'bg-warning/10 text-warning border-warning/20';
          default:
            return 'bg-muted/10 text-muted-foreground border-muted/20';
        }
      default:
        return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };

  const getEventIcon = (event: CalendarEvent) => {
    switch (event.type) {
      case 'class':
        return <BookOpen className="w-4 h-4" />;
      case 'deliverable':
        return <Clock className="w-4 h-4" />;
      case 'important_date':
        return <CalendarIcon className="w-4 h-4" />;
      default:
        return <CalendarIcon className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Course Calendar</h1>
            <p className="text-muted-foreground">
              View all your courses, classes, and deadlines in one place
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar */}
            <div className="lg:col-span-2">
              <Card className="shadow-soft">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">
                      {format(currentMonth, "MMMM yyyy")}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentMonth(new Date())}
                      >
                        Today
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    month={currentMonth}
                    onMonthChange={setCurrentMonth}
                    className="pointer-events-auto"
                    modifiers={{
                      hasEvents: (date) => hasEvents(date)
                    }}
                    modifiersStyles={{
                      hasEvents: {
                        backgroundColor: 'hsl(var(--primary) / 0.1)',
                        color: 'hsl(var(--primary))',
                        fontWeight: '600'
                      }
                    }}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Selected Date Events */}
            <div>
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle className="text-lg">
                    {selectedDate ? format(selectedDate, "EEEE, MMMM d") : "Select a date"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedDateEvents.length > 0 ? (
                    <div className="space-y-3">
                      {selectedDateEvents.map((event) => (
                        <div
                          key={event.id}
                          className={`p-3 rounded-lg border transition-colors ${getEventTypeColor(event)}`}
                        >
                          <div className="flex items-start gap-2">
                            {getEventIcon(event)}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{event.title}</p>
                              <p className="text-xs opacity-80 truncate">
                                {event.courseCode} - {event.course}
                              </p>
                              {event.activities && event.activities.length > 0 && (
                                <div className="flex gap-1 mt-2 flex-wrap">
                                  {event.activities.map((activity, idx) => (
                                    <ActivityBadge key={idx} type={activity} />
                                  ))}
                                </div>
                              )}
                              {event.deliverable && (
                                <Badge variant="secondary" className="mt-2 text-xs">
                                  {event.deliverable.type}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm text-center py-4">
                      No events scheduled for this date
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Legend */}
              <Card className="shadow-soft mt-4">
                <CardHeader>
                  <CardTitle className="text-sm">Legend</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-primary/20 border border-primary/30"></div>
                    <span className="text-xs text-muted-foreground">Classes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-accent/20 border border-accent/30"></div>
                    <span className="text-xs text-muted-foreground">Deliverables</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-destructive/20 border border-destructive/30"></div>
                    <span className="text-xs text-muted-foreground">Exams</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-warning/20 border border-warning/30"></div>
                    <span className="text-xs text-muted-foreground">Deadlines</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Upcoming Events Summary */}
          {calendarEvents.length > 0 && (
            <Card className="shadow-soft mt-6">
              <CardHeader>
                <CardTitle>Upcoming Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {calendarEvents
                    .filter(event => event.date >= new Date())
                    .slice(0, 6)
                    .map((event) => (
                      <div
                        key={event.id}
                        className={`p-3 rounded-lg border transition-colors ${getEventTypeColor(event)}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{event.title}</p>
                            <p className="text-xs opacity-80 truncate">
                              {event.courseCode} - {event.course}
                            </p>
                            <p className="text-xs opacity-60 mt-1">
                              {format(event.date, "MMM d, yyyy")}
                            </p>
                          </div>
                          {getEventIcon(event)}
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarView;