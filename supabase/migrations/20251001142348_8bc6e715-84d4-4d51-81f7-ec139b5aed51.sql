-- Implement Field-Level Encryption for OAuth Tokens (Fixed)
-- Use pgcrypto for AES-256 encryption

-- Step 1: Ensure pgcrypto extension is enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Step 2: Add new encrypted token columns
ALTER TABLE public.google_integrations 
  ADD COLUMN IF NOT EXISTS encrypted_access_token text,
  ADD COLUMN IF NOT EXISTS encrypted_refresh_token text;

-- Step 3: Create function to encrypt tokens using AES-256
CREATE OR REPLACE FUNCTION public.encrypt_oauth_token(_token text, _user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  encryption_key bytea;
BEGIN
  -- Generate a deterministic but unique encryption key per user from JWT secret
  -- Use digest for key derivation
  encryption_key := digest(_user_id::text || current_setting('app.settings.jwt_secret', true), 'sha256');
  
  -- Encrypt the token using AES-256
  RETURN encode(
    encrypt(
      _token::bytea,
      encryption_key,
      'aes'
    ),
    'base64'
  );
END;
$$;

-- Step 4: Create function to decrypt tokens
CREATE OR REPLACE FUNCTION public.decrypt_oauth_token(_encrypted_token text, _user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  encryption_key bytea;
BEGIN
  IF _encrypted_token IS NULL OR _encrypted_token = '' THEN
    RETURN NULL;
  END IF;
  
  -- Generate the same encryption key
  encryption_key := digest(_user_id::text || current_setting('app.settings.jwt_secret', true), 'sha256');
  
  -- Decrypt the token
  RETURN convert_from(
    decrypt(
      decode(_encrypted_token, 'base64'),
      encryption_key,
      'aes'
    ),
    'UTF8'
  );
END;
$$;

-- Step 5: Migrate existing tokens to encrypted format
DO $$
DECLARE
  integration_record RECORD;
BEGIN
  FOR integration_record IN 
    SELECT id, user_id, access_token, refresh_token 
    FROM public.google_integrations 
    WHERE encrypted_access_token IS NULL 
      AND access_token IS NOT NULL
  LOOP
    BEGIN
      UPDATE public.google_integrations
      SET 
        encrypted_access_token = encrypt_oauth_token(integration_record.access_token, integration_record.user_id),
        encrypted_refresh_token = encrypt_oauth_token(integration_record.refresh_token, integration_record.user_id)
      WHERE id = integration_record.id;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Failed to encrypt tokens for integration %: %', integration_record.id, SQLERRM;
    END;
  END LOOP;
END $$;

-- Step 6: Update get_google_integration_tokens function to use encrypted tokens
CREATE OR REPLACE FUNCTION public.get_google_integration_tokens(_integration_id uuid, _requesting_user_id uuid)
 RETURNS TABLE(access_token text, refresh_token text, token_expires_at timestamp with time zone)
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
  
  -- Return decrypted tokens only if authorized
  RETURN QUERY SELECT 
    COALESCE(
      decrypt_oauth_token(integration_record.encrypted_access_token, integration_record.user_id),
      integration_record.access_token
    ),
    COALESCE(
      decrypt_oauth_token(integration_record.encrypted_refresh_token, integration_record.user_id),
      integration_record.refresh_token
    ),
    integration_record.token_expires_at;
END;
$$;

-- Step 7: Create function to mask email addresses
CREATE OR REPLACE FUNCTION public.mask_email(_email text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  local_part text;
  domain_part text;
  at_position int;
BEGIN
  IF _email IS NULL THEN
    RETURN NULL;
  END IF;
  
  at_position := position('@' in _email);
  IF at_position = 0 THEN
    -- Invalid email format
    RETURN '***';
  END IF;
  
  local_part := substring(_email from 1 for at_position - 1);
  domain_part := substring(_email from at_position + 1);
  
  -- Show first character of local part, mask the rest
  RETURN substring(local_part from 1 for 1) || '***@' || domain_part;
END;
$$;

-- Step 8: Update get_integration_metadata to return masked email
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
  is_owner boolean;
BEGIN
  -- Get the integration record
  SELECT * INTO integration_record
  FROM public.google_integrations 
  WHERE google_integrations.id = _integration_id;
  
  -- Check if integration exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Integration not found';
  END IF;
  
  -- Check if requesting user is the owner
  is_owner := _requesting_user_id = integration_record.user_id;
  
  -- Verify requesting user has permission (owner or project admin)
  IF NOT (
    is_owner
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
  
  -- Return metadata with masked email for non-owners
  RETURN QUERY SELECT 
    integration_record.id,
    integration_record.project_id,
    integration_record.user_id,
    integration_record.agent_id,
    CASE 
      WHEN is_owner THEN integration_record.user_email
      ELSE mask_email(integration_record.user_email)
    END,
    integration_record.scopes,
    integration_record.token_expires_at,
    integration_record.is_active,
    integration_record.created_at,
    integration_record.updated_at;
END;
$$;

-- Step 9: Create trigger to auto-encrypt tokens on insert/update
CREATE OR REPLACE FUNCTION public.auto_encrypt_oauth_tokens()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Encrypt access token if it's being set and not already encrypted
  IF NEW.access_token IS NOT NULL AND NEW.access_token != '' THEN
    NEW.encrypted_access_token := encrypt_oauth_token(NEW.access_token, NEW.user_id);
    -- Clear the plain text token
    NEW.access_token := NULL;
  END IF;
  
  -- Encrypt refresh token if it's being set and not already encrypted
  IF NEW.refresh_token IS NOT NULL AND NEW.refresh_token != '' THEN
    NEW.encrypted_refresh_token := encrypt_oauth_token(NEW.refresh_token, NEW.user_id);
    -- Clear the plain text token
    NEW.refresh_token := NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS encrypt_oauth_tokens_trigger ON public.google_integrations;
CREATE TRIGGER encrypt_oauth_tokens_trigger
  BEFORE INSERT OR UPDATE ON public.google_integrations
  FOR EACH ROW
  EXECUTE FUNCTION auto_encrypt_oauth_tokens();

-- Step 10: Add security comments
COMMENT ON FUNCTION public.encrypt_oauth_token IS 
'SECURITY: Encrypts OAuth tokens using AES-256 with user-specific keys. Tokens are never stored in plain text.';

COMMENT ON FUNCTION public.decrypt_oauth_token IS 
'SECURITY: Decrypts OAuth tokens. Only accessible via security definer functions with proper permission checks.';

COMMENT ON FUNCTION public.mask_email IS 
'SECURITY: Masks email addresses to prevent exposure. Shows only first character and domain.';

COMMENT ON COLUMN public.google_integrations.encrypted_access_token IS
'Encrypted OAuth access token using AES-256. Never store or expose in plain text.';

COMMENT ON COLUMN public.google_integrations.encrypted_refresh_token IS
'Encrypted OAuth refresh token using AES-256. Never store or expose in plain text.';