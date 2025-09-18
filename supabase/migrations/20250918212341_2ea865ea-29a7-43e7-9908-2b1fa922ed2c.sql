-- Add calendar integration required field to onboarding responses
ALTER TABLE public.onboarding_responses 
ADD COLUMN calendar_integration_required boolean DEFAULT false;