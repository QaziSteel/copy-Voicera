-- Create a mapping of phone_numbers that have an external ID from onboarding
CREATE TEMP TABLE tmp_phone_number_mapping AS
SELECT 
  pn.id AS old_id,
  (or_table.purchased_number_details->>'id')::uuid AS external_id,
  pn.phone_number
FROM phone_numbers pn
JOIN onboarding_responses or_table 
  ON or_table.contact_number = pn.phone_number
WHERE or_table.purchased_number_details->>'id' IS NOT NULL
  AND or_table.purchased_number_details->>'id' <> ''
  AND pn.id <> (or_table.purchased_number_details->>'id')::uuid;

-- 1) Temporarily null out references to avoid FK issues
UPDATE call_logs cl
SET phone_number_id = NULL
WHERE cl.phone_number_id IN (SELECT old_id FROM tmp_phone_number_mapping);

-- 2) Update phone_numbers primary keys in place to use external IDs
UPDATE phone_numbers pn
SET id = m.external_id
FROM tmp_phone_number_mapping m
WHERE pn.id = m.old_id;

-- 3) Set call_logs.phone_number_id to the new external IDs using the phone_number text
UPDATE call_logs cl
SET phone_number_id = m.external_id
FROM tmp_phone_number_mapping m
WHERE cl.phone_number_id IS NULL
  AND cl.phone_number = m.phone_number;

-- Cleanup temp table
DROP TABLE IF EXISTS tmp_phone_number_mapping;