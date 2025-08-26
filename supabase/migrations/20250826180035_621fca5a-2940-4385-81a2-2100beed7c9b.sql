-- Create onboarding_responses table to store all onboarding answers
CREATE TABLE public.onboarding_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  business_name TEXT,
  business_type TEXT,
  primary_location TEXT,
  contact_number TEXT,
  ai_voice_style TEXT,
  ai_greeting_style JSONB,
  ai_assistant_name TEXT,
  ai_handling_unknown TEXT,
  ai_call_schedule TEXT,
  services JSONB,
  business_days JSONB,
  business_hours JSONB,
  appointment_duration TEXT,
  schedule_full_action TEXT,
  wants_daily_summary BOOLEAN,
  wants_email_confirmations BOOLEAN,
  reminder_settings JSONB,
  faq_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.onboarding_responses ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own onboarding responses" 
ON public.onboarding_responses 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own onboarding responses" 
ON public.onboarding_responses 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own onboarding responses" 
ON public.onboarding_responses 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own onboarding responses" 
ON public.onboarding_responses 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_onboarding_responses_updated_at
BEFORE UPDATE ON public.onboarding_responses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();