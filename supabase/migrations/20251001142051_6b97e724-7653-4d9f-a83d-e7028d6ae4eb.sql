-- Fix OAuth Token Security Issue
-- Remove flawed column-filtering policy and implement proper security

-- Drop the problematic policy that tries to filter columns using current_setting
DROP POLICY IF EXISTS "Project admins can view integration metadata (non-sensitive)" ON public.google_integrations;

-- Add proper policy: Only token owners can SELECT their integrations
-- This replaces the flawed policy and ensures tokens are only accessible to owners
CREATE POLICY "Users can view their own integration details"
ON public.google_integrations
FOR SELECT
USING (auth.uid() = user_id);

-- Add policy for project admins to view ONLY metadata (non-token fields)
-- By creating a security definer function that returns only safe fields
CREATE OR REPLACE FUNCTION public.get_integration_metadata(
  _integration_id uuid,
  _requesting_user_id uuid
)
RETURNS TABLE(
  id uuid,
  project_id uuid,
  user_id uuid,
  agent_id uuid,
  user_email text,
  scopes text[],
  token_expires_at timestamp with time zone,
  is_active boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  integration_record RECORD;
BEGIN
  -- Get the integration record
  SELECT * INTO integration_record
  FROM public.google_integrations 
  WHERE google_integrations.id = _integration_id;
  
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
    RAISE EXCEPTION 'Insufficient permissions to access integration metadata';
  END IF;
  
  -- Return metadata only (no tokens)
  RETURN QUERY SELECT 
    integration_record.id,
    integration_record.project_id,
    integration_record.user_id,
    integration_record.agent_id,
    integration_record.user_email,
    integration_record.scopes,
    integration_record.token_expires_at,
    integration_record.is_active,
    integration_record.created_at,
    integration_record.updated_at;
END;
$$;

-- Add comment explaining the security model
COMMENT ON POLICY "Users can view their own integration details" ON public.google_integrations IS 
'Users can only view their own Google integrations. OAuth tokens (access_token, refresh_token) should only be accessed via the secure get_google_integration_tokens() function, never through direct SELECT queries. Project admins can access metadata via get_integration_metadata() function.';

COMMENT ON FUNCTION public.get_google_integration_tokens IS
'SECURITY: This is the ONLY safe way to access OAuth tokens. Validates user permissions before returning tokens. Never expose tokens through direct SELECT queries.';

COMMENT ON FUNCTION public.get_integration_metadata IS
'SECURITY: Safe way for project admins to view integration metadata without exposing OAuth tokens.';