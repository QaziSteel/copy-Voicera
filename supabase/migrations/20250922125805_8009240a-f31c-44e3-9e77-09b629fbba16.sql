-- Add assistant_id column to onboarding_responses table
ALTER TABLE public.onboarding_responses 
ADD COLUMN assistant_id text;

-- Set assistant_id for Shah G's record
UPDATE public.onboarding_responses 
SET assistant_id = '68f8777b-e60f-4ac4-b892-98db81a0b967'
WHERE user_id = '60923aa6-dd7b-4c04-8c00-586a0fe50a35';

-- All other records will have assistant_id as NULL by default