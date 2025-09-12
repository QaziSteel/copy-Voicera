-- Update phone_numbers table to use external IDs from onboarding data
-- First, create a temporary mapping of old IDs to new external IDs
WITH phone_number_mapping AS (
  SELECT 
    pn.id as old_id,
    pn.phone_number,
    (or_table.purchased_number_details->>'id')::uuid as external_id
  FROM phone_numbers pn
  JOIN onboarding_responses or_table ON or_table.contact_number = pn.phone_number
  WHERE or_table.purchased_number_details->>'id' IS NOT NULL
    AND or_table.purchased_number_details->>'id' != ''
)
-- Update call_logs first to reference the new external IDs
UPDATE call_logs 
SET phone_number_id = pnm.external_id
FROM phone_number_mapping pnm
WHERE call_logs.phone_number_id = pnm.old_id;

-- Now update the phone_numbers table IDs to use external IDs
WITH phone_number_updates AS (
  SELECT 
    pn.id as old_id,
    pn.phone_number,
    pn.project_id,
    pn.is_active,
    pn.created_at,
    pn.updated_at,
    (or_table.purchased_number_details->>'id')::uuid as external_id
  FROM phone_numbers pn
  JOIN onboarding_responses or_table ON or_table.contact_number = pn.phone_number
  WHERE or_table.purchased_number_details->>'id' IS NOT NULL
    AND or_table.purchased_number_details->>'id' != ''
    AND pn.id != (or_table.purchased_number_details->>'id')::uuid
)
-- Insert new records with external IDs
INSERT INTO phone_numbers (id, phone_number, project_id, is_active, created_at, updated_at)
SELECT external_id, phone_number, project_id, is_active, created_at, updated_at
FROM phone_number_updates
ON CONFLICT (id) DO UPDATE SET
  phone_number = EXCLUDED.phone_number,
  project_id = EXCLUDED.project_id,
  is_active = EXCLUDED.is_active,
  updated_at = EXCLUDED.updated_at;

-- Delete old phone_number records that have been replaced
DELETE FROM phone_numbers pn
WHERE EXISTS (
  SELECT 1 FROM onboarding_responses or_table 
  WHERE or_table.contact_number = pn.phone_number
    AND or_table.purchased_number_details->>'id' IS NOT NULL
    AND or_table.purchased_number_details->>'id' != ''
    AND pn.id != (or_table.purchased_number_details->>'id')::uuid
);