import { useState } from "react";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import { extractCourseData } from "@/utils/documentParser";
import { Link } from "react-router-dom";
import { DocumentUpload } from "@/components/DocumentUpload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useCourses } from "@/hooks/useCourses";
import { mockCourseData } from "@/data/mockCourse";
import { BookOpen, Plus, Calendar, Users, Trash2, Eye } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const Courses = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const { courses, addCourse, deleteCourse } = useCourses();
  const { toast } = useToast();

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    try {
      // Read PDF file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      // Load PDF with pdfjs
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let content = "";
      const pages = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => (item.str || "")).join(" ");
        content += pageText + "\n";
        pages.push({ page_number: i, content: pageText });
      }
      // Use your AI/NLP extraction logic
      const parsedDoc = { content, pages };
      const extracted = extractCourseData(parsedDoc);
      if (!extracted) throw new Error("Could not extract course data");
      const newCourse = addCourse(extracted, file.name);
      setIsUploading(false);
      setShowUpload(false);
      toast({
        title: "Syllabus uploaded successfully!",
        description: `Created profile for ${newCourse.name}`,
      });
    } catch (error) {
      setIsUploading(false);
      toast({
        title: "Upload failed",
        description: "There was an error processing your document. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleUseSampleData = () => {
    const newCourse = addCourse(mockCourseData, "Sample Course");
    toast({
      title: "Sample course added",
      description: `Created profile for ${newCourse.name}`,
    });
  };

  const handleDeleteCourse = (courseId: string, courseName: string) => {
    deleteCourse(courseId);
    toast({
      title: "Course deleted",
      description: `Removed ${courseName} from your courses`,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-20 h-20 bg-gradient-hero rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-strong">
              <BookOpen className="w-10 h-10 text-primary-foreground" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Your Course Profiles
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Manage all your course syllabi in one place. Upload new documents or view existing course dashboards.
            </p>
          </div>

          {/* Upload Section */}
          {showUpload && (
            <div className="mb-12">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-foreground">Upload New Syllabus</h2>
                <Button variant="ghost" onClick={() => setShowUpload(false)}>
                  Cancel
                </Button>
              </div>
              <DocumentUpload 
                onUpload={handleFileUpload} 
                isProcessing={isUploading} 
              />
            </div>
          )}

          {/* Action Buttons */}
          {!showUpload && (
            <div className="flex flex-wrap gap-4 justify-center mb-12">
              <Button 
                onClick={() => setShowUpload(true)}
                className="shadow-soft hover:shadow-medium transition-all"
              >
                <Plus className="w-4 h-4 mr-2" />
                Upload New Syllabus
              </Button>
              <Button 
                variant="outline" 
                onClick={handleUseSampleData}
                className="shadow-soft hover:shadow-medium transition-all"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Add Sample Course
              </Button>
            </div>
          )}

          {/* Courses Grid */}
          {courses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <Card key={course.id} className="shadow-soft hover:shadow-medium transition-all group">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-semibold text-foreground mb-2">
                          {course.name}
                        </CardTitle>
                        {course.code && (
                          <Badge variant="secondary" className="mb-2">
                            {course.code}
                          </Badge>
                        )}
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Course</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{course.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeleteCourse(course.id, course.name)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3 mb-4">
                      {course.semester && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          {course.semester}
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="w-4 h-4" />
                        {course.data.instructors.length} instructor{course.data.instructors.length !== 1 ? 's' : ''}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Added {new Date(course.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <Link to={`/course/${course.id}`}>
                      <Button className="w-full">
                        <Eye className="w-4 h-4 mr-2" />
                        View Dashboard
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No courses yet</h3>
              <p className="text-muted-foreground mb-6">
                Upload your first syllabus to get started with course management.
              </p>
              <Button onClick={() => setShowUpload(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Upload Your First Syllabus
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Courses;
