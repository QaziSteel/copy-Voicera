-- Fix security vulnerabilities in bookings and call_logs tables
-- Issue: RLS policies allow potential cross-project data access through phone number matching

-- Drop existing vulnerable policies for bookings table
DROP POLICY IF EXISTS "Users can view bookings for their project phone numbers" ON public.bookings;
DROP POLICY IF EXISTS "Users can insert bookings for their project phone numbers" ON public.bookings;
DROP POLICY IF EXISTS "Users can update bookings for their project phone numbers" ON public.bookings;
DROP POLICY IF EXISTS "Users can delete bookings for their project phone numbers" ON public.bookings;

-- Create secure RLS policies for bookings table
-- Only allow access to bookings that belong to projects the user has access to
CREATE POLICY "Users can view bookings for accessible projects" 
ON public.bookings 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND (
    -- If call_log_id exists, check project access through phone_numbers table
    (call_log_id IS NOT NULL AND EXISTS (
      SELECT 1 
      FROM call_logs cl 
      JOIN phone_numbers pn ON cl.phone_number_id = pn.id
      WHERE cl.id = bookings.call_log_id 
      AND can_access_project(auth.uid(), pn.project_id)
    ))
    OR
    -- If no call_log_id, check if customer_number belongs to user's project phone numbers
    (call_log_id IS NULL AND EXISTS (
      SELECT 1 
      FROM phone_numbers pn
      WHERE pn.phone_number = bookings.customer_number 
      AND can_access_project(auth.uid(), pn.project_id)
    ))
  )
);

CREATE POLICY "Users can insert bookings for accessible projects" 
ON public.bookings 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND (
    -- If call_log_id exists, check project access through phone_numbers table
    (call_log_id IS NOT NULL AND EXISTS (
      SELECT 1 
      FROM call_logs cl 
      JOIN phone_numbers pn ON cl.phone_number_id = pn.id
      WHERE cl.id = bookings.call_log_id 
      AND can_access_project(auth.uid(), pn.project_id)
    ))
    OR
    -- If no call_log_id, check if customer_number belongs to user's project phone numbers
    (call_log_id IS NULL AND EXISTS (
      SELECT 1 
      FROM phone_numbers pn
      WHERE pn.phone_number = bookings.customer_number 
      AND can_access_project(auth.uid(), pn.project_id)
    ))
  )
);

CREATE POLICY "Users can update bookings for accessible projects" 
ON public.bookings 
FOR UPDATE 
USING (
  auth.uid() IS NOT NULL 
  AND (
    -- If call_log_id exists, check project access through phone_numbers table
    (call_log_id IS NOT NULL AND EXISTS (
      SELECT 1 
      FROM call_logs cl 
      JOIN phone_numbers pn ON cl.phone_number_id = pn.id
      WHERE cl.id = bookings.call_log_id 
      AND can_access_project(auth.uid(), pn.project_id)
    ))
    OR
    -- If no call_log_id, check if customer_number belongs to user's project phone numbers
    (call_log_id IS NULL AND EXISTS (
      SELECT 1 
      FROM phone_numbers pn
      WHERE pn.phone_number = bookings.customer_number 
      AND can_access_project(auth.uid(), pn.project_id)
    ))
  )
);

CREATE POLICY "Users can delete bookings for accessible projects" 
ON public.bookings 
FOR DELETE 
USING (
  auth.uid() IS NOT NULL 
  AND (
    -- If call_log_id exists, check project access through phone_numbers table
    (call_log_id IS NOT NULL AND EXISTS (
      SELECT 1 
      FROM call_logs cl 
      JOIN phone_numbers pn ON cl.phone_number_id = pn.id
      WHERE cl.id = bookings.call_log_id 
      AND can_access_project(auth.uid(), pn.project_id)
    ))
    OR
    -- If no call_log_id, check if customer_number belongs to user's project phone numbers
    (call_log_id IS NULL AND EXISTS (
      SELECT 1 
      FROM phone_numbers pn
      WHERE pn.phone_number = bookings.customer_number 
      AND can_access_project(auth.uid(), pn.project_id)
    ))
  )
);

-- Drop existing vulnerable policies for call_logs table
DROP POLICY IF EXISTS "Users can view call logs for their project phone numbers" ON public.call_logs;
DROP POLICY IF EXISTS "Users can insert call logs for their project phone numbers" ON public.call_logs;
DROP POLICY IF EXISTS "Users can update call logs for their project phone numbers" ON public.call_logs;
DROP POLICY IF EXISTS "Users can delete call logs for their project phone numbers" ON public.call_logs;

-- Create secure RLS policies for call_logs table
CREATE POLICY "Users can view call logs for accessible projects" 
ON public.call_logs 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND (
    -- If phone_number_id exists, check project access
    (phone_number_id IS NOT NULL AND EXISTS (
      SELECT 1 
      FROM phone_numbers pn 
      WHERE pn.id = call_logs.phone_number_id 
      AND can_access_project(auth.uid(), pn.project_id)
    ))
    OR
    -- If no phone_number_id, check if phone_number belongs to user's project
    (phone_number_id IS NULL AND EXISTS (
      SELECT 1 
      FROM phone_numbers pn
      WHERE pn.phone_number = call_logs.phone_number 
      AND can_access_project(auth.uid(), pn.project_id)
    ))
  )
);

CREATE POLICY "Users can insert call logs for accessible projects" 
ON public.call_logs 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND (
    -- If phone_number_id exists, check project access
    (phone_number_id IS NOT NULL AND EXISTS (
      SELECT 1 
      FROM phone_numbers pn 
      WHERE pn.id = call_logs.phone_number_id 
      AND can_access_project(auth.uid(), pn.project_id)
    ))
    OR
    -- If no phone_number_id, check if phone_number belongs to user's project
    (phone_number_id IS NULL AND EXISTS (
      SELECT 1 
      FROM phone_numbers pn
      WHERE pn.phone_number = call_logs.phone_number 
      AND can_access_project(auth.uid(), pn.project_id)
    ))
  )
);

CREATE POLICY "Users can update call logs for accessible projects" 
ON public.call_logs 
FOR UPDATE 
USING (
  auth.uid() IS NOT NULL 
  AND (
    -- If phone_number_id exists, check project access
    (phone_number_id IS NOT NULL AND EXISTS (
      SELECT 1 
      FROM phone_numbers pn 
      WHERE pn.id = call_logs.phone_number_id 
      AND can_access_project(auth.uid(), pn.project_id)
    ))
    OR
    -- If no phone_number_id, check if phone_number belongs to user's project
    (phone_number_id IS NULL AND EXISTS (
      SELECT 1 
      FROM phone_numbers pn
      WHERE pn.phone_number = call_logs.phone_number 
      AND can_access_project(auth.uid(), pn.project_id)
    ))
  )
);

CREATE POLICY "Users can delete call logs for accessible projects" 
ON public.call_logs 
FOR DELETE 
USING (
  auth.uid() IS NOT NULL 
  AND (
    -- If phone_number_id exists, check project access
    (phone_number_id IS NOT NULL AND EXISTS (
      SELECT 1 
      FROM phone_numbers pn 
      WHERE pn.id = call_logs.phone_number_id 
      AND can_access_project(auth.uid(), pn.project_id)
    ))
    OR
    -- If no phone_number_id, check if phone_number belongs to user's project
    (phone_number_id IS NULL AND EXISTS (
      SELECT 1 
      FROM phone_numbers pn
      WHERE pn.phone_number = call_logs.phone_number 
      AND can_access_project(auth.uid(), pn.project_id)
    ))
  )
);