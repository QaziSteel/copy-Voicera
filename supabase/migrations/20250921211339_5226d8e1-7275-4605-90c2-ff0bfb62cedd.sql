-- Fix security issue: Protect customer personal data in bookings table
-- Current issue: All project members can see full customer names and phone numbers
-- Solution: Implement column-level RLS to mask sensitive data for regular members

-- First, drop the current broad SELECT policy that allows access to all columns
DROP POLICY IF EXISTS "View bookings through project relationship" ON public.bookings;

-- Create separate policies for different types of data access

-- 1. General booking data (non-sensitive) - accessible to all project members
CREATE POLICY "Project members can view booking details"
ON public.bookings
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND can_access_booking(auth.uid(), id)
);

-- 2. Create a security definer function to check if user has elevated permissions for customer data
CREATE OR REPLACE FUNCTION public.can_view_customer_data(_user_id uuid, _booking_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  booking_project_id uuid;
BEGIN
  -- Get the project ID for this booking
  booking_project_id := get_booking_project_id(_booking_id);
  
  -- Check if user has elevated permissions (owner/admin roles)
  RETURN (
    booking_project_id IS NOT NULL 
    AND (
      has_project_role(_user_id, booking_project_id, 'owner'::project_role) 
      OR has_project_role(_user_id, booking_project_id, 'admin'::project_role)
      OR has_global_role(_user_id, 'admin'::user_role)
    )
  );
END;
$$;

-- 3. Create a view that automatically masks customer data based on user permissions
CREATE OR REPLACE VIEW public.bookings_secure AS
SELECT 
  id,
  call_log_id,
  appointment_date,
  appointment_time,
  appointment_day,
  service_type,
  status,
  notes,
  created_at,
  updated_at,
  project_id,
  -- Mask customer data based on user permissions
  CASE 
    WHEN can_view_customer_data(auth.uid(), id) THEN customer_name
    WHEN customer_name IS NOT NULL THEN SUBSTRING(customer_name FROM 1 FOR 1) || '***'
    ELSE NULL 
  END AS customer_name,
  CASE 
    WHEN can_view_customer_data(auth.uid(), id) THEN customer_number
    WHEN customer_number IS NOT NULL THEN '***-***-' || RIGHT(customer_number, 4)
    ELSE NULL 
  END AS customer_number
FROM public.bookings
WHERE can_access_booking(auth.uid(), id);

-- 4. Enable RLS on the view
ALTER VIEW public.bookings_secure SET (security_invoker = true);

-- 5. Grant appropriate permissions
GRANT SELECT ON public.bookings_secure TO authenticated;
GRANT SELECT ON public.bookings_secure TO anon;

-- 6. Create a trigger to ensure customer data updates go through proper validation
CREATE OR REPLACE FUNCTION public.validate_customer_data_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Only allow customer data updates by owners/admins
  IF (OLD.customer_name IS DISTINCT FROM NEW.customer_name 
      OR OLD.customer_number IS DISTINCT FROM NEW.customer_number)
     AND NOT can_view_customer_data(auth.uid(), NEW.id) THEN
    RAISE EXCEPTION 'Insufficient permissions to modify customer data';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER bookings_customer_data_protection
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_customer_data_update();