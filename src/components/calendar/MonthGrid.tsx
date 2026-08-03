import { useMemo } from "react";
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { CalendarEvent } from "@/utils/calendarEvents";
import { CourseColor, FALLBACK_COURSE_COLOR } from "@/utils/courseColors";
import { EventIcon } from "./EventIcon";
import { cn } from "@/lib/utils";

const MAX_CHIPS_PER_DAY = 3;

interface MonthGridProps {
  month: Date;
  events: CalendarEvent[];
  colorMap: Record<string, CourseColor>;
  onSelectEvent: (event: CalendarEvent) => void;
  onSelectDay: (day: Date) => void;
  selectedEventId?: string;
}

export const MonthGrid = ({
  month,
  events,
  colorMap,
  onSelectEvent,
  onSelectDay,
  selectedEventId,
}: MonthGridProps) => {
  const days = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(startOfMonth(month)),
        end: endOfWeek(endOfMonth(month)),
      }),
    [month]
  );

  const weekdayLabels = useMemo(() => days.slice(0, 7).map(day => format(day, "EEE")), [days]);

  return (
    <div>
      <div className="grid grid-cols-7 border-b border-border">
        {weekdayLabels.map(label => (
          <div key={label} className="px-2 pb-2 text-xs uppercase text-muted-foreground text-center">
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map(day => {
          const dayEvents = events.filter(event => isSameDay(event.date, day));
          const visible = dayEvents.slice(0, MAX_CHIPS_PER_DAY);
          const overflow = dayEvents.length - visible.length;

          return (
            <div
              key={day.toISOString()}
              className={cn(
                "min-h-[104px] border-b border-r border-border p-1 space-y-1",
                !isSameMonth(day, month) && "bg-muted/30"
              )}
            >
              <button
                onClick={() => onSelectDay(day)}
                className={cn(
                  "w-7 h-7 flex items-center justify-center rounded-full text-xs transition-colors hover:bg-muted",
                  isToday(day) && "bg-primary text-primary-foreground hover:bg-primary/90",
                  !isSameMonth(day, month) && "text-muted-foreground"
                )}
                title="Open this day"
              >
                {format(day, "d")}
              </button>

              {visible.map(event => {
                const color = colorMap[event.courseId] ?? FALLBACK_COURSE_COLOR;
                return (
                  <button
                    key={event.id}
                    onClick={() => onSelectEvent(event)}
                    className={cn(
                      "w-full flex items-center gap-1 px-1 py-0.5 rounded border text-left text-[10px] leading-tight transition-colors",
                      color.chip,
                      selectedEventId === event.id && "ring-2 ring-ring"
                    )}
                    title={`${event.title} — ${event.course}`}
                  >
                    <EventIcon event={event} className="w-2.5 h-2.5 shrink-0" />
                    <span className="truncate font-medium">
                      {event.start ? `${format(event.start, "h:mm")} ` : ""}
                      {event.title}
                    </span>
                  </button>
                );
              })}

              {overflow > 0 && (
                <button
                  onClick={() => onSelectDay(day)}
                  className="w-full text-left text-[10px] text-muted-foreground hover:text-foreground px-1"
                >
                  +{overflow} more
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
