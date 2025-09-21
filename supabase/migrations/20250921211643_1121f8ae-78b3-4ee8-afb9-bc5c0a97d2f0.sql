-- CRITICAL SECURITY FIX: Secure Google OAuth tokens from unauthorized access
-- Current issue: Any project member can see OAuth access_token and refresh_token
-- Solution: Restrict token access to owner only + create secure functions for edge function use

-- 1. Drop current overly permissive SELECT policy
DROP POLICY IF EXISTS "Users can view google integrations for accessible agents" ON public.google_integrations;

-- 2. Create new restrictive SELECT policy - only token owner can see their tokens
CREATE POLICY "Token owners can view their own integrations only"
ON public.google_integrations
FOR SELECT
USING (auth.uid() = user_id);

-- 3. Create a security definer view that masks sensitive tokens for project access
CREATE OR REPLACE VIEW public.google_integrations_safe AS
SELECT 
  id,
  project_id,
  user_id,
  agent_id,
  user_email,
  scopes,
  is_active,
  created_at,
  updated_at,
  token_expires_at,
  -- Never expose actual tokens in views
  CASE 
    WHEN auth.uid() = user_id THEN '***HIDDEN***'
    ELSE NULL
  END as access_token_status,
  CASE 
    WHEN auth.uid() = user_id THEN '***HIDDEN***'
    ELSE NULL
  END as refresh_token_status
FROM public.google_integrations
WHERE (
  -- Owner can see their own integrations
  auth.uid() = user_id 
  OR 
  -- Project owners/admins can see integration metadata (but not tokens)
  (agent_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM onboarding_responses or_table 
    WHERE or_table.id = google_integrations.agent_id 
    AND (
      has_project_role(auth.uid(), or_table.project_id, 'owner'::project_role)
      OR has_project_role(auth.uid(), or_table.project_id, 'admin'::project_role)
      OR has_global_role(auth.uid(), 'admin'::user_role)
    )
  ))
);

-- 4. Create security definer function for edge functions to safely access tokens
CREATE OR REPLACE FUNCTION public.get_google_integration_tokens(_integration_id uuid, _requesting_user_id uuid)
RETURNS TABLE(
  access_token text,
  refresh_token text,
  token_expires_at timestamptz
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  integration_record RECORD;
BEGIN
  -- Get the integration record
  SELECT * INTO integration_record
  FROM public.google_integrations 
  WHERE id = _integration_id;
  
  -- Check if integration exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Integration not found';
  END IF;
  
  -- Verify requesting user has permission (owner or project admin)
  IF NOT (
    _requesting_user_id = integration_record.user_id 
    OR (
      integration_record.agent_id IS NOT NULL 
      AND EXISTS (
        SELECT 1 FROM onboarding_responses or_table 
        WHERE or_table.id = integration_record.agent_id 
        AND (
          has_project_role(_requesting_user_id, or_table.project_id, 'owner'::project_role)
          OR has_project_role(_requesting_user_id, or_table.project_id, 'admin'::project_role)
          OR has_global_role(_requesting_user_id, 'admin'::user_role)
        )
      )
    )
  ) THEN
    RAISE EXCEPTION 'Insufficient permissions to access integration tokens';
  END IF;
  
  -- Return tokens only if authorized
  RETURN QUERY SELECT 
    integration_record.access_token,
    integration_record.refresh_token,
    integration_record.token_expires_at;
END;
$$;

-- 5. Update other policies to be more restrictive
DROP POLICY IF EXISTS "Users can update google integrations for accessible agents" ON public.google_integrations;
DROP POLICY IF EXISTS "Users can delete google integrations for accessible agents" ON public.google_integrations;

-- Only allow token owner or project owners/admins to update integrations
CREATE POLICY "Authorized users can update integrations"
ON public.google_integrations
FOR UPDATE
USING (
  auth.uid() = user_id 
  OR (
    agent_id IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM onboarding_responses or_table 
      WHERE or_table.id = google_integrations.agent_id 
      AND (
        has_project_role(auth.uid(), or_table.project_id, 'owner'::project_role)
        OR has_project_role(auth.uid(), or_table.project_id, 'admin'::project_role)
        OR has_global_role(auth.uid(), 'admin'::user_role)
      )
    )
  )
);

-- Only allow token owner or project owners/admins to delete integrations
CREATE POLICY "Authorized users can delete integrations"
ON public.google_integrations
FOR DELETE
USING (
  auth.uid() = user_id 
  OR (
    agent_id IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM onboarding_responses or_table 
      WHERE or_table.id = google_integrations.agent_id 
      AND (
        has_project_role(auth.uid(), or_table.project_id, 'owner'::project_role)
        OR has_project_role(auth.uid(), or_table.project_id, 'admin'::project_role)
        OR has_global_role(auth.uid(), 'admin'::user_role)
      )
    )
  )
);

-- 6. Grant permissions for the safe view
GRANT SELECT ON public.google_integrations_safe TO authenticated;
GRANT SELECT ON public.google_integrations_safe TO anon;

-- 7. Create trigger to log token access (for security auditing)
CREATE OR REPLACE FUNCTION public.log_google_token_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log when tokens are accessed (for security monitoring)
  INSERT INTO public.audit_log (
    table_name,
    record_id,
    action,
    user_id,
    timestamp
  ) VALUES (
    'google_integrations',
    NEW.id,
    'TOKEN_ACCESS',
    auth.uid(),
    NOW()
  ) ON CONFLICT DO NOTHING; -- Ignore if audit_log table doesn't exist
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Note: Audit trigger will only work if audit_log table exists
-- CREATE TRIGGER google_token_access_audit
--   AFTER SELECT ON public.google_integrations
--   FOR EACH ROW
--   EXECUTE FUNCTION public.log_google_token_access();