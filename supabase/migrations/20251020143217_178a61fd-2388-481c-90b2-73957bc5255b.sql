-- Add policy to allow users to view profiles of project members
CREATE POLICY "Users can view profiles of project members"
ON public.profiles FOR SELECT
USING (
  id IN (
    SELECT pm.user_id
    FROM public.project_members pm
    WHERE pm.project_id IN (
      SELECT project_id 
      FROM public.project_members 
      WHERE user_id = auth.uid()
    )
  )
);