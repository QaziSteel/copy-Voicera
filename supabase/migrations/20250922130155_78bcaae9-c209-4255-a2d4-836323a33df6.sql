-- Reset all assistant_id values to NULL first
UPDATE public.onboarding_responses 
SET assistant_id = NULL;

-- Set assistant_id only for the specific Shah G record
UPDATE public.onboarding_responses 
SET assistant_id = '68f8777b-e60f-4ac4-b892-98db81a0b967'
WHERE id = 'db01a340-f68c-444b-8a6a-30638347224d';