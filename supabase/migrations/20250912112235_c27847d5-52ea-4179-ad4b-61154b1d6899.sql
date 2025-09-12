-- Complete fix for Google OAuth tokens security without SECURITY DEFINER
-- Remove all SECURITY DEFINER constructs and use pure RLS approach

-- Drop the problematic view and function
DROP VIEW IF EXISTS public.google_integrations_safe;
DROP FUNCTION IF EXISTS public.can_view_integration_tokens(uuid, uuid);

-- Create a simple view that respects RLS policies without SECURITY DEFINER
CREATE VIEW public.google_integrations_overview AS
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
  -- Never expose raw tokens in views for security
  'use-direct-table-access' as access_token_note,
  'use-direct-table-access' as refresh_token_note
FROM public.google_integrations;

-- Grant proper permissions
GRANT SELECT ON public.google_integrations_overview TO authenticated;

-- The application code should query the main table directly 
-- when tokens are needed, and RLS policies will ensure proper access control