-- Add security constraints (handle existing constraints gracefully)

-- Add security constraints to google_integrations
DO $$
BEGIN
    -- Add user_id constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'google_integrations' 
        AND constraint_name = 'check_user_id_not_null'
    ) THEN
        ALTER TABLE public.google_integrations 
        ADD CONSTRAINT check_user_id_not_null CHECK (user_id IS NOT NULL);
    END IF;
    
    -- Add token format constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'google_integrations' 
        AND constraint_name = 'check_valid_token_format'
    ) THEN
        ALTER TABLE public.google_integrations 
        ADD CONSTRAINT check_valid_token_format CHECK (
            (access_token IS NOT NULL AND length(access_token) > 10) AND 
            (refresh_token IS NOT NULL AND length(refresh_token) > 10)
        );
    END IF;
END $$;

-- Add performance and security indexes
CREATE INDEX IF NOT EXISTS idx_google_integrations_user_project 
ON public.google_integrations(user_id, project_id);

CREATE INDEX IF NOT EXISTS idx_call_logs_user_phone 
ON public.call_logs(phone_number, started_at DESC);

-- Add basic data validation constraints
DO $$
BEGIN
    -- Phone number format constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'call_logs' 
        AND constraint_name = 'check_phone_number_format'
    ) THEN
        ALTER TABLE public.call_logs 
        ADD CONSTRAINT check_phone_number_format CHECK (
            phone_number IS NOT NULL AND length(phone_number) >= 3
        );
    END IF;
    
    -- Call duration constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'call_logs' 
        AND constraint_name = 'check_reasonable_call_duration'
    ) THEN
        ALTER TABLE public.call_logs 
        ADD CONSTRAINT check_reasonable_call_duration CHECK (
            total_call_time IS NULL OR (total_call_time >= 0 AND total_call_time <= 86400)
        );
    END IF;
END $$;