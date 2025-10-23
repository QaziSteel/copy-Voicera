-- Clean up corrupted services with names of 2 characters or less
-- This updates the services JSONB array to filter out invalid entries

UPDATE onboarding_responses
SET services = (
  SELECT jsonb_agg(service)
  FROM jsonb_array_elements(services) AS service
  WHERE LENGTH(TRIM(COALESCE(service->>'type', service->>'service', ''))) > 2
)
WHERE services IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM jsonb_array_elements(services) AS service
    WHERE LENGTH(TRIM(COALESCE(service->>'type', service->>'service', ''))) <= 2
  );