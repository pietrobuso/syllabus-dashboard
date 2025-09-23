import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useCourses } from "@/hooks/useCourses";
import { BookOpen, Upload, FolderOpen, Calendar, BarChart3, Calculator, Users } from "lucide-react";

const Index = () => {
  const { courses } = useCourses();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <div className="container mx-auto px-6 py-16">
        <div className="max-w-5xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-20">
            <div className="w-24 h-24 bg-gradient-to-br from-pink-500 to-orange-400 rounded-3xl mx-auto mb-8 flex items-center justify-center shadow-xl ring-2 ring-pink-200">
              <BookOpen className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-6 tracking-tight drop-shadow-lg">
              Syllabus Dashboard
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed font-light">
              Upload your course syllabi and get instant, organized dashboards with 
              schedules, grades, contacts, and smart grade calculations.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-24">
            <Link to="/courses">
              <Button size="lg" className="shadow-lg hover:shadow-xl transition-all duration-300 min-w-[220px] h-14 text-lg font-semibold bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white">
                <Upload className="w-6 h-6 mr-3" />
                Upload Syllabus
              </Button>
            </Link>
            {courses.length > 0 && (
              <>
                <Link to="/courses">
                  <Button variant="outline" size="lg" className="shadow-lg hover:shadow-xl transition-all duration-300 min-w-[220px] h-14 text-lg font-semibold border-2 border-white text-white hover:bg-white/20">
                    <FolderOpen className="w-6 h-6 mr-3" />
                    View My Courses ({courses.length})
                  </Button>
                </Link>
                <Link to="/calendar">
                  <Button variant="outline" size="lg" className="shadow-lg hover:shadow-xl transition-all duration-300 min-w-[220px] h-14 text-lg font-semibold border-2 border-white text-white hover:bg-white/20">
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
                color: "text-pink-500",
                bgColor: "bg-pink-100"
              },
              {
                icon: BarChart3,
                title: "Grade Breakdown",
                description: "Visual representation of grade weights and requirements",
                color: "text-indigo-500",
                bgColor: "bg-indigo-100"
              },
              {
                icon: Calculator,
                title: "Grade Calculator",
                description: "Calculate current grades and required scores for target grades",
                color: "text-green-500",
                bgColor: "bg-green-100"
              },
              {
                icon: Users,
                title: "Contact Info",
                description: "Easy access to instructor emails and office hours",
                color: "text-yellow-500",
                bgColor: "bg-yellow-100"
              }
            ].map((feature, index) => (
              <div key={index} className="group p-8 rounded-2xl border border-white/40 bg-white/10 backdrop-blur-lg shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:border-white/70">
                <div className={`w-16 h-16 ${feature.bgColor} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`w-8 h-8 ${feature.color}`} />
                </div>
                <h3 className="font-bold text-white mb-3 text-lg">{feature.title}</h3>
                <p className="text-white/80 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* Quick Start */}
          <div className="mt-24 text-center">
            <h2 className="text-3xl font-extrabold text-white mb-6 drop-shadow-lg">Get Started in Seconds</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {["Upload", "Extract", "Organize"].map((step, i) => (
                <div key={i} className="group flex flex-col items-center gap-4 p-8 rounded-2xl bg-white/10 border border-white/40 hover:shadow-xl transition-all duration-300 backdrop-blur-lg">
                  <div className="w-16 h-16 bg-gradient-to-tr from-yellow-400 to-pink-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <span className="text-white font-bold text-xl">{i + 1}</span>
                  </div>
                  <h3 className="font-bold text-white text-xl">{step}</h3>
                  <p className="text-white/80 text-center leading-relaxed">
                    {i === 0 && "Drag & drop your PDF or DOCX syllabus"}
                    {i === 1 && "AI automatically extracts course information"}
                    {i === 2 && "View your organized course dashboard"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
