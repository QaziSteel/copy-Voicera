-- Update existing phone_numbers records to use external IDs as their primary key
-- We'll do this by creating a backup, deleting old records, and inserting with new IDs

-- Step 1: Create temporary backup of phone numbers that will be updated
CREATE TEMP TABLE phone_number_backup AS
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
  AND pn.id != (or_table.purchased_number_details->>'id')::uuid;

-- Step 2: Update call_logs to reference the new external IDs
UPDATE call_logs 
SET phone_number_id = pnb.external_id
FROM phone_number_backup pnb
WHERE call_logs.phone_number_id = pnb.old_id;

-- Step 3: Delete old phone_number records that will be replaced
DELETE FROM phone_numbers pn
WHERE EXISTS (
  SELECT 1 FROM phone_number_backup pnb 
  WHERE pnb.old_id = pn.id
);

-- Step 4: Insert phone numbers with external IDs
INSERT INTO phone_numbers (id, phone_number, project_id, is_active, created_at, updated_at)
SELECT external_id, phone_number, project_id, is_active, created_at, updated_at
FROM phone_number_backup;