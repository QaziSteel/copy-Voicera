-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Users can create project onboarding responses" ON public.onboarding_responses;

-- Create new restrictive INSERT policy
CREATE POLICY "Only owners and admins can create agents"
ON public.onboarding_responses
FOR INSERT
TO authenticated
WITH CHECK (
  (
    -- For personal agents (no project_id)
    (project_id IS NULL AND auth.uid() = user_id)
  ) OR (
    -- For project agents (with project_id)
    project_id IS NOT NULL AND (
      has_project_role(auth.uid(), project_id, 'owner'::project_role) OR
      has_project_role(auth.uid(), project_id, 'admin'::project_role) OR
      has_global_role(auth.uid(), 'admin'::user_role)
    )
  )
);