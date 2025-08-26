-- Remove the onboarding_completed column from profiles table
ALTER TABLE public.profiles DROP COLUMN IF EXISTS onboarding_completed;