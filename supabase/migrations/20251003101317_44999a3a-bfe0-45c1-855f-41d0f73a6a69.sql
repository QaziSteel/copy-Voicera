-- Fix bookings table security: Add input validation and improve RLS policies

-- 1. Create input validation function for bookings
CREATE OR REPLACE FUNCTION public.validate_booking_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Validate customer_number format (basic phone number validation)
  IF NEW.customer_number IS NOT NULL AND 
     (LENGTH(NEW.customer_number) < 10 OR LENGTH(NEW.customer_number) > 20) THEN
    RAISE EXCEPTION 'Invalid customer phone number format';
  END IF;
  
  -- Validate customer_name length
  IF NEW.customer_name IS NOT NULL AND LENGTH(NEW.customer_name) > 200 THEN
    RAISE EXCEPTION 'Customer name too long (max 200 characters)';
  END IF;
  
  -- Validate service_type length
  IF NEW.service_type IS NOT NULL AND LENGTH(NEW.service_type) > 200 THEN
    RAISE EXCEPTION 'Service type too long (max 200 characters)';
  END IF;
  
  -- Validate notes length
  IF NEW.notes IS NOT NULL AND LENGTH(NEW.notes) > 2000 THEN
    RAISE EXCEPTION 'Notes too long (max 2000 characters)';
  END IF;
  
  -- Validate appointment_date is not too far in the past
  IF NEW.appointment_date < CURRENT_DATE - INTERVAL '7 days' THEN
    RAISE EXCEPTION 'Appointment date cannot be more than 7 days in the past';
  END IF;
  
  -- Validate status is one of allowed values
  IF NEW.status NOT IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no-show') THEN
    RAISE EXCEPTION 'Invalid booking status';
  END IF;
  
  RETURN NEW;
END;
$$;

-- 2. Create trigger for booking validation
DROP TRIGGER IF EXISTS validate_booking_data ON public.bookings;
CREATE TRIGGER validate_booking_data
  BEFORE INSERT OR UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_booking_insert();

-- 3. Drop and recreate the member SELECT policy with proper logic
DROP POLICY IF EXISTS "Project members can view basic booking data" ON public.bookings;

-- Members can view booking scheduling data but NOT customer PII
CREATE POLICY "Project members can view basic booking metadata"
ON public.bookings
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND (
    -- Via project_id
    (project_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = bookings.project_id
        AND project_members.user_id = auth.uid()
        AND project_members.role = 'member'::project_role
    ))
    OR
    -- Via call_log relationship
    (call_log_id IS NOT NULL AND EXISTS (
      SELECT 1
      FROM call_logs cl
      JOIN phone_numbers pn ON (cl.phone_number_id = pn.id OR cl.phone_number = pn.phone_number)
      JOIN project_members pm ON pn.project_id = pm.project_id
      WHERE cl.id = bookings.call_log_id
        AND pm.user_id = auth.uid()
        AND pm.role = 'member'::project_role
    ))
  )
);

-- Note: Members can SELECT rows, but customer_name and customer_number should be 
-- masked at the application level using the get_booking_customer_info function

-- 4. Add a more restrictive INSERT policy with explicit validation
DROP POLICY IF EXISTS "Insert bookings for external and internal systems" ON public.bookings;

CREATE POLICY "Authenticated users can insert bookings for their projects"
ON public.bookings
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND (project_id IS NULL OR can_access_project(auth.uid(), project_id))
);

CREATE POLICY "External systems can insert bookings"
ON public.bookings
FOR INSERT
TO anon
WITH CHECK (
  -- Allow anonymous inserts but only with minimal required fields
  -- The trigger will validate the data format
  auth.uid() IS NULL 
  AND appointment_date IS NOT NULL
  AND appointment_time IS NOT NULL
  AND customer_number IS NOT NULL
);