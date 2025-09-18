-- Add agent_id column to google_integrations table
ALTER TABLE public.google_integrations 
ADD COLUMN agent_id UUID;

-- Update RLS policies to work with agent-specific integrations
DROP POLICY "Users can view their own google integrations" ON public.google_integrations;
DROP POLICY "Users can create google integrations for accessible projects" ON public.google_integrations;
DROP POLICY "Users can update their own google integrations" ON public.google_integrations;
DROP POLICY "Users can delete their own google integrations or project owner" ON public.google_integrations;

-- Create new RLS policies for agent-specific integrations
CREATE POLICY "Users can view google integrations for accessible agents" 
ON public.google_integrations 
FOR SELECT 
USING (
  (auth.uid() = user_id) OR 
  (agent_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.onboarding_responses or_table
    WHERE or_table.id = agent_id 
    AND can_access_project(auth.uid(), or_table.project_id)
  ))
);

CREATE POLICY "Users can create google integrations for accessible agents" 
ON public.google_integrations 
FOR INSERT 
WITH CHECK (
  (auth.uid() = user_id) AND 
  (
    (project_id IS NOT NULL AND can_access_project(auth.uid(), project_id)) OR
    (agent_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.onboarding_responses or_table
      WHERE or_table.id = agent_id 
      AND can_access_project(auth.uid(), or_table.project_id)
    ))
  )
);

CREATE POLICY "Users can update google integrations for accessible agents" 
ON public.google_integrations 
FOR UPDATE 
USING (
  (auth.uid() = user_id) OR 
  (agent_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.onboarding_responses or_table
    WHERE or_table.id = agent_id 
    AND can_access_project(auth.uid(), or_table.project_id)
  ))
);

CREATE POLICY "Users can delete google integrations for accessible agents" 
ON public.google_integrations 
FOR DELETE 
USING (
  (auth.uid() = user_id) OR 
  (agent_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.onboarding_responses or_table
    WHERE or_table.id = agent_id 
    AND (
      has_project_role(auth.uid(), or_table.project_id, 'owner'::project_role) OR 
      has_project_role(auth.uid(), or_table.project_id, 'admin'::project_role) OR 
      has_global_role(auth.uid(), 'admin'::user_role)
    )
  ))
);