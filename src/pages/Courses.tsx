import { useState } from "react";
import { Link } from "react-router-dom";
import { DocumentUpload } from "@/components/DocumentUpload";
import { CourseDataEditor } from "@/components/CourseDataEditor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useCourses } from "@/hooks/useCourses";
import { mockCourseData } from "@/data/mockCourse";
import { BookOpen, Plus, Calendar, Users, Trash2, Eye } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { extractTextFromFile } from "@/utils/fileExtract";
import { analyzeDocumentWithAI } from "@/utils/aiDocumentAnalyzer";
import { CourseData } from "@/types/course";

const Courses = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [extractedData, setExtractedData] = useState<CourseData | null>(null);
  const { courses, addCourse, deleteCourse } = useCourses();
  const { toast } = useToast();

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);

    try {
      // 1) Extract raw text from file (PDF/DOCX)
      const parsedDoc = await extractTextFromFile(file);

      // 2) Use AI to analyze and extract structured data
      const aiResult = await analyzeDocumentWithAI(parsedDoc.content);

      // Set up extracted data for editing
      setExtractedData({
        ...aiResult.extractedData,
        course: {
          ...aiResult.extractedData.course,
          title: aiResult.extractedData.course.title || file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, ' ')
        }
      });
      setShowEditor(true);

      // Show success toast with confidence level and extraction details
      toast({
        title: "Document analyzed successfully!",
        description: `AI confidence: ${Math.round(aiResult.confidence * 100)}%. Found ${aiResult.extractedData.schedule.length} schedule items and ${aiResult.extractedData.important_dates.length} important dates.`,
      });

      // Log extraction details for debugging
      console.log("AI Analysis Results:", {
        confidence: aiResult.confidence,
        scheduleItems: aiResult.extractedData.schedule.length,
        importantDates: aiResult.extractedData.important_dates.length,
        extractionLog: aiResult.extractionLog
      });
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'There was an error processing your document.';
      toast({
        title: "Upload failed",
        description: msg,
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveCourse = async (courseData: CourseData) => {
    const newCourse = await addCourse(courseData, extractedData?.course.title || "New Course");
    if (newCourse) {
      toast({
        title: "Course saved successfully!",
        description: `Created profile for ${newCourse.name}`,
      });
      setShowEditor(false);
      setShowUpload(false);
      setExtractedData(null);
    }
  };

  const handleCancelEdit = () => {
    setShowEditor(false);
    setShowUpload(false);
    setExtractedData(null);
  };

  const handleUseSampleData = async () => {
    const newCourse = await addCourse(mockCourseData, "Sample Course");
    if (newCourse) {
      toast({
        title: "Sample course added",
        description: `Created profile for ${newCourse.name}`,
      });
    }
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

          {/* Course Editor Modal */}
          {showEditor && extractedData && (
            <div className="fixed inset-0 bg-black/50 flex items-start justify-center p-4 z-50 overflow-y-auto">
              <div className="bg-background rounded-lg shadow-xl max-w-6xl w-full my-8">
                <CourseDataEditor
                  initialData={extractedData}
                  onSave={handleSaveCourse}
                  onCancel={handleCancelEdit}
                />
              </div>
            </div>
          )}

          {/* Upload Section */}
          {showUpload && !showEditor && (
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
          {!showUpload && !showEditor && (
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
              {courses.length > 0 && (
                <Link to="/calendar">
                  <Button 
                    variant="outline"
                    className="shadow-soft hover:shadow-medium transition-all"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    View Calendar
                  </Button>
                </Link>
              )}
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