import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useCourses } from "@/hooks/useCourses";
import { BookOpen, Upload, FolderOpen, Calendar, BarChart3, Calculator, Users } from "lucide-react";

const Index = () => {
  const { courses } = useCourses();

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
              Upload your course syllabi and get instant, organized dashboards with 
              schedules, grades, contacts, and smart grade calculations.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link to="/courses">
              <Button size="lg" className="shadow-soft hover:shadow-medium transition-all min-w-[200px]">
                <Upload className="w-5 h-5 mr-2" />
                Upload Syllabus
              </Button>
            </Link>
            {courses.length > 0 && (
              <>
                <Link to="/courses">
                  <Button variant="outline" size="lg" className="shadow-soft hover:shadow-medium transition-all min-w-[200px]">
                    <FolderOpen className="w-5 h-5 mr-2" />
                    View My Courses ({courses.length})
                  </Button>
                </Link>
                <Link to="/calendar">
                  <Button variant="outline" size="lg" className="shadow-soft hover:shadow-medium transition-all min-w-[200px]">
                    <Calendar className="w-5 h-5 mr-2" />
                    Calendar View
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

          {/* Quick Start */}
          <div className="mt-16 text-center">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Get Started in Seconds</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-primary font-semibold">1</span>
                </div>
                <h3 className="font-medium text-foreground">Upload</h3>
                <p className="text-sm text-muted-foreground text-center">Drag & drop your PDF or DOCX syllabus</p>
              </div>
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-primary font-semibold">2</span>
                </div>
                <h3 className="font-medium text-foreground">Extract</h3>
                <p className="text-sm text-muted-foreground text-center">AI automatically extracts course information</p>
              </div>
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-primary font-semibold">3</span>
                </div>
                <h3 className="font-medium text-foreground">Organize</h3>
                <p className="text-sm text-muted-foreground text-center">View your organized course dashboard</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
