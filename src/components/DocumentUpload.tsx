import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, FileText, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DocumentUploadProps {
  onUpload: (file: File) => void;
  isProcessing?: boolean;
}

export const DocumentUpload = ({ onUpload, isProcessing = false }: DocumentUploadProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleFileSelect = (file: File) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF or Word document",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 20 * 1024 * 1024) { // 20MB limit
      toast({
        title: "File too large", 
        description: "Please upload a file smaller than 20MB",
        variant: "destructive"
      });
      return;
    }

    setUploadedFile(file);
    onUpload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  return (
    <Card className={`transition-all duration-200 ${isDragOver ? 'ring-2 ring-primary shadow-medium' : 'shadow-soft'}`}>
      <CardContent className="p-8">
        <div
          className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
            isDragOver 
              ? 'border-primary bg-primary/5' 
              : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30'
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
        >
          {uploadedFile && !isProcessing ? (
            <div className="flex flex-col items-center gap-4">
              <CheckCircle className="w-16 h-16 text-success" />
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">File uploaded successfully!</h3>
                <p className="text-sm text-muted-foreground">{uploadedFile.name}</p>
              </div>
            </div>
          ) : isProcessing ? (
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">Processing document...</h3>
                <p className="text-sm text-muted-foreground">Extracting course information</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <Upload className="w-16 h-16 text-muted-foreground" />
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Upload your syllabus</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Drag and drop your PDF or Word document, or click to select
                </p>
                <p className="text-xs text-muted-foreground">
                  Supported formats: PDF, DOCX, DOC (Max 20MB)
                </p>
              </div>
              <Button className="mt-2">
                <FileText className="w-4 h-4 mr-2" />
                Select Document
              </Button>
            </div>
          )}
          
          <input
            type="file"
            accept=".pdf,.docx,.doc"
            onChange={handleFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isProcessing}
          />
        </div>
      </CardContent>
    </Card>
  );
};