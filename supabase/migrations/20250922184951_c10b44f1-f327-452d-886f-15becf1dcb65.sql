-- Add current_status column to onboarding_responses table
ALTER TABLE public.onboarding_responses 
ADD COLUMN current_status text NOT NULL DEFAULT 'offline';

-- Add check constraint for valid status values
ALTER TABLE public.onboarding_responses 
ADD CONSTRAINT current_status_check 
CHECK (current_status IN ('live', 'offline', 'setup_required'));