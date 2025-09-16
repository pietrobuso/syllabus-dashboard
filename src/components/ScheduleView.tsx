import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScheduleItem, ActivityType } from "@/types/course";
import { ActivityBadge } from "./ActivityBadge";
import { Calendar, Clock, Search, Filter, LayoutGrid, List } from "lucide-react";
import { format, parseISO } from "date-fns";

interface ScheduleViewProps {
  schedule: ScheduleItem[];
}

export const ScheduleView = ({ schedule }: ScheduleViewProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterActivity, setFilterActivity] = useState<ActivityType | "all">("all");
  const [viewMode, setViewMode] = useState<"card" | "table">("card");

  const filteredSchedule = schedule.filter(item => {
    const matchesSearch = item.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.activities.some(activity => activity.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = filterActivity === "all" || item.activities.includes(filterActivity);
    
    return matchesSearch && matchesFilter;
  });

  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, "MMM dd, yyyy");
    } catch {
      return dateString;
    }
  };

  const formatDateShort = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, "MMM dd");
    } catch {
      return dateString;
    }
  };

  const activityTypes: (ActivityType | "all")[] = ["all", "quiz", "exam", "assignment", "monitored", "lecture", "lab"];

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Course Schedule
          </CardTitle>
          
          {/* View Toggle */}
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "card" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("card")}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("table")}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search topics or activities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <div className="flex gap-2 flex-wrap">
            {activityTypes.map(type => (
              <Button
                key={type}
                variant={filterActivity === type ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterActivity(type)}
                className="capitalize text-xs"
              >
                <Filter className="w-3 h-3 mr-1" />
                {type === "all" ? "All" : type}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {viewMode === "card" ? (
          <div className="space-y-4">
            {filteredSchedule.map((item, index) => (
              <Card key={index} className="border border-border/50 hover:shadow-medium transition-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Date and Week */}
                    <div className="flex flex-col items-start sm:items-center text-center min-w-0 sm:min-w-[100px]">
                      <div className="text-lg font-semibold text-primary">{formatDateShort(item.date)}</div>
                      <Badge variant="secondary" className="text-xs">Week {item.week}</Badge>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground mb-2 truncate">{item.topic}</h3>
                      
                      {/* Activities */}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {item.activities.map((activity, actIndex) => (
                          <ActivityBadge key={actIndex} type={activity} />
                        ))}
                      </div>
                      
                      {/* Deliverables */}
                      {item.deliverables.length > 0 && (
                        <div className="space-y-1">
                          {item.deliverables.map((deliverable, delIndex) => (
                            <div key={delIndex} className="flex items-center gap-2 text-sm">
                              <Clock className="w-3 h-3 text-muted-foreground" />
                              <span className="font-medium">{deliverable.name}</span>
                              <span className="text-muted-foreground">due {formatDateShort(deliverable.due)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Readings */}
                      {item.readings && item.readings.length > 0 && (
                        <div className="mt-2 text-sm text-muted-foreground">
                          <span className="font-medium">Reading:</span> {item.readings.join(", ")}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 font-semibold">Date</th>
                  <th className="text-left py-3 px-2 font-semibold">Week</th>
                  <th className="text-left py-3 px-2 font-semibold">Topic</th>
                  <th className="text-left py-3 px-2 font-semibold">Activities</th>
                  <th className="text-left py-3 px-2 font-semibold">Due</th>
                </tr>
              </thead>
              <tbody>
                {filteredSchedule.map((item, index) => (
                  <tr key={index} className="border-b border-border/30 hover:bg-muted/30">
                    <td className="py-3 px-2 text-sm">{formatDate(item.date)}</td>
                    <td className="py-3 px-2">
                      <Badge variant="secondary" className="text-xs">Week {item.week}</Badge>
                    </td>
                    <td className="py-3 px-2 font-medium">{item.topic}</td>
                    <td className="py-3 px-2">
                      <div className="flex flex-wrap gap-1">
                        {item.activities.map((activity, actIndex) => (
                          <ActivityBadge key={actIndex} type={activity} />
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-2 text-sm">
                      {item.deliverables.map((deliverable, delIndex) => (
                        <div key={delIndex} className="mb-1">
                          {deliverable.name}
                        </div>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {filteredSchedule.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No schedule items found matching your criteria.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};