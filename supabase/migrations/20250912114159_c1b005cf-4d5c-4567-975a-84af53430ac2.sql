-- Drop the insecure view that exposes token information
DROP VIEW IF EXISTS public.google_integrations_overview CASCADE;

-- Revoke direct access to sensitive token columns from authenticated users
-- This prevents tokens from being accessible via the frontend
REVOKE SELECT (access_token, refresh_token) ON public.google_integrations FROM authenticated;

-- Ensure authenticated users can still read other necessary columns
GRANT SELECT (id, project_id, user_id, token_expires_at, scopes, user_email, is_active, created_at, updated_at) 
ON public.google_integrations TO authenticated;