-- Drop and recreate encrypt_oauth_token to accept encryption_key parameter
CREATE OR REPLACE FUNCTION public.encrypt_oauth_token(_token text, _user_id uuid, _encryption_key text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  key_bytes bytea;
BEGIN
  -- Generate a deterministic but unique encryption key per user
  key_bytes := digest(_user_id::text || _encryption_key, 'sha256');
  
  -- Encrypt the token using AES-256
  RETURN encode(
    encrypt(
      _token::bytea,
      key_bytes,
      'aes'
    ),
    'base64'
  );
END;
$function$;

-- Drop and recreate decrypt_oauth_token to accept encryption_key parameter
CREATE OR REPLACE FUNCTION public.decrypt_oauth_token(_encrypted_token text, _user_id uuid, _encryption_key text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  key_bytes bytea;
BEGIN
  IF _encrypted_token IS NULL OR _encrypted_token = '' THEN
    RETURN NULL;
  END IF;
  
  -- Generate the same encryption key
  key_bytes := digest(_user_id::text || _encryption_key, 'sha256');
  
  -- Decrypt the token
  RETURN convert_from(
    decrypt(
      decode(_encrypted_token, 'base64'),
      key_bytes,
      'aes'
    ),
    'UTF8'
  );
END;
$function$;

-- Update store_google_tokens to accept and use encryption_key
CREATE OR REPLACE FUNCTION public.store_google_tokens(_integration_id uuid, _access_token text, _refresh_token text, _expires_at timestamp with time zone, _requesting_user_id uuid, _encryption_key text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    RAISE EXCEPTION 'Insufficient permissions to store integration tokens';
  END IF;
  
  -- Encrypt and store tokens
  UPDATE public.google_integrations
  SET 
    encrypted_access_token = encrypt_oauth_token(_access_token, integration_record.user_id, _encryption_key),
    encrypted_refresh_token = encrypt_oauth_token(_refresh_token, integration_record.user_id, _encryption_key),
    token_expires_at = _expires_at,
    updated_at = now()
  WHERE id = _integration_id;
END;
$function$;

-- Update get_google_integration_tokens to accept and use encryption_key
CREATE OR REPLACE FUNCTION public.get_google_integration_tokens(_integration_id uuid, _requesting_user_id uuid, _encryption_key text)
 RETURNS TABLE(access_token text, refresh_token text, token_expires_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
      decrypt_oauth_token(integration_record.encrypted_access_token, integration_record.user_id, _encryption_key),
      integration_record.access_token
    ),
    COALESCE(
      decrypt_oauth_token(integration_record.encrypted_refresh_token, integration_record.user_id, _encryption_key),
      integration_record.refresh_token
    ),
    integration_record.token_expires_at;
END;
$function$;

-- Update update_encrypted_access_token to accept and use encryption_key
CREATE OR REPLACE FUNCTION public.update_encrypted_access_token(_integration_id uuid, _access_token text, _expires_at timestamp with time zone, _requesting_user_id uuid, _encryption_key text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    RAISE EXCEPTION 'Insufficient permissions to update integration tokens';
  END IF;
  
  -- Encrypt and update access token
  UPDATE public.google_integrations
  SET 
    encrypted_access_token = encrypt_oauth_token(_access_token, integration_record.user_id, _encryption_key),
    token_expires_at = _expires_at,
    updated_at = now()
  WHERE id = _integration_id;
END;
$function$;