-- Create google_integrations table for storing OAuth tokens
CREATE TABLE public.google_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  scopes TEXT[] NOT NULL,
  user_email TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.google_integrations ENABLE ROW LEVEL SECURITY;

-- Create policies for google_integrations
CREATE POLICY "Users can view google integrations for their projects" 
ON public.google_integrations 
FOR SELECT 
USING (can_access_project(auth.uid(), project_id));

CREATE POLICY "Users can create google integrations for their projects" 
ON public.google_integrations 
FOR INSERT 
WITH CHECK (can_access_project(auth.uid(), project_id));

CREATE POLICY "Users can update google integrations for their projects" 
ON public.google_integrations 
FOR UPDATE 
USING (can_access_project(auth.uid(), project_id));

CREATE POLICY "Users can delete google integrations for their projects" 
ON public.google_integrations 
FOR DELETE 
USING (can_access_project(auth.uid(), project_id));

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_google_integrations_updated_at
BEFORE UPDATE ON public.google_integrations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add unique constraint to ensure one Google integration per project
ALTER TABLE public.google_integrations 
ADD CONSTRAINT unique_project_google_integration 
UNIQUE (project_id);