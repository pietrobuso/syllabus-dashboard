import { useEffect, useMemo, useRef, useState } from "react";
import { format, isSameDay, isToday } from "date-fns";
import { CalendarEvent } from "@/utils/calendarEvents";
import { CourseColor, FALLBACK_COURSE_COLOR } from "@/utils/courseColors";
import { EventIcon } from "./EventIcon";
import { cn } from "@/lib/utils";

const HOUR_HEIGHT = 52;
const DEFAULT_START_HOUR = 7;
const DEFAULT_END_HOUR = 22;

interface TimeGridProps {
  days: Date[];
  events: CalendarEvent[];
  colorMap: Record<string, CourseColor>;
  onSelectEvent: (event: CalendarEvent) => void;
  selectedEventId?: string;
}

interface PositionedEvent {
  event: CalendarEvent;
  column: number;
  columns: number;
}

/**
 * Lays overlapping events out side by side: events that overlap in time
 * share a cluster and split the column's width between them.
 */
const positionEvents = (events: CalendarEvent[]): PositionedEvent[] => {
  const timed = events
    .filter(event => event.start && event.end)
    .sort((a, b) => a.start!.getTime() - b.start!.getTime());

  const positioned: PositionedEvent[] = [];
  let cluster: { event: CalendarEvent; column: number }[] = [];
  let clusterEnd = 0;

  const flush = () => {
    if (cluster.length === 0) return;
    const columns = Math.max(...cluster.map(entry => entry.column)) + 1;
    cluster.forEach(entry => positioned.push({ event: entry.event, column: entry.column, columns }));
    cluster = [];
  };

  timed.forEach(event => {
    const start = event.start!.getTime();
    if (cluster.length > 0 && start >= clusterEnd) flush();

    const taken = new Set(
      cluster.filter(entry => entry.event.end!.getTime() > start).map(entry => entry.column)
    );
    let column = 0;
    while (taken.has(column)) column += 1;

    cluster.push({ event, column });
    clusterEnd = Math.max(clusterEnd, event.end!.getTime());
  });

  flush();
  return positioned;
};

const minutesSinceMidnight = (date: Date) => date.getHours() * 60 + date.getMinutes();

export const TimeGrid = ({ days, events, colorMap, onSelectEvent, selectedEventId }: TimeGridProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState(new Date());

  // Keep the "current time" line honest without re-rendering constantly.
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const timedEvents = useMemo(() => events.filter(event => event.start && event.end), [events]);
  const allDayEvents = useMemo(() => events.filter(event => !event.start), [events]);

  // Widen the window if a class falls outside normal hours, so nothing hides.
  const { startHour, endHour } = useMemo(() => {
    let start = DEFAULT_START_HOUR;
    let end = DEFAULT_END_HOUR;
    timedEvents.forEach(event => {
      start = Math.min(start, event.start!.getHours());
      end = Math.max(end, event.end!.getHours() + (event.end!.getMinutes() > 0 ? 1 : 0));
    });
    return { startHour: Math.max(0, start), endHour: Math.min(24, Math.max(end, start + 1)) };
  }, [timedEvents]);

  const hours = useMemo(
    () => Array.from({ length: endHour - startHour }, (_, index) => startHour + index),
    [startHour, endHour]
  );

  const gridHeight = hours.length * HOUR_HEIGHT;
  const offsetFor = (date: Date) => ((minutesSinceMidnight(date) - startHour * 60) / 60) * HOUR_HEIGHT;

  // Open the grid near the current hour (or the start of the day window).
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const target = days.some(isToday) ? offsetFor(new Date()) - HOUR_HEIGHT : 0;
    container.scrollTop = Math.max(0, target);
    // Only on mount / when the visible range changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days[0]?.toDateString(), startHour]);

  const showNowLine = days.some(isToday) && now.getHours() >= startHour && now.getHours() < endHour;

  return (
    <div className="flex flex-col">
      {/* Day headers */}
      <div className="flex border-b border-border">
        <div className="w-14 shrink-0" />
        {days.map(day => (
          <div key={day.toISOString()} className="flex-1 min-w-0 px-1 pb-2 text-center">
            <div className="text-xs text-muted-foreground uppercase">{format(day, "EEE")}</div>
            <div
              className={cn(
                "text-lg font-semibold w-9 h-9 mx-auto flex items-center justify-center rounded-full",
                isToday(day) ? "bg-primary text-primary-foreground" : "text-foreground"
              )}
            >
              {format(day, "d")}
            </div>
          </div>
        ))}
      </div>

      {/* All-day row */}
      {allDayEvents.length > 0 && (
        <div className="flex border-b border-border bg-muted/20">
          <div className="w-14 shrink-0 px-2 py-2 text-[10px] text-muted-foreground text-right uppercase">
            All day
          </div>
          {days.map(day => (
            <div key={day.toISOString()} className="flex-1 min-w-0 px-1 py-1.5 space-y-1 border-l border-border">
              {allDayEvents
                .filter(event => isSameDay(event.date, day))
                .map(event => {
                  const color = colorMap[event.courseId] ?? FALLBACK_COURSE_COLOR;
                  return (
                    <button
                      key={event.id}
                      onClick={() => onSelectEvent(event)}
                      className={cn(
                        "w-full flex items-center gap-1 px-1.5 py-1 rounded border text-left text-[11px] leading-tight transition-colors",
                        color.chip,
                        selectedEventId === event.id && "ring-2 ring-ring"
                      )}
                    >
                      <EventIcon event={event} className="w-3 h-3 shrink-0" />
                      <span className="truncate font-medium">{event.title}</span>
                    </button>
                  );
                })}
            </div>
          ))}
        </div>
      )}

      {/* Hour grid */}
      <div ref={scrollRef} className="flex overflow-y-auto max-h-[60vh]">
        {/* Hour gutter */}
        <div className="w-14 shrink-0">
          {hours.map(hour => (
            <div key={hour} className="relative" style={{ height: HOUR_HEIGHT }}>
              <span className="absolute -top-2 right-2 text-[11px] text-muted-foreground">
                {format(new Date(2000, 0, 1, hour), "h a")}
              </span>
            </div>
          ))}
        </div>

        {/* Day columns */}
        <div className="flex flex-1 min-w-0 relative">
          {days.map(day => {
            const dayEvents = positionEvents(timedEvents.filter(event => isSameDay(event.date, day)));

            return (
              <div
                key={day.toISOString()}
                className="flex-1 min-w-0 relative border-l border-border"
                style={{ height: gridHeight }}
              >
                {hours.map(hour => (
                  <div
                    key={hour}
                    className="border-b border-border/60"
                    style={{ height: HOUR_HEIGHT }}
                  />
                ))}

                {dayEvents.map(({ event, column, columns }) => {
                  const color = colorMap[event.courseId] ?? FALLBACK_COURSE_COLOR;
                  const top = offsetFor(event.start!);
                  const height = Math.max(
                    22,
                    ((event.end!.getTime() - event.start!.getTime()) / 60000 / 60) * HOUR_HEIGHT
                  );

                  return (
                    <button
                      key={event.id}
                      onClick={() => onSelectEvent(event)}
                      title={`${event.title} — ${event.course}`}
                      className={cn(
                        "absolute rounded-md border px-1.5 py-1 text-left overflow-hidden transition-colors",
                        color.block,
                        selectedEventId === event.id && "ring-2 ring-ring z-10"
                      )}
                      style={{
                        top,
                        height,
                        left: `calc(${(column / columns) * 100}% + 2px)`,
                        width: `calc(${100 / columns}% - 4px)`,
                      }}
                    >
                      <div className="flex items-center gap-1 text-[11px] font-semibold leading-tight">
                        <EventIcon event={event} className="w-3 h-3 shrink-0" />
                        <span className="truncate">{event.title}</span>
                      </div>
                      {height > 34 && (
                        <div className="text-[10px] opacity-90 truncate">
                          {format(event.start!, "h:mm a")} · {event.courseCode || event.course}
                        </div>
                      )}
                    </button>
                  );
                })}

                {/* Current time line */}
                {showNowLine && isToday(day) && (
                  <div
                    className="absolute left-0 right-0 z-20 pointer-events-none"
                    style={{ top: offsetFor(now) }}
                  >
                    <div className="relative border-t-2 border-red-500">
                      <div className="absolute -left-1 -top-[5px] w-2 h-2 rounded-full bg-red-500" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
