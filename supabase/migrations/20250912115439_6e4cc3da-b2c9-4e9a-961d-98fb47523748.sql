-- Remove insecure SQL encryption helper functions (handled in Edge Functions instead)
DROP FUNCTION IF EXISTS public.encrypt_token(text);
DROP FUNCTION IF EXISTS public.decrypt_token(text);