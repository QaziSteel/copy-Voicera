-- Drop the unused bookings_masked view
DROP VIEW IF EXISTS public.bookings_masked;

-- Add RLS policy allowing project members to view bookings for their projects
CREATE POLICY "Project members can view bookings for their projects"
ON public.bookings
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND get_booking_project_id(id) IS NOT NULL 
  AND can_access_project(auth.uid(), get_booking_project_id(id))
);