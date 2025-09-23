-- Fix the security definer view issue by dropping and recreating as regular view
DROP VIEW IF EXISTS public.google_integration_metadata;

-- Create a regular view (not security definer) for safe metadata
CREATE VIEW public.google_integration_metadata AS
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
FROM public.google_integrations
WHERE 
  -- Users can see their own integration metadata
  auth.uid() = user_id 
  OR 
  -- Project admins can see metadata (but not tokens) of integrations in their projects
  (
    agent_id IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM onboarding_responses or_table
      JOIN project_members pm ON or_table.project_id = pm.project_id
      WHERE or_table.id = google_integrations.agent_id 
      AND pm.user_id = auth.uid() 
      AND pm.role IN ('owner', 'admin')
    )
  );

-- Enable RLS on the view
ALTER VIEW public.google_integration_metadata SET (security_barrier = true);