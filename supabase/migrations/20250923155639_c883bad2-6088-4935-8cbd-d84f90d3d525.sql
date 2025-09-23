-- Fix security issue: Restrict customer data access in bookings table
-- Only project owners and admins should see sensitive customer data

-- Drop the existing overly permissive SELECT policy
DROP POLICY IF EXISTS "Users can view accessible bookings" ON public.bookings;

-- Create separate policies for different access levels

-- 1. Project owners and admins can see all booking data including customer info
CREATE POLICY "Project owners and admins can view all booking data"
ON public.bookings
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND get_booking_project_id(id) IS NOT NULL 
  AND (
    has_project_role(auth.uid(), get_booking_project_id(id), 'owner'::project_role) 
    OR has_project_role(auth.uid(), get_booking_project_id(id), 'admin'::project_role)
    OR has_global_role(auth.uid(), 'admin'::user_role)
  )
);

-- 2. Regular project members can only see non-sensitive booking data 
-- (they cannot access customer_name or customer_number fields)
CREATE POLICY "Project members can view basic booking data"
ON public.bookings
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND (
    -- Direct project membership check
    (project_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM project_members 
      WHERE project_id = bookings.project_id 
      AND user_id = auth.uid()
      AND role = 'member'::project_role
    ))
    OR
    -- Call log based access for members
    (call_log_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM call_logs cl
      JOIN phone_numbers pn ON (cl.phone_number_id = pn.id OR cl.phone_number = pn.phone_number)
      JOIN project_members pm ON pn.project_id = pm.project_id
      WHERE cl.id = bookings.call_log_id 
      AND pm.user_id = auth.uid()
      AND pm.role = 'member'::project_role
    ))
  )
  -- Exclude records that would expose customer data to regular members
  AND NOT (customer_name IS NOT NULL OR customer_number IS NOT NULL)
);

-- Add comment explaining the security enhancement
COMMENT ON POLICY "Project owners and admins can view all booking data" ON public.bookings IS 
'Allows project owners and admins to access all booking data including sensitive customer information';

COMMENT ON POLICY "Project members can view basic booking data" ON public.bookings IS 
'Allows regular project members to view only non-sensitive booking data, excluding customer names and phone numbers';