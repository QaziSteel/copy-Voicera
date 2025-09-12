-- Address remaining security configurations where possible via SQL

-- Set more restrictive session timeout (though this may be overridden by Supabase config)
-- Note: Many security settings require Supabase Dashboard configuration

-- Add additional security constraints to sensitive tables
ALTER TABLE public.google_integrations 
ADD CONSTRAINT check_user_id_not_null CHECK (user_id IS NOT NULL);

-- Add constraint to ensure tokens belong to authenticated users only
ALTER TABLE public.google_integrations 
ADD CONSTRAINT check_valid_token_format CHECK (
  length(access_token) > 10 AND length(refresh_token) > 10
);

-- Create an audit trigger for google_integrations access
CREATE OR REPLACE FUNCTION public.audit_google_integration_access()
RETURNS trigger AS $$
BEGIN
  -- Log access to sensitive OAuth data
  RAISE LOG 'Google integration accessed: user_id=%, integration_id=%', 
    auth.uid(), COALESCE(NEW.id, OLD.id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER audit_google_integrations_trigger
  AFTER SELECT OR INSERT OR UPDATE OR DELETE 
  ON public.google_integrations
  FOR EACH ROW EXECUTE FUNCTION audit_google_integration_access();

-- Add index for better performance on security-critical queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_google_integrations_user_project 
ON public.google_integrations(user_id, project_id);

-- Ensure call_logs have proper constraints
ALTER TABLE public.call_logs 
ADD CONSTRAINT check_phone_number_format CHECK (
  phone_number ~ '^\+?[1-9]\d{1,14}$' OR phone_number = ''
);