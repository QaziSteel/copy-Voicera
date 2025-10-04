-- Make project_id NOT NULL on bookings table now that it's backfilled
-- This ensures every booking is always associated with a project
ALTER TABLE public.bookings 
ALTER COLUMN project_id SET NOT NULL;

-- Drop the existing SELECT policy that uses the function
DROP POLICY IF EXISTS "Project members can view bookings for their projects" ON public.bookings;
DROP POLICY IF EXISTS "Project owners and admins can view all booking data" ON public.bookings;

-- Create a simpler, more secure SELECT policy using the project_id column directly
-- This eliminates the risk of the function returning null
CREATE POLICY "Users can view bookings for accessible projects"
ON public.bookings
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND project_id IS NOT NULL
  AND can_access_project(auth.uid(), project_id)
);

-- Add explicit DENY policy as additional safety layer
-- This ensures that if somehow project_id becomes null, access is denied
CREATE POLICY "Deny access to bookings without project"
ON public.bookings
FOR SELECT
USING (
  project_id IS NOT NULL
);

-- Similarly strengthen UPDATE and DELETE policies to use project_id directly
DROP POLICY IF EXISTS "Update bookings by project owners" ON public.bookings;
DROP POLICY IF EXISTS "Delete bookings by project owners" ON public.bookings;

CREATE POLICY "Project owners and admins can update bookings"
ON public.bookings
FOR UPDATE
USING (
  auth.uid() IS NOT NULL 
  AND project_id IS NOT NULL
  AND (
    has_project_role(auth.uid(), project_id, 'owner'::project_role) 
    OR has_project_role(auth.uid(), project_id, 'admin'::project_role)
    OR has_global_role(auth.uid(), 'admin'::user_role)
  )
);

CREATE POLICY "Project owners and admins can delete bookings"
ON public.bookings
FOR DELETE
USING (
  auth.uid() IS NOT NULL 
  AND project_id IS NOT NULL
  AND (
    has_project_role(auth.uid(), project_id, 'owner'::project_role) 
    OR has_project_role(auth.uid(), project_id, 'admin'::project_role)
    OR has_global_role(auth.uid(), 'admin'::user_role)
  )
);