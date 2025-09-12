-- Enable pgcrypto extension for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create a function to encrypt tokens
CREATE OR REPLACE FUNCTION public.encrypt_token(token_text text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT encode(encrypt(token_text::bytea, 'oauth_tokens_encryption_key', 'aes'), 'base64');
$$;

-- Create a function to decrypt tokens
CREATE OR REPLACE FUNCTION public.decrypt_token(encrypted_token text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT convert_from(decrypt(decode(encrypted_token, 'base64'), 'oauth_tokens_encryption_key', 'aes'), 'UTF8');
$$;

-- Add a column to track encryption status
ALTER TABLE public.google_integrations 
ADD COLUMN tokens_encrypted boolean DEFAULT false;

-- Create index for the new column
CREATE INDEX idx_google_integrations_encrypted 
ON public.google_integrations(tokens_encrypted);