import { format } from "date-fns";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ActivityBadge } from "@/components/ActivityBadge";
import { CalendarEvent } from "@/utils/calendarEvents";
import { CourseColor, FALLBACK_COURSE_COLOR } from "@/utils/courseColors";
import { EventIcon, eventTypeLabel } from "./EventIcon";
import { CalendarDays, Clock, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface EventDetailsDialogProps {
  event: CalendarEvent | null;
  colorMap: Record<string, CourseColor>;
  onOpenChange: (open: boolean) => void;
}

export const EventDetailsDialog = ({ event, colorMap, onOpenChange }: EventDetailsDialogProps) => {
  if (!event) return null;

  const color = colorMap[event.courseId] ?? FALLBACK_COURSE_COLOR;

  return (
    <Dialog open={!!event} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className={cn("w-3 h-3 rounded-full mt-1.5 shrink-0", color.dot)} />
            <DialogTitle className="text-left leading-snug">{event.title}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="capitalize flex items-center gap-1">
              <EventIcon event={event} className="w-3 h-3" />
              {eventTypeLabel(event)}
            </Badge>
            {event.isEstimated && (
              <Badge variant="outline" className="text-xs">Estimated date</Badge>
            )}
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarDays className="w-4 h-4 shrink-0" />
              <span>{format(event.date, "EEEE, d MMMM yyyy")}</span>
            </div>

            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4 shrink-0" />
              <span>
                {event.start && event.end
                  ? `${format(event.start, "h:mm a")} – ${format(event.end, "h:mm a")}`
                  : "All day"}
              </span>
            </div>
          </div>

          {event.activities && event.activities.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {event.activities.map((activity, index) => (
                <ActivityBadge key={index} type={activity} />
              ))}
            </div>
          )}

          <div className="pt-2 border-t border-border">
            <p className="text-sm font-medium text-foreground">{event.course}</p>
            {event.courseCode && (
              <p className="text-xs text-muted-foreground">{event.courseCode}</p>
            )}
          </div>

          <Link to={`/course/${event.courseId}`} onClick={() => onOpenChange(false)}>
            <Button variant="outline" size="sm" className="w-full">
              <ExternalLink className="w-4 h-4 mr-2" />
              Open course
            </Button>
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
};
