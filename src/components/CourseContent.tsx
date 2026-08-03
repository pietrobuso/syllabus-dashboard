import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Layers } from "lucide-react";

interface CourseContentProps {
  content: string;
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
        {content.trim() ? (
          <p className="text-sm text-foreground whitespace-pre-wrap">{content}</p>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Layers className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No content outline available. Paste it in from the syllabus in the course editor if there's one (e.g. a "CONTEÚDO" or "EMENTA" section).</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
