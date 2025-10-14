-- Create courses table
CREATE TABLE public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  semester TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_modified TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own courses" 
ON public.courses 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own courses" 
ON public.courses 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own courses" 
ON public.courses 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own courses" 
ON public.courses 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_courses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_modified = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_courses_last_modified
BEFORE UPDATE ON public.courses
FOR EACH ROW
EXECUTE FUNCTION public.update_courses_updated_at();