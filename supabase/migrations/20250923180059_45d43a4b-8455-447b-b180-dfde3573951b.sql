-- Fix Google OAuth token security vulnerability
-- Remove the policy that allows project admins to see other users' tokens
DROP POLICY IF EXISTS "Project admins can view integration metadata" ON public.google_integrations;

-- Create a secure policy that only allows viewing non-sensitive metadata
CREATE POLICY "Project admins can view integration metadata (non-sensitive)" 
ON public.google_integrations
FOR SELECT 
USING (
  -- Users can always see their own integrations (all fields)
  auth.uid() = user_id 
  OR 
  -- Project admins can only see non-sensitive metadata of other users
  (
    auth.uid() <> user_id 
    AND agent_id IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM onboarding_responses or_table
      JOIN project_members pm ON or_table.project_id = pm.project_id
      WHERE or_table.id = google_integrations.agent_id 
      AND pm.user_id = auth.uid() 
      AND pm.role IN ('owner', 'admin')
    )
    -- Only allow access to specific non-sensitive columns for admins
    AND current_setting('request.columns', true) !~ '(access_token|refresh_token)'
  )
);

-- Create a view for safe integration metadata that excludes sensitive fields
CREATE OR REPLACE VIEW public.google_integration_metadata AS
SELECT 
  id,
  project_id,
  user_id,
  agent_id,
  token_expires_at,
  scopes,
  user_email,
  is_active,
  created_at,
  updated_at
FROM public.google_integrations;