-- Add direct project association to bookings table for better security
ALTER TABLE public.bookings ADD COLUMN project_id UUID;

-- Create index for performance
CREATE INDEX idx_bookings_project_id ON public.bookings(project_id);

-- Populate project_id for existing bookings based on phone number associations
UPDATE public.bookings 
SET project_id = (
  SELECT DISTINCT pn.project_id 
  FROM public.phone_numbers pn 
  WHERE pn.phone_number = bookings.customer_number
  LIMIT 1
)
WHERE project_id IS NULL AND customer_number IS NOT NULL;

-- For bookings associated with call logs, populate project_id
UPDATE public.bookings 
SET project_id = (
  SELECT DISTINCT pn.project_id 
  FROM public.call_logs cl
  JOIN public.phone_numbers pn ON cl.phone_number_id = pn.id
  WHERE cl.id = bookings.call_log_id
  LIMIT 1
)
WHERE project_id IS NULL AND call_log_id IS NOT NULL;

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Users can view bookings for accessible projects" ON public.bookings;
DROP POLICY IF EXISTS "Users can insert bookings for accessible projects" ON public.bookings;
DROP POLICY IF EXISTS "Users can update bookings for accessible projects" ON public.bookings;
DROP POLICY IF EXISTS "Users can delete bookings for accessible projects" ON public.bookings;

-- Create enhanced RLS policies with direct project association and role-based access

-- Policy for viewing bookings - only project members can see them
CREATE POLICY "Project members can view bookings" 
ON public.bookings 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND project_id IS NOT NULL 
  AND can_access_project(auth.uid(), project_id)
);

-- Policy for inserting bookings - only project members can create them
CREATE POLICY "Project members can create bookings" 
ON public.bookings 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND project_id IS NOT NULL 
  AND can_access_project(auth.uid(), project_id)
);

-- Policy for updating bookings - only project owners/admins can modify sensitive data
CREATE POLICY "Project owners can update bookings" 
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

-- Policy for deleting bookings - only project owners/admins can delete
CREATE POLICY "Project owners can delete bookings" 
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

-- Create a security function to get masked customer data for regular members
CREATE OR REPLACE FUNCTION public.get_booking_customer_info(
  booking_row public.bookings,
  requesting_user_id UUID DEFAULT auth.uid()
)
RETURNS TABLE(
  customer_name TEXT,
  customer_number TEXT
) AS $$
BEGIN
  -- Check if user has elevated permissions (owner/admin)
  IF has_project_role(requesting_user_id, booking_row.project_id, 'owner'::project_role) 
     OR has_project_role(requesting_user_id, booking_row.project_id, 'admin'::project_role)
     OR has_global_role(requesting_user_id, 'admin'::user_role) THEN
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

-- Add constraint to ensure project_id is always set for new bookings
ALTER TABLE public.bookings 
ALTER COLUMN project_id SET NOT NULL;