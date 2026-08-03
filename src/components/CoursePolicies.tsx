import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CourseData } from "@/types/course";
import { ScrollText, CalendarCheck, ShieldCheck } from "lucide-react";

interface CoursePoliciesProps {
  policies: CourseData["policies"];
}

const POLICY_FIELDS = [
  { key: "late_work", label: "Late work", icon: ScrollText },
  { key: "attendance", label: "Attendance", icon: CalendarCheck },
  { key: "honor_code", label: "Academic integrity", icon: ShieldCheck },
] as const;

export const CoursePolicies = ({ policies }: CoursePoliciesProps) => {
  const stated = POLICY_FIELDS.filter(field => policies[field.key]?.trim());

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <ScrollText className="w-5 h-5 text-primary" />
          Policies
        </CardTitle>
      </CardHeader>
      <CardContent>
        {stated.length > 0 ? (
          <div className="space-y-4">
            {stated.map(({ key, label, icon: Icon }) => (
              <div key={key}>
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                  <h3 className="text-sm font-medium text-foreground">{label}</h3>
                </div>
                <p className="text-sm text-muted-foreground pl-6 whitespace-pre-wrap">
                  {policies[key]}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No policies recorded. Add them in the course editor.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
