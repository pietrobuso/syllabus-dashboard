import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Instructor } from "@/types/course";
import { Mail, Clock, MapPin, User } from "lucide-react";

interface ContactInfoProps {
  instructors: Instructor[];
}

export const ContactInfo = ({ instructors }: ContactInfoProps) => {
  const professors = instructors.filter(inst => inst.role === 'professor');
  const tas = instructors.filter(inst => inst.role === 'ta');

  const InstructorCard = ({ instructor }: { instructor: Instructor }) => (
    <Card className="border border-border/50 hover:shadow-medium transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold text-lg">
            {instructor.name.split(' ').map(n => n[0]).join('')}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-foreground truncate">{instructor.name}</h3>
              <Badge variant={instructor.role === 'professor' ? 'default' : 'secondary'} className="text-xs">
                {instructor.role === 'professor' ? 'Professor' : 'TA'}
              </Badge>
            </div>
            
            <div className="space-y-2 text-sm">
              {/* Email */}
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-primary hover:text-primary/80 text-sm font-normal"
                  onClick={() => window.open(`mailto:${instructor.email}`, '_blank')}
                >
                  {instructor.email}
                </Button>
              </div>
              
              {/* Office Hours */}
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground">{instructor.office_hours}</span>
              </div>
              
              {/* Location */}
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground">{instructor.location}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <User className="w-5 h-5 text-primary" />
          Course Staff
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Professors */}
        {professors.length > 0 && (
          <div>
            <h3 className="font-medium text-foreground mb-3 flex items-center gap-2">
              <div className="w-1 h-4 bg-primary rounded-full" />
              Instructors
            </h3>
            <div className="space-y-3">
              {professors.map((instructor, index) => (
                <InstructorCard key={index} instructor={instructor} />
              ))}
            </div>
          </div>
        )}
        
        {/* Teaching Assistants */}
        {tas.length > 0 && (
          <div>
            <h3 className="font-medium text-foreground mb-3 flex items-center gap-2">
              <div className="w-1 h-4 bg-accent rounded-full" />
              Teaching Assistants
            </h3>
            <div className="space-y-3">
              {tas.map((instructor, index) => (
                <InstructorCard key={index} instructor={instructor} />
              ))}
            </div>
          </div>
        )}
        
        {instructors.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No instructor information available.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};