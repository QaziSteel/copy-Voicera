-- Fix search_path for encryption functions to include extensions schema
-- Drop and recreate encrypt_oauth_token with correct search_path
DROP FUNCTION IF EXISTS public.encrypt_oauth_token(_token text, _user_id uuid, _encryption_key text);

CREATE OR REPLACE FUNCTION public.encrypt_oauth_token(_token text, _user_id uuid, _encryption_key text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO public, extensions
AS $function$
DECLARE
  key_bytes bytea;
BEGIN
  -- Generate a deterministic but unique encryption key per user
  key_bytes := extensions.digest(convert_to(_user_id::text || _encryption_key, 'UTF8'), 'sha256'::text);
  
  -- Encrypt the token using AES-256
  RETURN encode(
    extensions.encrypt(
      _token::bytea,
      key_bytes,
      'aes'
    ),
    'base64'
  );
END;
$function$;

-- Drop and recreate decrypt_oauth_token with correct search_path
DROP FUNCTION IF EXISTS public.decrypt_oauth_token(_encrypted_token text, _user_id uuid, _encryption_key text);

CREATE OR REPLACE FUNCTION public.decrypt_oauth_token(_encrypted_token text, _user_id uuid, _encryption_key text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO public, extensions
AS $function$
DECLARE
  key_bytes bytea;
BEGIN
  IF _encrypted_token IS NULL OR _encrypted_token = '' THEN
    RETURN NULL;
  END IF;
  
  -- Generate the same encryption key
  key_bytes := extensions.digest(convert_to(_user_id::text || _encryption_key, 'UTF8'), 'sha256'::text);
  
  -- Decrypt the token
  RETURN convert_from(
    extensions.decrypt(
      decode(_encrypted_token, 'base64'),
      key_bytes,
      'aes'
    ),
    'UTF8'
  );
END;
$function$;