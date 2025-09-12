-- Fix the SECURITY DEFINER view issue
-- Remove the problematic view and create a proper RLS-compliant approach

-- Drop the problematic SECURITY DEFINER view
DROP VIEW IF EXISTS public.google_integrations_safe;

-- Create a function to check if user can view integration details
CREATE OR REPLACE FUNCTION public.can_view_integration_tokens(_integration_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.google_integrations gi
    WHERE gi.id = _integration_id 
      AND gi.user_id = _user_id
  );
$$;

-- Create a regular view without SECURITY DEFINER
CREATE VIEW public.google_integrations_safe AS
SELECT 
  id,
  project_id,
  user_email,
  is_active,
  created_at,
  updated_at,
  token_expires_at,
  scopes,
  user_id,
  -- Only show actual tokens to the integration creator
  CASE 
    WHEN can_view_integration_tokens(id, auth.uid()) THEN access_token 
    ELSE '[HIDDEN]' 
  END as access_token,
  CASE 
    WHEN can_view_integration_tokens(id, auth.uid()) THEN refresh_token 
    ELSE '[HIDDEN]' 
  END as refresh_token
FROM public.google_integrations;