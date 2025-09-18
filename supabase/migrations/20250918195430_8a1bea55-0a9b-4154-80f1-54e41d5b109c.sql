-- Remove the redundant business_type column as data is now stored in business_types
ALTER TABLE public.onboarding_responses 
DROP COLUMN business_type;