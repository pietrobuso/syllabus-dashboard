import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCourses } from "@/hooks/useCourses";
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { CourseData } from "@/types/course";
import { buildCalendarEvents, CalendarEvent } from "@/utils/calendarEvents";
import { buildCourseColorMap, FALLBACK_COURSE_COLOR } from "@/utils/courseColors";
import { TimeGrid } from "@/components/calendar/TimeGrid";
import { MonthGrid } from "@/components/calendar/MonthGrid";
import { EventDetailsDialog } from "@/components/calendar/EventDetailsDialog";
import { EventIcon } from "@/components/calendar/EventIcon";
import { cn } from "@/lib/utils";

type ViewMode = "month" | "week" | "day";

/** How far either side of the visible range to generate recurring meetings. */
const RECURRING_PADDING_DAYS = 45;
/** How far ahead of today "Coming Up" should be able to look. */
const UPCOMING_WINDOW_DAYS = 60;

const CalendarView = () => {
  const { courses } = useCourses();
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [anchorDate, setAnchorDate] = useState<Date>(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const colorMap = useMemo(
    () => buildCourseColorMap(courses.map(course => course.id)),
    [courses]
  );

  // The days the current view covers.
  const visibleDays = useMemo(() => {
    if (viewMode === "day") return [anchorDate];
    if (viewMode === "week") {
      return eachDayOfInterval({ start: startOfWeek(anchorDate), end: endOfWeek(anchorDate) });
    }
    return eachDayOfInterval({
      start: startOfWeek(startOfMonth(anchorDate)),
      end: endOfWeek(endOfMonth(anchorDate)),
    });
  }, [viewMode, anchorDate]);

  const events = useMemo(() => {
    // Recurring meetings repeat forever, so they're only generated within a
    // range. It has to cover the visible days *and* a window from today, or
    // "Coming Up" would empty out whenever you browse to a distant month.
    const today = new Date();
    const paddedStart = addDays(visibleDays[0], -RECURRING_PADDING_DAYS);
    const paddedEnd = addDays(visibleDays[visibleDays.length - 1], RECURRING_PADDING_DAYS);

    const rangeStart = today < paddedStart ? today : paddedStart;
    const upcomingEnd = addDays(today, UPCOMING_WINDOW_DAYS);
    const rangeEnd = endOfDay(upcomingEnd > paddedEnd ? upcomingEnd : paddedEnd);

    return buildCalendarEvents(
      courses.map(course => ({ id: course.id, data: course.data as CourseData })),
      rangeStart,
      rangeEnd
    );
  }, [courses, visibleDays]);

  const visibleEvents = useMemo(
    () => events.filter(event => visibleDays.some(day => isSameDay(day, event.date))),
    [events, visibleDays]
  );

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return events.filter(event => event.date >= now).slice(0, 8);
  }, [events]);

  const step = (direction: 1 | -1) => {
    if (viewMode === "month") {
      setAnchorDate(current => (direction === 1 ? addMonths(current, 1) : subMonths(current, 1)));
    } else {
      setAnchorDate(current => addDays(current, direction * (viewMode === "week" ? 7 : 1)));
    }
  };

  const rangeLabel = useMemo(() => {
    if (viewMode === "day") return format(anchorDate, "EEEE, d MMMM yyyy");
    if (viewMode === "month") return format(anchorDate, "MMMM yyyy");

    const first = visibleDays[0];
    const last = visibleDays[visibleDays.length - 1];
    return isSameMonth(first, last)
      ? `${format(first, "d")} – ${format(last, "d MMM yyyy")}`
      : `${format(first, "d MMM")} – ${format(last, "d MMM yyyy")}`;
  }, [viewMode, anchorDate, visibleDays]);

  const openDay = (day: Date) => {
    setAnchorDate(day);
    setViewMode("day");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground mb-2">Course Calendar</h1>
            <p className="text-muted-foreground">
              All your classes, deadlines and exams, hour by hour
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            <div className="xl:col-span-3">
              <Card className="shadow-soft">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => step(-1)} aria-label="Previous">
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setAnchorDate(new Date())}>
                        Today
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => step(1)} aria-label="Next">
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                      <span className="ml-2 font-semibold text-foreground">{rangeLabel}</span>
                    </div>

                    <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
                      {(["day", "week", "month"] as ViewMode[]).map(mode => (
                        <Button
                          key={mode}
                          variant={viewMode === mode ? "default" : "ghost"}
                          size="sm"
                          className="capitalize"
                          onClick={() => setViewMode(mode)}
                        >
                          {mode}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-0 sm:p-2">
                  {viewMode === "month" ? (
                    <MonthGrid
                      month={anchorDate}
                      events={visibleEvents}
                      colorMap={colorMap}
                      onSelectEvent={setSelectedEvent}
                      onSelectDay={openDay}
                      selectedEventId={selectedEvent?.id}
                    />
                  ) : (
                    <TimeGrid
                      days={visibleDays}
                      events={visibleEvents}
                      colorMap={colorMap}
                      onSelectEvent={setSelectedEvent}
                      selectedEventId={selectedEvent?.id}
                    />
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar: course legend + what's coming up */}
            <div className="space-y-4">
              {courses.length > 0 && (
                <Card className="shadow-soft">
                  <CardHeader className="pb-3">
                    <h2 className="font-semibold text-foreground">My Courses</h2>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {courses.map(course => (
                      <div key={course.id} className="flex items-center gap-2 text-sm">
                        <span
                          className={cn(
                            "w-3 h-3 rounded-full shrink-0",
                            (colorMap[course.id] ?? FALLBACK_COURSE_COLOR).dot
                          )}
                        />
                        <span className="truncate text-foreground">{course.name}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              <Card className="shadow-soft">
                <CardHeader className="pb-3">
                  <h2 className="font-semibold text-foreground">Coming Up</h2>
                </CardHeader>
                <CardContent>
                  {upcomingEvents.length > 0 ? (
                    <div className="space-y-2">
                      {upcomingEvents.map(event => {
                        const color = colorMap[event.courseId] ?? FALLBACK_COURSE_COLOR;
                        return (
                          <button
                            key={event.id}
                            onClick={() => setSelectedEvent(event)}
                            className={cn(
                              "w-full flex items-start gap-2 p-2 rounded-lg border text-left transition-colors",
                              color.chip
                            )}
                          >
                            <EventIcon event={event} className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium truncate">{event.title}</p>
                              <p className="text-xs opacity-80">
                                {format(event.date, "EEE, d MMM")}
                                {event.start ? ` · ${format(event.start, "h:mm a")}` : ""}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <CalendarDays className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nothing scheduled yet.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <EventDetailsDialog
        event={selectedEvent}
        colorMap={colorMap}
        onOpenChange={open => !open && setSelectedEvent(null)}
      />
    </div>
  );
};

export default CalendarView;
