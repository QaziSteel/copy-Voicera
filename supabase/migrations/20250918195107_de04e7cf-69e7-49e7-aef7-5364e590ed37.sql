-- Add new business_types column as JSONB
ALTER TABLE public.onboarding_responses 
ADD COLUMN business_types JSONB;

-- Migrate existing data from business_type + appointment_duration to business_types
UPDATE public.onboarding_responses 
SET business_types = jsonb_build_array(
  jsonb_build_object(
    'type', COALESCE(business_type, 'General Service'),
    'hours', CASE 
      WHEN appointment_duration IS NULL THEN '1'
      WHEN appointment_duration ILIKE '%hour%' THEN 
        CASE 
          WHEN appointment_duration ILIKE '%1 hour%' THEN '1'
          WHEN appointment_duration ILIKE '%2 hour%' THEN '2'
          WHEN appointment_duration ILIKE '%30 minute%' THEN '0'
          WHEN appointment_duration ILIKE '%45 minute%' THEN '0'
          ELSE '1'
        END
      ELSE '0'
    END,
    'minutes', CASE 
      WHEN appointment_duration IS NULL THEN '30'
      WHEN appointment_duration ILIKE '%30 minute%' THEN '30'
      WHEN appointment_duration ILIKE '%45 minute%' THEN '45'
      WHEN appointment_duration ILIKE '%1 hour 30%' THEN '30'
      WHEN appointment_duration ILIKE '%1 hour%' AND appointment_duration NOT ILIKE '%30%' THEN '0'
      WHEN appointment_duration ILIKE '%2 hour%' THEN '0'
      ELSE '30'
    END
  )
)
WHERE business_types IS NULL;

-- Remove the appointment_duration column as it's now stored within business_types
ALTER TABLE public.onboarding_responses 
DROP COLUMN appointment_duration;

-- Add a comment to the new column for clarity
COMMENT ON COLUMN public.onboarding_responses.business_types IS 'JSONB array containing business types with individual appointment durations';