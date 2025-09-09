-- Update call_logs to set correct phone_number_id by matching phone_number
UPDATE call_logs 
SET phone_number_id = pn.id
FROM phone_numbers pn
WHERE call_logs.phone_number = pn.phone_number
AND call_logs.phone_number_id IS NULL;

-- Add foreign key constraint between call_logs and phone_numbers
ALTER TABLE call_logs 
ADD CONSTRAINT fk_call_logs_phone_number_id 
FOREIGN KEY (phone_number_id) 
REFERENCES phone_numbers(id) 
ON DELETE SET NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_call_logs_phone_number ON call_logs(phone_number);
CREATE INDEX IF NOT EXISTS idx_call_logs_phone_number_id ON call_logs(phone_number_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_started_at ON call_logs(started_at);

-- Add index on phone_numbers.phone_number for faster joins
CREATE INDEX IF NOT EXISTS idx_phone_numbers_phone_number ON phone_numbers(phone_number);