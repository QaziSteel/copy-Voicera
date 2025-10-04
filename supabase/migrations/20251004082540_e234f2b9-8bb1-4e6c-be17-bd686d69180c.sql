-- Remove the problematic policy that's making bookings publicly readable
-- The issue: "Deny access to bookings without project" is PERMISSIVE with condition "project_id IS NOT NULL"
-- This means it ALLOWS access to all rows with project_id (which is now all rows since we made it NOT NULL)
-- PERMISSIVE policies are OR-combined, so this effectively makes the table public
DROP POLICY IF EXISTS "Deny access to bookings without project" ON public.bookings;

-- The remaining policy "Users can view bookings for accessible projects" properly restricts access
-- It requires: auth.uid() IS NOT NULL AND project_id IS NOT NULL AND can_access_project()
-- This is sufficient protection on its own