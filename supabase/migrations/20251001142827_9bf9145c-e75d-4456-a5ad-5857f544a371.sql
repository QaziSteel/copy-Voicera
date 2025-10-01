-- Fix: Additional Security Layer (Part 1 - Data Migration)
-- First ensure all data is properly encrypted before adding constraints

-- Step 1: Ensure all tokens are encrypted and plain text is cleared
DO $$
DECLARE
  integration_record RECORD;
BEGIN
  FOR integration_record IN 
    SELECT id, user_id, access_token, refresh_token, encrypted_access_token, encrypted_refresh_token
    FROM public.google_integrations
  LOOP
    -- If we have plain text tokens but no encrypted versions, encrypt them
    IF (integration_record.access_token IS NOT NULL OR integration_record.refresh_token IS NOT NULL)
       AND (integration_record.encrypted_access_token IS NULL OR integration_record.encrypted_refresh_token IS NULL) THEN
      
      BEGIN
        UPDATE public.google_integrations
        SET 
          encrypted_access_token = CASE 
            WHEN access_token IS NOT NULL THEN encrypt_oauth_token(access_token, user_id)
            ELSE encrypted_access_token
          END,
          encrypted_refresh_token = CASE 
            WHEN refresh_token IS NOT NULL THEN encrypt_oauth_token(refresh_token, user_id)
            ELSE encrypted_refresh_token
          END,
          access_token = NULL,
          refresh_token = NULL
        WHERE id = integration_record.id;
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Failed to encrypt tokens for integration %: %', integration_record.id, SQLERRM;
      END;
    
    -- If we have encrypted tokens but plain text is not cleared, clear it
    ELSIF (integration_record.encrypted_access_token IS NOT NULL AND integration_record.encrypted_refresh_token IS NOT NULL)
          AND (integration_record.access_token IS NOT NULL OR integration_record.refresh_token IS NOT NULL) THEN
      
      UPDATE public.google_integrations
      SET 
        access_token = NULL,
        refresh_token = NULL
      WHERE id = integration_record.id;
    END IF;
  END LOOP;
END $$;

-- Step 2: Add validation to ensure plain text tokens are ALWAYS NULL
CREATE OR REPLACE FUNCTION public.validate_no_plaintext_tokens()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- After encryption trigger runs, ensure plain text is NULL
  IF NEW.access_token IS NOT NULL OR NEW.refresh_token IS NOT NULL THEN
    RAISE EXCEPTION 'Plain text tokens are not allowed. Use encrypted columns only.';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger that runs AFTER the encryption trigger
DROP TRIGGER IF EXISTS validate_no_plaintext_tokens_trigger ON public.google_integrations;
CREATE TRIGGER validate_no_plaintext_tokens_trigger
  AFTER INSERT OR UPDATE ON public.google_integrations
  FOR EACH ROW
  EXECUTE FUNCTION validate_no_plaintext_tokens();

-- Step 3: Drop the existing overly permissive policies
DROP POLICY IF EXISTS "Users can view their own integrations" ON public.google_integrations;
DROP POLICY IF EXISTS "Users can view their own integration details" ON public.google_integrations;

-- Step 4: Create new secure function for users to check integration status
CREATE OR REPLACE FUNCTION public.get_user_integration_status(
  _user_id uuid DEFAULT auth.uid(),
  _project_id uuid DEFAULT NULL,
  _agent_id uuid DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  project_id uuid,
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
BEGIN
  -- Only allow users to check their own integrations
  IF _user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: Can only check your own integration status';
  END IF;

  RETURN QUERY
  SELECT 
    gi.id,
    gi.project_id,
    gi.agent_id,
    gi.user_email,
    gi.scopes,
    gi.token_expires_at,
    gi.is_active,
    gi.created_at,
    gi.updated_at
  FROM google_integrations gi
  WHERE gi.user_id = _user_id
    AND (_project_id IS NULL OR gi.project_id = _project_id)
    AND (_agent_id IS NULL OR gi.agent_id = _agent_id)
    AND gi.is_active = true
  ORDER BY gi.created_at DESC;
END;
$$;

-- Step 5: Create highly restrictive SELECT policy
-- Users can only view basic metadata, NO token columns at all
CREATE POLICY "Users can view integration metadata only"
ON public.google_integrations
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Step 6: Update UPDATE policy to prevent token column modifications
DROP POLICY IF EXISTS "Authorized users can update integrations" ON public.google_integrations;
DROP POLICY IF EXISTS "Authorized users can update integration metadata" ON public.google_integrations;

CREATE POLICY "Authorized users can update integration status"
ON public.google_integrations
FOR UPDATE
TO authenticated
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

-- Step 7: Add security comments
COMMENT ON POLICY "Users can view integration metadata only" ON public.google_integrations IS
'SECURITY: Users can view their integrations but token access MUST use get_google_integration_tokens() RPC. Never expose tokens via SELECT.';

COMMENT ON FUNCTION public.get_user_integration_status IS
'SECURITY: Safe way for users to check integration status. Returns metadata only, never tokens.';

COMMENT ON FUNCTION public.validate_no_plaintext_tokens IS
'SECURITY: Ensures plain text OAuth tokens are NEVER stored. All tokens must be encrypted.';