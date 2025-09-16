import { useState } from "react";
import { DocumentUpload } from "@/components/DocumentUpload";
import { CourseStats } from "@/components/CourseStats";
import { ScheduleView } from "@/components/ScheduleView";
import { GradeBreakdown } from "@/components/GradeBreakdown";
import { GradeCalculator } from "@/components/GradeCalculator";
import { ContactInfo } from "@/components/ContactInfo";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { mockCourseData } from "@/data/mockCourse";
import { CourseData } from "@/types/course";
import { FileText, Calendar, BarChart3, Calculator, Users, BookOpen } from "lucide-react";

const Index = () => {
  const [courseData, setCourseData] = useState<CourseData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // For demo purposes, use mock data
    setCourseData(mockCourseData);
    setIsProcessing(false);
    
    toast({
      title: "Document processed successfully!",
      description: `Extracted course information from ${file.name}`,
    });
  };

  const handleUseSampleData = () => {
    setCourseData(mockCourseData);
    toast({
      title: "Sample data loaded",
      description: "You can now explore the dashboard features",
    });
  };

  if (!courseData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-12">
              <div className="w-20 h-20 bg-gradient-hero rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-strong">
                <BookOpen className="w-10 h-10 text-primary-foreground" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                Syllabus Dashboard
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Upload your course syllabus and get an instant, organized dashboard with 
                schedules, grades, contacts, and smart grade calculations.
              </p>
            </div>

            {/* Upload Section */}
            <div className="space-y-6">
              <DocumentUpload 
                onUpload={handleFileUpload} 
                isProcessing={isProcessing} 
              />
              
              {/* Demo Option */}
              <div className="text-center">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-1 h-px bg-border"></div>
                  <span className="text-sm text-muted-foreground bg-background px-3">
                    or explore with sample data
                  </span>
                  <div className="flex-1 h-px bg-border"></div>
                </div>
                
                <Button 
                  variant="outline" 
                  onClick={handleUseSampleData}
                  className="shadow-soft hover:shadow-medium transition-all"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  View Sample Course
                </Button>
              </div>
            </div>

            {/* Features Grid */}
            <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: Calendar,
                  title: "Smart Schedule",
                  description: "View your course timeline with activities, deadlines, and readings",
                  color: "text-primary"
                },
                {
                  icon: BarChart3,
                  title: "Grade Breakdown",
                  description: "Visual representation of grade weights and requirements",
                  color: "text-accent"
                },
                {
                  icon: Calculator,
                  title: "Grade Calculator",
                  description: "Calculate current grades and required scores for target grades",
                  color: "text-success"
                },
                {
                  icon: Users,
                  title: "Contact Info",
                  description: "Easy access to instructor emails and office hours",
                  color: "text-warning"
                }
              ].map((feature, index) => (
                <div key={index} className="p-6 rounded-lg border border-border/50 bg-gradient-card shadow-soft hover:shadow-medium transition-all">
                  <feature.icon className={`w-8 h-8 ${feature.color} mb-4`} />
                  <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
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

export default Index;
