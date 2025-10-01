-- Clean up and restructure business_types and services columns in onboarding_responses

-- Step 1: Clean up business_types column to be simple string arrays
-- Extract just the business type names from any complex objects
UPDATE onboarding_responses
SET business_types = (
  SELECT jsonb_agg(DISTINCT elem)
  FROM (
    SELECT CASE 
      -- If it's an object with a 'type' field, extract the type
      WHEN jsonb_typeof(value) = 'object' AND value ? 'type' THEN value->>'type'
      -- If it's an object with a 'businessType' field, extract businessType
      WHEN jsonb_typeof(value) = 'object' AND value ? 'businessType' THEN value->>'businessType'
      -- If it's a string, use it directly
      WHEN jsonb_typeof(value) = 'string' THEN value#>>'{}'
      ELSE NULL
    END as elem
    FROM jsonb_array_elements(business_types) as value
    WHERE value IS NOT NULL
  ) extracted
  WHERE elem IS NOT NULL
)
WHERE business_types IS NOT NULL 
  AND jsonb_typeof(business_types) = 'array';

-- Step 2: Restructure services column to have proper format
-- Ensure all services have businessType, type, hours, and minutes
UPDATE onboarding_responses
SET services = (
  SELECT jsonb_agg(
    jsonb_build_object(
      'businessType', COALESCE(
        value->>'businessType',
        value->>'type',
        'General'
      ),
      'type', COALESCE(
        value->>'type',
        value->>'service',
        value->>'serviceName',
        'Service'
      ),
      'hours', COALESCE(
        value->>'hours',
        '01 hr'
      ),
      'minutes', COALESCE(
        value->>'minutes',
        '00 min'
      )
    )
  )
  FROM jsonb_array_elements(services) as value
)
WHERE services IS NOT NULL 
  AND jsonb_typeof(services) = 'array';

-- Step 3: Add helpful comments
COMMENT ON COLUMN onboarding_responses.business_types IS 
'Array of business type names (strings) selected by the user, e.g., ["Hair Salon", "Medical Clinic"]';

COMMENT ON COLUMN onboarding_responses.services IS 
'Array of service objects with structure: {businessType: string, type: string (service name), hours: string, minutes: string}';