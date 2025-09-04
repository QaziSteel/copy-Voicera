-- Add purchased_number_details column to store rich phone number data
ALTER TABLE public.onboarding_responses 
ADD COLUMN purchased_number_details JSONB;