import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CourseData, GradingComponent, Instructor, ActivityType } from "@/types/course";
import { Plus, Trash2, Save, X, Calendar, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

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

  const addScheduleItem = () => {
    setCourseData(prev => ({
      ...prev,
      schedule: [...prev.schedule, {
        date: "",
        week: prev.schedule.length + 1,
        topic: "",
        activities: [],
        deliverables: [],
        readings: []
      }]
    }));
  };

  const removeScheduleItem = (index: number) => {
    setCourseData(prev => ({
      ...prev,
      schedule: prev.schedule.filter((_, i) => i !== index)
    }));
  };

  const updateScheduleItem = (index: number, field: string, value: any) => {
    setCourseData(prev => ({
      ...prev,
      schedule: prev.schedule.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const addImportantDate = () => {
    setCourseData(prev => ({
      ...prev,
      important_dates: [...prev.important_dates, {
        name: "",
        date: "",
        type: "deadline" as const
      }]
    }));
  };

  const removeImportantDate = (index: number) => {
    setCourseData(prev => ({
      ...prev,
      important_dates: prev.important_dates.filter((_, i) => i !== index)
    }));
  };

  const updateImportantDate = (index: number, field: string, value: any) => {
    setCourseData(prev => ({
      ...prev,
      important_dates: prev.important_dates.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
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

      {/* Schedule */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Course Schedule
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Weekly topics, activities, and deliverables
            </p>
          </div>
          <Button size="sm" onClick={addScheduleItem}>
            <Plus className="w-4 h-4 mr-2" />
            Add Week
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {courseData.schedule.map((item, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Week {item.week}</h4>
                <Button size="sm" variant="ghost" onClick={() => removeScheduleItem(index)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label htmlFor={`schedule-date-${index}`}>Date/Week</Label>
                  <Input
                    id={`schedule-date-${index}`}
                    value={item.date}
                    onChange={(e) => updateScheduleItem(index, 'date', e.target.value)}
                    placeholder="2024-09-15 or Week 1"
                  />
                </div>
                <div>
                  <Label htmlFor={`schedule-week-${index}`}>Week Number</Label>
                  <Input
                    id={`schedule-week-${index}`}
                    type="number"
                    value={item.week}
                    onChange={(e) => updateScheduleItem(index, 'week', parseInt(e.target.value) || 1)}
                    placeholder="1"
                  />
                </div>
                <div>
                  <Label htmlFor={`schedule-topic-${index}`}>Topic</Label>
                  <Input
                    id={`schedule-topic-${index}`}
                    value={item.topic}
                    onChange={(e) => updateScheduleItem(index, 'topic', e.target.value)}
                    placeholder="Introduction to Programming"
                  />
                </div>
              </div>
              <div>
                <Label>Activities</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(['lecture', 'lab', 'quiz', 'exam', 'assignment', 'monitored'] as ActivityType[]).map(activity => (
                    <div key={activity} className="flex items-center space-x-2">
                      <Checkbox
                        id={`activity-${index}-${activity}`}
                        checked={item.activities.includes(activity)}
                        onCheckedChange={(checked) => {
                          const activities = checked 
                            ? [...item.activities, activity]
                            : item.activities.filter(a => a !== activity);
                          updateScheduleItem(index, 'activities', activities);
                        }}
                      />
                      <Label 
                        htmlFor={`activity-${index}-${activity}`}
                        className="text-sm capitalize cursor-pointer"
                      >
                        {activity}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor={`schedule-readings-${index}`}>Readings (comma-separated)</Label>
                <Input
                  id={`schedule-readings-${index}`}
                  value={item.readings?.join(', ') || ''}
                  onChange={(e) => updateScheduleItem(index, 'readings', e.target.value.split(',').map(r => r.trim()).filter(r => r))}
                  placeholder="Chapter 1, pp. 1-15"
                />
              </div>
            </div>
          ))}
          {courseData.schedule.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No schedule items yet. Add weeks to build your course schedule.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Important Dates */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Important Dates
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Exams, project deadlines, and other key dates
            </p>
          </div>
          <Button size="sm" onClick={addImportantDate}>
            <Plus className="w-4 h-4 mr-2" />
            Add Date
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {courseData.important_dates.map((item, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Important Date {index + 1}</h4>
                <Button size="sm" variant="ghost" onClick={() => removeImportantDate(index)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label htmlFor={`date-name-${index}`}>Event Name</Label>
                  <Input
                    id={`date-name-${index}`}
                    value={item.name}
                    onChange={(e) => updateImportantDate(index, 'name', e.target.value)}
                    placeholder="Midterm Exam"
                  />
                </div>
                <div>
                  <Label htmlFor={`date-date-${index}`}>Date</Label>
                  <Input
                    id={`date-date-${index}`}
                    type="date"
                    value={item.date}
                    onChange={(e) => updateImportantDate(index, 'date', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor={`date-type-${index}`}>Type</Label>
                  <Select
                    value={item.type}
                    onValueChange={(value) => updateImportantDate(index, 'type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="exam">Exam</SelectItem>
                      <SelectItem value="deadline">Deadline</SelectItem>
                      <SelectItem value="quiz">Quiz</SelectItem>
                      <SelectItem value="project">Project</SelectItem>
                      <SelectItem value="break">Break</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ))}
          {courseData.important_dates.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No important dates yet. Add key dates for your course.</p>
            </div>
          )}
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