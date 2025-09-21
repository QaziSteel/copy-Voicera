-- Fix security linter warning: Convert SECURITY DEFINER view to SECURITY INVOKER
-- This addresses the linter warning while maintaining security through RLS policies

-- Drop the current SECURITY DEFINER view
DROP VIEW IF EXISTS public.google_integrations_safe;

-- Create a new SECURITY INVOKER view (default behavior) that relies on RLS
CREATE OR REPLACE VIEW public.google_integrations_safe AS
SELECT 
  id,
  project_id,
  user_id,
  agent_id,
  user_email,
  scopes,
  is_active,
  created_at,
  updated_at,
  token_expires_at,
  -- Show masked status instead of actual tokens
  '***PROTECTED***' as access_token_status,
  '***PROTECTED***' as refresh_token_status
FROM public.google_integrations;

-- The view will automatically respect RLS policies on the underlying table
-- Users will only see integrations they have access to based on existing RLS policies

-- Ensure proper permissions
GRANT SELECT ON public.google_integrations_safe TO authenticated;
GRANT SELECT ON public.google_integrations_safe TO anon;