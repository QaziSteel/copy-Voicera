-- Remove 'setup_required' from the current_status check constraint
ALTER TABLE public.onboarding_responses 
DROP CONSTRAINT IF EXISTS onboarding_responses_current_status_check;

-- Add updated constraint with only 'live' and 'offline' values
ALTER TABLE public.onboarding_responses 
ADD CONSTRAINT onboarding_responses_current_status_check 
CHECK (current_status IN ('live', 'offline'));