import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MeetingTime } from "@/types/course";
import { formatTime12h } from "@/utils/meetingTimes";
import { Clock } from "lucide-react";

interface MeetingTimesCardProps {
  meetingTimes: MeetingTime[];
}

const capitalize = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);

export const MeetingTimesCard = ({ meetingTimes }: MeetingTimesCardProps) => {
  if (meetingTimes.length === 0) return null;

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Weekly Meeting Times
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {meetingTimes.map((meeting, index) => (
            <Badge key={index} variant="secondary" className="text-sm py-1.5 px-3">
              {capitalize(meeting.day)} {formatTime12h(meeting.start_time)}–{formatTime12h(meeting.end_time)}
              {meeting.label ? ` · ${meeting.label}` : ""}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
