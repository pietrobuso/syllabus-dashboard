import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ContentUnit } from "@/types/course";
import { Layers } from "lucide-react";

interface CourseContentProps {
  content: ContentUnit[];
}

export const CourseContent = ({ content }: CourseContentProps) => {
  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <Layers className="w-5 h-5 text-primary" />
          Course Content
        </CardTitle>
      </CardHeader>
      <CardContent>
        {content.length > 0 ? (
          <div className="space-y-4">
            {content.map((unit, index) => (
              <div key={index} className="p-4 border border-border/50 rounded-lg">
                <h3 className="font-semibold text-foreground">{unit.title}</h3>

                {unit.description && (
                  <p className="text-sm text-muted-foreground mt-1">{unit.description}</p>
                )}

                {unit.topics && unit.topics.length > 0 && (
                  <ul className="list-disc list-inside text-sm text-foreground mt-3 space-y-1">
                    {unit.topics.map((topic, topicIndex) => (
                      <li key={topicIndex}>{topic}</li>
                    ))}
                  </ul>
                )}

                {unit.readings && unit.readings.length > 0 && (
                  <p className="text-sm text-muted-foreground mt-3">
                    <span className="font-medium">Readings:</span> {unit.readings.join(", ")}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Layers className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No content outline available. Add units in the course editor if your syllabus lists topics without specific dates.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
