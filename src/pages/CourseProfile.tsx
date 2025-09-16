import { useParams, Link, Navigate } from "react-router-dom";
import { CourseStats } from "@/components/CourseStats";
import { ScheduleView } from "@/components/ScheduleView";
import { GradeBreakdown } from "@/components/GradeBreakdown";
import { GradeCalculator } from "@/components/GradeCalculator";
import { ContactInfo } from "@/components/ContactInfo";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCourses } from "@/hooks/useCourses";
import { FileText, Calendar, BarChart3, Calculator, Users, ArrowLeft } from "lucide-react";

const CourseProfile = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { getCourse } = useCourses();

  if (!courseId) {
    return <Navigate to="/courses" replace />;
  }

  const course = getCourse(courseId);

  if (!course) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-foreground mb-2">Course not found</h1>
          <p className="text-muted-foreground mb-4">The course you're looking for doesn't exist.</p>
          <Link to="/courses">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Courses
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const courseData = course.data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Navigation Header */}
          <div className="mb-6">
            <Link to="/courses">
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Courses
              </Button>
            </Link>
          </div>

          {/* Course Stats Header */}
          <div className="mb-8">
            <CourseStats courseData={courseData} />
          </div>

          {/* Main Dashboard Tabs */}
          <Tabs defaultValue="schedule" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto p-1 bg-muted/50">
              <TabsTrigger value="schedule" className="flex items-center gap-2 py-3">
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline">Schedule</span>
              </TabsTrigger>
              <TabsTrigger value="grades" className="flex items-center gap-2 py-3">
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Grades</span>
              </TabsTrigger>
              <TabsTrigger value="calculator" className="flex items-center gap-2 py-3">
                <Calculator className="w-4 h-4" />
                <span className="hidden sm:inline">Calculator</span>
              </TabsTrigger>
              <TabsTrigger value="contacts" className="flex items-center gap-2 py-3">
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Contacts</span>
              </TabsTrigger>
              <TabsTrigger value="overview" className="flex items-center gap-2 py-3">
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="schedule" className="space-y-6">
              <ScheduleView schedule={courseData.schedule} />
            </TabsContent>

            <TabsContent value="grades" className="space-y-6">
              <GradeBreakdown grading={courseData.grading} />
            </TabsContent>

            <TabsContent value="calculator" className="space-y-6">
              <GradeCalculator grading={courseData.grading} />
            </TabsContent>

            <TabsContent value="contacts" className="space-y-6">
              <ContactInfo instructors={courseData.instructors} />
            </TabsContent>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <GradeBreakdown grading={courseData.grading} />
                <ContactInfo instructors={courseData.instructors} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default CourseProfile;