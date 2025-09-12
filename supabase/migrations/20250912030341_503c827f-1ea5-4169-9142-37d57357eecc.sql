-- Step 1: Drop the foreign key constraint temporarily
ALTER TABLE call_logs DROP CONSTRAINT IF EXISTS fk_call_logs_phone_number_id;

-- Step 2: Create mapping and update both tables
WITH phone_number_mapping AS (
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
-- Update call_logs to use external IDs
UPDATE call_logs 
SET phone_number_id = pnm.external_id
FROM phone_number_mapping pnm
WHERE call_logs.phone_number_id = pnm.old_id;

-- Step 3: Delete old phone_number records and insert new ones with external IDs
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
-- Delete old records
DELETE FROM phone_numbers pn
WHERE EXISTS (
  SELECT 1 FROM phone_number_updates pnu WHERE pnu.old_id = pn.id
);

-- Insert new records with external IDs
WITH phone_number_updates AS (
  SELECT 
    pn.phone_number,
    pn.project_id,
    pn.is_active,
    pn.created_at,
    pn.updated_at,
    (or_table.purchased_number_details->>'id')::uuid as external_id
  FROM onboarding_responses or_table
  JOIN phone_numbers pn ON or_table.contact_number = pn.phone_number
  WHERE or_table.purchased_number_details->>'id' IS NOT NULL
    AND or_table.purchased_number_details->>'id' != ''
    AND NOT EXISTS (
      SELECT 1 FROM phone_numbers pn2 WHERE pn2.id = (or_table.purchased_number_details->>'id')::uuid
    )
)
INSERT INTO phone_numbers (id, phone_number, project_id, is_active, created_at, updated_at)
SELECT external_id, phone_number, project_id, is_active, created_at, updated_at
FROM phone_number_updates
WHERE external_id IS NOT NULL;

-- Step 4: Re-add the foreign key constraint
ALTER TABLE call_logs 
ADD CONSTRAINT fk_call_logs_phone_number_id 
FOREIGN KEY (phone_number_id) REFERENCES phone_numbers(id);