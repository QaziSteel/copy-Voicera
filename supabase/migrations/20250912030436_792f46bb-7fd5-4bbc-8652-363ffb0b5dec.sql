-- Step 1: Insert new phone_numbers records with external IDs (keeping old ones for now)
INSERT INTO phone_numbers (id, phone_number, project_id, is_active, created_at, updated_at)
SELECT 
  (or_table.purchased_number_details->>'id')::uuid as external_id,
  pn.phone_number,
  pn.project_id,
  pn.is_active,
  pn.created_at,
  pn.updated_at
FROM phone_numbers pn
JOIN onboarding_responses or_table ON or_table.contact_number = pn.phone_number
WHERE or_table.purchased_number_details->>'id' IS NOT NULL
  AND or_table.purchased_number_details->>'id' != ''
  AND pn.id != (or_table.purchased_number_details->>'id')::uuid
ON CONFLICT (id) DO UPDATE SET
  phone_number = EXCLUDED.phone_number,
  project_id = EXCLUDED.project_id,
  is_active = EXCLUDED.is_active,
  updated_at = EXCLUDED.updated_at;