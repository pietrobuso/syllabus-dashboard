import { Badge } from "@/components/ui/badge";
import { ActivityType } from "@/types/course";
import { BookOpen, ClipboardCheck, FileText, Eye, GraduationCap, FlaskConical } from "lucide-react";

interface ActivityBadgeProps {
  type: ActivityType;
  className?: string;
}

const activityConfig = {
  quiz: {
    label: "Quiz",
    className: "bg-quiz/10 text-quiz border-quiz/20 hover:bg-quiz/20",
    icon: ClipboardCheck
  },
  exam: {
    label: "Exam", 
    className: "bg-exam/10 text-exam border-exam/20 hover:bg-exam/20",
    icon: GraduationCap
  },
  assignment: {
    label: "Assignment",
    className: "bg-assignment/10 text-assignment border-assignment/20 hover:bg-assignment/20", 
    icon: FileText
  },
  monitored: {
    label: "Monitored Activity",
    className: "bg-monitored/10 text-monitored border-monitored/20 hover:bg-monitored/20",
    icon: Eye
  },
  lecture: {
    label: "Lecture",
    className: "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20",
    icon: BookOpen
  },
  lab: {
    label: "Lab",
    className: "bg-accent/10 text-accent border-accent/20 hover:bg-accent/20",
    icon: FlaskConical
  }
};

export const ActivityBadge = ({ type, className = "" }: ActivityBadgeProps) => {
  const config = activityConfig[type];
  const Icon = config.icon;
  
  return (
    <Badge 
      variant="secondary" 
      className={`${config.className} ${className} flex items-center gap-1 text-xs font-medium transition-colors`}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  );
};