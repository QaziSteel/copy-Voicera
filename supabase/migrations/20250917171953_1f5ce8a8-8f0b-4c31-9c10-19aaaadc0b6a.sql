-- Remove the NOT NULL constraint on project_id to allow external bookings
ALTER TABLE public.bookings ALTER COLUMN project_id DROP NOT NULL;

-- Drop existing restrictive RLS policies
DROP POLICY IF EXISTS "Project members can view bookings" ON public.bookings;
DROP POLICY IF EXISTS "Project members can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Project owners can update bookings" ON public.bookings;
DROP POLICY IF EXISTS "Project owners can delete bookings" ON public.bookings;

-- Create function to get project_id from booking through relationship chain
CREATE OR REPLACE FUNCTION public.get_booking_project_id(booking_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    -- First try direct project_id if available
    b.project_id,
    -- Then derive from call_log relationship
    pn.project_id
  )
  FROM bookings b
  LEFT JOIN call_logs cl ON b.call_log_id = cl.id
  LEFT JOIN phone_numbers pn ON (
    cl.phone_number_id = pn.id OR 
    cl.phone_number = pn.phone_number OR
    b.customer_number = pn.phone_number
  )
  WHERE b.id = booking_id
  LIMIT 1;
$$;

-- Create function to check if user can access booking
CREATE OR REPLACE FUNCTION public.can_access_booking(user_id UUID, booking_id UUID)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT can_access_project(user_id, get_booking_project_id(booking_id));
$$;

-- New RLS policies using relationship-based security

-- Allow viewing bookings if user has access to the derived project
CREATE POLICY "Users can view bookings for accessible projects" 
ON public.bookings 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND can_access_booking(auth.uid(), id)
);

-- Allow inserting bookings without project_id requirement
CREATE POLICY "Allow booking insertion for external systems" 
ON public.bookings 
FOR INSERT 
WITH CHECK (
  -- Either authenticated user with project access, or allow external inserts
  auth.uid() IS NULL OR 
  (auth.uid() IS NOT NULL AND (
    project_id IS NULL OR 
    can_access_project(auth.uid(), project_id)
  ))
);

-- Allow updates only for project owners/admins
CREATE POLICY "Project owners can update bookings" 
ON public.bookings 
FOR UPDATE 
USING (
  auth.uid() IS NOT NULL 
  AND get_booking_project_id(id) IS NOT NULL
  AND (
    has_project_role(auth.uid(), get_booking_project_id(id), 'owner'::project_role) 
    OR has_project_role(auth.uid(), get_booking_project_id(id), 'admin'::project_role)
    OR has_global_role(auth.uid(), 'admin'::user_role)
  )
);

-- Allow deletes only for project owners/admins
CREATE POLICY "Project owners can delete bookings" 
ON public.bookings 
FOR DELETE 
USING (
  auth.uid() IS NOT NULL 
  AND get_booking_project_id(id) IS NOT NULL
  AND (
    has_project_role(auth.uid(), get_booking_project_id(id), 'owner'::project_role) 
    OR has_project_role(auth.uid(), get_booking_project_id(id), 'admin'::project_role)
    OR has_global_role(auth.uid(), 'admin'::user_role)
  )
);

-- Create trigger to automatically populate project_id after insert
CREATE OR REPLACE FUNCTION public.populate_booking_project_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only populate if project_id is not already set
  IF NEW.project_id IS NULL THEN
    NEW.project_id := get_booking_project_id(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger that runs after insert to populate project_id
CREATE OR REPLACE TRIGGER populate_booking_project_id_trigger
  BEFORE INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.populate_booking_project_id();

-- Update existing booking customer info function to work with relationship-based project_id
CREATE OR REPLACE FUNCTION public.get_booking_customer_info(
  booking_row public.bookings,
  requesting_user_id UUID DEFAULT auth.uid()
)
RETURNS TABLE(
  customer_name TEXT,
  customer_number TEXT
) AS $$
DECLARE
  derived_project_id UUID;
BEGIN
  -- Get the project_id through relationship chain
  derived_project_id := get_booking_project_id(booking_row.id);
  
  -- Check if user has elevated permissions (owner/admin)
  IF derived_project_id IS NOT NULL AND (
    has_project_role(requesting_user_id, derived_project_id, 'owner'::project_role) 
    OR has_project_role(requesting_user_id, derived_project_id, 'admin'::project_role)
    OR has_global_role(requesting_user_id, 'admin'::user_role)
  ) THEN
    -- Return full customer information
    RETURN QUERY SELECT 
      booking_row.customer_name,
      booking_row.customer_number;
  ELSE
    -- Return masked information for regular members
    RETURN QUERY SELECT 
      CASE 
        WHEN booking_row.customer_name IS NOT NULL 
        THEN SUBSTRING(booking_row.customer_name FROM 1 FOR 1) || '***' 
        ELSE NULL 
      END::TEXT,
      CASE 
        WHEN booking_row.customer_number IS NOT NULL 
        THEN '***-***-' || RIGHT(booking_row.customer_number, 4)
        ELSE NULL 
      END::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;