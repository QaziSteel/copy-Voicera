-- Fix Google OAuth tokens security vulnerability
-- Add user_id to track integration creator and implement strict RLS policies

-- Add user_id column to google_integrations table
ALTER TABLE public.google_integrations 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update existing records to set user_id based on project ownership
-- This assumes the integration was created by a project owner/admin
UPDATE public.google_integrations 
SET user_id = (
  SELECT pm.user_id 
  FROM public.project_members pm 
  WHERE pm.project_id = google_integrations.project_id 
    AND pm.role IN ('owner', 'admin') 
  LIMIT 1
);

-- Make user_id NOT NULL after populating existing records
ALTER TABLE public.google_integrations 
ALTER COLUMN user_id SET NOT NULL;

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Users can view google integrations for their projects" ON public.google_integrations;
DROP POLICY IF EXISTS "Users can create google integrations for their projects" ON public.google_integrations;  
DROP POLICY IF EXISTS "Users can update google integrations for their projects" ON public.google_integrations;
DROP POLICY IF EXISTS "Users can delete google integrations for their projects" ON public.google_integrations;

-- Create secure RLS policies
-- Only integration creator can view their own tokens
CREATE POLICY "Users can view their own google integrations" 
ON public.google_integrations 
FOR SELECT 
USING (auth.uid() = user_id);

-- Only integration creator can create integrations for projects they have access to
CREATE POLICY "Users can create google integrations for accessible projects" 
ON public.google_integrations 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  AND can_access_project(auth.uid(), project_id)
);

-- Only integration creator can update their own integrations
CREATE POLICY "Users can update their own google integrations" 
ON public.google_integrations 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Integration creator and project owners/admins can delete integrations
CREATE POLICY "Users can delete their own google integrations or project owners can delete" 
ON public.google_integrations 
FOR DELETE 
USING (
  auth.uid() = user_id 
  OR has_project_role(auth.uid(), project_id, 'owner'::project_role) 
  OR has_project_role(auth.uid(), project_id, 'admin'::project_role)
  OR has_global_role(auth.uid(), 'admin'::user_role)
);

-- Create a secure view for project management that excludes sensitive tokens
CREATE OR REPLACE VIEW public.google_integrations_safe AS
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
  -- Mask sensitive fields
  CASE WHEN auth.uid() = user_id THEN access_token ELSE '[HIDDEN]' END as access_token,
  CASE WHEN auth.uid() = user_id THEN refresh_token ELSE '[HIDDEN]' END as refresh_token
FROM public.google_integrations
WHERE can_access_project(auth.uid(), project_id);

-- Grant access to the safe view
GRANT SELECT ON public.google_integrations_safe TO authenticated;

-- Enable RLS on the view
ALTER VIEW public.google_integrations_safe SET (security_barrier = true);