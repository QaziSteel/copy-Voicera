-- Create test_call_logs table for tracking agent test calls
CREATE TABLE public.test_call_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL,
  project_id UUID NOT NULL,
  user_id UUID NOT NULL,
  assistant_id TEXT,
  call_started_at TIMESTAMP WITH TIME ZONE,
  call_ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.test_call_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for test call logs access
CREATE POLICY "Users can view test calls for accessible agents" 
ON public.test_call_logs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM onboarding_responses or_table 
    WHERE or_table.id = test_call_logs.agent_id 
    AND (
      (or_table.project_id IS NOT NULL AND can_access_project(auth.uid(), or_table.project_id))
      OR (or_table.project_id IS NULL AND auth.uid() = or_table.user_id)
    )
  )
);

CREATE POLICY "Users can create test calls for accessible agents" 
ON public.test_call_logs 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  AND EXISTS (
    SELECT 1 FROM onboarding_responses or_table 
    WHERE or_table.id = test_call_logs.agent_id 
    AND (
      (or_table.project_id IS NOT NULL AND can_access_project(auth.uid(), or_table.project_id))
      OR (or_table.project_id IS NULL AND auth.uid() = or_table.user_id)
    )
  )
);

CREATE POLICY "Users can update test calls for accessible agents" 
ON public.test_call_logs 
FOR UPDATE 
USING (
  auth.uid() = user_id 
  AND EXISTS (
    SELECT 1 FROM onboarding_responses or_table 
    WHERE or_table.id = test_call_logs.agent_id 
    AND (
      (or_table.project_id IS NOT NULL AND can_access_project(auth.uid(), or_table.project_id))
      OR (or_table.project_id IS NULL AND auth.uid() = or_table.user_id)
    )
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_test_call_logs_updated_at
BEFORE UPDATE ON public.test_call_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();