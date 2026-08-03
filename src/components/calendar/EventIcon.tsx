import { BookOpen, Clock, GraduationCap, Coffee, CalendarDays, FolderKanban } from "lucide-react";
import { CalendarEvent } from "@/utils/calendarEvents";

/**
 * Colour identifies the course, so the icon is what tells you what kind
 * of thing an event is.
 */
export const EventIcon = ({ event, className = "w-3.5 h-3.5" }: { event: CalendarEvent; className?: string }) => {
  if (event.type === "class") return <BookOpen className={className} />;
  if (event.type === "deliverable") return <Clock className={className} />;

  switch (event.eventType) {
    case "exam":
    case "quiz":
      return <GraduationCap className={className} />;
    case "project":
      return <FolderKanban className={className} />;
    case "break":
      return <Coffee className={className} />;
    default:
      return <CalendarDays className={className} />;
  }
};

export const eventTypeLabel = (event: CalendarEvent): string => {
  if (event.type === "class") return "Class";
  if (event.type === "deliverable") return event.deliverable?.type ?? "Deliverable";
  return event.eventType ?? "Important date";
};
