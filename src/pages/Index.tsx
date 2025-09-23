import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useCourses } from "@/hooks/useCourses";
import { BookOpen, Upload, FolderOpen, Calendar, BarChart3, Calculator, Users } from "lucide-react";

const Index = () => {
  const { courses } = useCourses();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-muted/20">
      <div className="container mx-auto px-6 py-16">
        <div className="max-w-5xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-20">
            <div className="w-24 h-24 bg-gradient-hero rounded-3xl mx-auto mb-8 flex items-center justify-center shadow-strong ring-1 ring-primary/20">
              <BookOpen className="w-12 h-12 text-primary-foreground" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 tracking-tight">
              Syllabus Dashboard
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-light">
              Upload your course syllabi and get instant, organized dashboards with 
              schedules, grades, contacts, and smart grade calculations.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-24">
            <Link to="/courses">
              <Button size="lg" className="shadow-medium hover:shadow-strong transition-all duration-300 min-w-[220px] h-14 text-lg font-medium bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary">
                <Upload className="w-6 h-6 mr-3" />
                Upload Syllabus
              </Button>
            </Link>
            {courses.length > 0 && (
              <>
                <Link to="/courses">
                  <Button variant="outline" size="lg" className="shadow-medium hover:shadow-strong transition-all duration-300 min-w-[220px] h-14 text-lg font-medium border-2 hover:bg-muted/50">
                    <FolderOpen className="w-6 h-6 mr-3" />
                    View My Courses ({courses.length})
                  </Button>
                </Link>
                <Link to="/calendar">
                  <Button variant="outline" size="lg" className="shadow-medium hover:shadow-strong transition-all duration-300 min-w-[220px] h-14 text-lg font-medium border-2 hover:bg-muted/50">
                    <Calendar className="w-6 h-6 mr-3" />
                    Calendar View
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Calendar,
                title: "Smart Schedule",
                description: "View your course timeline with activities, deadlines, and readings",
                color: "text-primary",
                bgColor: "bg-primary/5"
              },
              {
                icon: BarChart3,
                title: "Grade Breakdown",
                description: "Visual representation of grade weights and requirements",
                color: "text-accent",
                bgColor: "bg-accent/5"
              },
              {
                icon: Calculator,
                title: "Grade Calculator",
                description: "Calculate current grades and required scores for target grades",
                color: "text-success",
                bgColor: "bg-success/5"
              },
              {
                icon: Users,
                title: "Contact Info",
                description: "Easy access to instructor emails and office hours",
                color: "text-warning",
                bgColor: "bg-warning/5"
              }
            ].map((feature, index) => (
              <div key={index} className="group p-8 rounded-2xl border border-border/60 bg-gradient-card shadow-medium hover:shadow-strong transition-all duration-300 hover:scale-105 hover:border-primary/30">
                <div className={`w-16 h-16 ${feature.bgColor} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`w-8 h-8 ${feature.color}`} />
                </div>
                <h3 className="font-bold text-foreground mb-3 text-lg">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* Quick Start */}
          <div className="mt-24 text-center">
            <h2 className="text-3xl font-bold text-foreground mb-6">Get Started in Seconds</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="group flex flex-col items-center gap-4 p-8 rounded-2xl bg-gradient-card border border-border/60 hover:shadow-medium transition-all duration-300">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300">
                  <span className="text-primary font-bold text-xl">1</span>
                </div>
                <h3 className="font-bold text-foreground text-xl">Upload</h3>
                <p className="text-muted-foreground text-center leading-relaxed">Drag & drop your PDF or DOCX syllabus</p>
              </div>
              <div className="group flex flex-col items-center gap-4 p-8 rounded-2xl bg-gradient-card border border-border/60 hover:shadow-medium transition-all duration-300">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300">
                  <span className="text-primary font-bold text-xl">2</span>
                </div>
                <h3 className="font-bold text-foreground text-xl">Extract</h3>
                <p className="text-muted-foreground text-center leading-relaxed">AI automatically extracts course information</p>
              </div>
              <div className="group flex flex-col items-center gap-4 p-8 rounded-2xl bg-gradient-card border border-border/60 hover:shadow-medium transition-all duration-300">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300">
                  <span className="text-primary font-bold text-xl">3</span>
                </div>
                <h3 className="font-bold text-foreground text-xl">Organize</h3>
                <p className="text-muted-foreground text-center leading-relaxed">View your organized course dashboard</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
