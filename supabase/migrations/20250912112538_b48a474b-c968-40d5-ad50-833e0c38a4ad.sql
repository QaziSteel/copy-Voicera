-- Add security constraints and improvements

-- Add additional security constraints to sensitive tables
ALTER TABLE public.google_integrations 
ADD CONSTRAINT IF NOT EXISTS check_user_id_not_null CHECK (user_id IS NOT NULL);

-- Add constraint to ensure tokens have minimum length (basic validation)
ALTER TABLE public.google_integrations 
ADD CONSTRAINT IF NOT EXISTS check_valid_token_format CHECK (
  (access_token IS NOT NULL AND length(access_token) > 10) AND 
  (refresh_token IS NOT NULL AND length(refresh_token) > 10)
);

-- Add index for better performance on security-critical queries
CREATE INDEX IF NOT EXISTS idx_google_integrations_user_project 
ON public.google_integrations(user_id, project_id);

-- Ensure call_logs have proper phone number format
ALTER TABLE public.call_logs 
ADD CONSTRAINT IF NOT EXISTS check_phone_number_format CHECK (
  phone_number ~ '^\+?[0-9\-\(\) \.]+$' OR phone_number = ''
);

-- Add constraint to ensure call durations are reasonable
ALTER TABLE public.call_logs 
ADD CONSTRAINT IF NOT EXISTS check_reasonable_call_duration CHECK (
  total_call_time IS NULL OR (total_call_time >= 0 AND total_call_time <= 86400)
);