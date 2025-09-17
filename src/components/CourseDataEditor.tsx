import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CourseData, GradingComponent, Instructor } from "@/types/course";
import { Plus, Trash2, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CourseDataEditorProps {
  initialData: CourseData;
  onSave: (data: CourseData) => void;
  onCancel: () => void;
}

export const CourseDataEditor = ({ initialData, onSave, onCancel }: CourseDataEditorProps) => {
  const [courseData, setCourseData] = useState<CourseData>(initialData);
  const { toast } = useToast();

  const updateCourse = (field: keyof CourseData['course'], value: string) => {
    setCourseData(prev => ({
      ...prev,
      course: { ...prev.course, [field]: value }
    }));
  };

  const updateInstructor = (index: number, field: keyof Instructor, value: string) => {
    setCourseData(prev => ({
      ...prev,
      instructors: prev.instructors.map((inst, i) => 
        i === index ? { ...inst, [field]: value } : inst
      )
    }));
  };

  const addInstructor = () => {
    setCourseData(prev => ({
      ...prev,
      instructors: [...prev.instructors, {
        name: "",
        email: "",
        office_hours: "",
        location: "",
        role: "professor" as const
      }]
    }));
  };

  const removeInstructor = (index: number) => {
    setCourseData(prev => ({
      ...prev,
      instructors: prev.instructors.filter((_, i) => i !== index)
    }));
  };

  const updateGradingComponent = (index: number, field: keyof GradingComponent, value: string | number | boolean) => {
    setCourseData(prev => ({
      ...prev,
      grading: prev.grading.map((comp, i) => 
        i === index ? { ...comp, [field]: value } : comp
      )
    }));
  };

  const addGradingComponent = () => {
    setCourseData(prev => ({
      ...prev,
      grading: [...prev.grading, {
        component: "",
        weight: 0,
        description: ""
      }]
    }));
  };

  const removeGradingComponent = (index: number) => {
    setCourseData(prev => ({
      ...prev,
      grading: prev.grading.filter((_, i) => i !== index)
    }));
  };

  const updatePolicy = (field: keyof CourseData['policies'], value: string) => {
    setCourseData(prev => ({
      ...prev,
      policies: { ...prev.policies, [field]: value }
    }));
  };

  const handleSave = () => {
    // Validate required fields
    if (!courseData.course.title.trim()) {
      toast({
        title: "Validation Error",
        description: "Course title is required",
        variant: "destructive"
      });
      return;
    }

    // Validate grading weights
    const totalWeight = courseData.grading.reduce((sum, comp) => sum + comp.weight, 0);
    if (Math.abs(totalWeight - 1) > 0.01) {
      toast({
        title: "Grading Warning",
        description: `Total grading weight is ${(totalWeight * 100).toFixed(1)}%. Consider adjusting to 100%.`,
        variant: "destructive"
      });
    }

    onSave(courseData);
  };

  const totalGradingWeight = courseData.grading.reduce((sum, comp) => sum + comp.weight, 0);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-foreground">Review & Edit Course Information</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Save Course
          </Button>
        </div>
      </div>

      {/* Course Information */}
      <Card>
        <CardHeader>
          <CardTitle>Course Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Course Title</Label>
              <Input
                id="title"
                value={courseData.course.title}
                onChange={(e) => updateCourse('title', e.target.value)}
                placeholder="e.g., Introduction to Computer Science"
              />
            </div>
            <div>
              <Label htmlFor="code">Course Code</Label>
              <Input
                id="code"
                value={courseData.course.code}
                onChange={(e) => updateCourse('code', e.target.value)}
                placeholder="e.g., CS101"
              />
            </div>
            <div>
              <Label htmlFor="semester">Semester</Label>
              <Input
                id="semester"
                value={courseData.course.semester}
                onChange={(e) => updateCourse('semester', e.target.value)}
                placeholder="e.g., Fall 2024"
              />
            </div>
            <div>
              <Label htmlFor="institution">Institution</Label>
              <Input
                id="institution"
                value={courseData.course.institution}
                onChange={(e) => updateCourse('institution', e.target.value)}
                placeholder="e.g., University of Example"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instructors */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Instructors</CardTitle>
          <Button size="sm" onClick={addInstructor}>
            <Plus className="w-4 h-4 mr-2" />
            Add Instructor
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {courseData.instructors.map((instructor, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant={instructor.role === 'professor' ? 'default' : 'secondary'}>
                  {instructor.role === 'professor' ? 'Professor' : 'Teaching Assistant'}
                </Badge>
                {courseData.instructors.length > 1 && (
                  <Button size="sm" variant="ghost" onClick={() => removeInstructor(index)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor={`instructor-name-${index}`}>Name</Label>
                  <Input
                    id={`instructor-name-${index}`}
                    value={instructor.name}
                    onChange={(e) => updateInstructor(index, 'name', e.target.value)}
                    placeholder="Dr. Jane Smith"
                  />
                </div>
                <div>
                  <Label htmlFor={`instructor-email-${index}`}>Email</Label>
                  <Input
                    id={`instructor-email-${index}`}
                    value={instructor.email}
                    onChange={(e) => updateInstructor(index, 'email', e.target.value)}
                    placeholder="jane.smith@university.edu"
                  />
                </div>
                <div>
                  <Label htmlFor={`instructor-hours-${index}`}>Office Hours</Label>
                  <Input
                    id={`instructor-hours-${index}`}
                    value={instructor.office_hours}
                    onChange={(e) => updateInstructor(index, 'office_hours', e.target.value)}
                    placeholder="Mon & Wed 2-4 PM"
                  />
                </div>
                <div>
                  <Label htmlFor={`instructor-location-${index}`}>Office Location</Label>
                  <Input
                    id={`instructor-location-${index}`}
                    value={instructor.location}
                    onChange={(e) => updateInstructor(index, 'location', e.target.value)}
                    placeholder="Building A, Room 123"
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Grading Components */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Grade Distribution</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Total Weight: {(totalGradingWeight * 100).toFixed(1)}%
              {Math.abs(totalGradingWeight - 1) > 0.01 && (
                <span className="text-destructive ml-2">⚠ Should total 100%</span>
              )}
            </p>
          </div>
          <Button size="sm" onClick={addGradingComponent}>
            <Plus className="w-4 h-4 mr-2" />
            Add Component
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {courseData.grading.map((component, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Component {index + 1}</h4>
                {courseData.grading.length > 1 && (
                  <Button size="sm" variant="ghost" onClick={() => removeGradingComponent(index)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label htmlFor={`component-name-${index}`}>Component Name</Label>
                  <Input
                    id={`component-name-${index}`}
                    value={component.component}
                    onChange={(e) => updateGradingComponent(index, 'component', e.target.value)}
                    placeholder="e.g., Assignments"
                  />
                </div>
                <div>
                  <Label htmlFor={`component-weight-${index}`}>Weight (%)</Label>
                  <Input
                    id={`component-weight-${index}`}
                    type="number"
                    min="0"
                    max="100"
                    value={(component.weight * 100).toString()}
                    onChange={(e) => updateGradingComponent(index, 'weight', parseFloat(e.target.value) / 100 || 0)}
                    placeholder="40"
                  />
                </div>
                <div className="md:col-span-1">
                  <Label htmlFor={`component-desc-${index}`}>Description</Label>
                  <Input
                    id={`component-desc-${index}`}
                    value={component.description || ''}
                    onChange={(e) => updateGradingComponent(index, 'description', e.target.value)}
                    placeholder="Short description"
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Policies */}
      <Card>
        <CardHeader>
          <CardTitle>Course Policies</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="late-work">Late Work Policy</Label>
            <Textarea
              id="late-work"
              value={courseData.policies.late_work}
              onChange={(e) => updatePolicy('late_work', e.target.value)}
              placeholder="Describe the late work policy..."
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="attendance">Attendance Policy</Label>
            <Textarea
              id="attendance"
              value={courseData.policies.attendance}
              onChange={(e) => updatePolicy('attendance', e.target.value)}
              placeholder="Describe the attendance policy..."
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="honor-code">Honor Code / Academic Integrity</Label>
            <Textarea
              id="honor-code"
              value={courseData.policies.honor_code}
              onChange={(e) => updatePolicy('honor_code', e.target.value)}
              placeholder="Describe academic integrity expectations..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};