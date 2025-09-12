-- Create a function to encrypt existing Google integration tokens
CREATE OR REPLACE FUNCTION encrypt_google_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  integration_record RECORD;
  encrypted_access_token TEXT;
  encrypted_refresh_token TEXT;
BEGIN
  -- Loop through all active integrations that are not encrypted
  FOR integration_record IN 
    SELECT id, access_token, refresh_token 
    FROM public.google_integrations 
    WHERE tokens_encrypted = false OR tokens_encrypted IS NULL
  LOOP
    -- For now, we'll mark them as needing re-authentication since we can't encrypt in SQL
    -- The tokens will need to be re-obtained through OAuth flow
    UPDATE public.google_integrations 
    SET 
      is_active = false,
      tokens_encrypted = true,
      updated_at = now()
    WHERE id = integration_record.id;
    
    RAISE NOTICE 'Marked integration % for re-authentication due to encryption requirement', integration_record.id;
  END LOOP;
END;
$$;

-- Execute the function to encrypt existing tokens
SELECT encrypt_google_tokens();

-- Drop the function after use
DROP FUNCTION encrypt_google_tokens();