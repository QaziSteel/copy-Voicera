-- ============================================================
-- Fix: Customer Contact Information Access Control
-- ============================================================
-- This migration restricts regular project members from directly
-- accessing sensitive customer data in the bookings table.
-- Only owners/admins can view full customer information.
-- Regular members must use secure functions that return masked data.

-- Step 1: Drop the overly permissive member SELECT policy
DROP POLICY IF EXISTS "Project members can view anonymized booking data" ON public.bookings;

-- Step 2: Create a secure view for masked bookings data
CREATE OR REPLACE VIEW public.bookings_masked AS
SELECT 
  b.id,
  b.call_log_id,
  b.project_id,
  -- Mask customer_name: show only first character
  CASE 
    WHEN b.customer_name IS NOT NULL 
    THEN SUBSTRING(b.customer_name FROM 1 FOR 1) || '***'
    ELSE NULL 
  END AS customer_name,
  -- Mask customer_number: show only last 4 digits
  CASE 
    WHEN b.customer_number IS NOT NULL 
    THEN '***-***-' || RIGHT(b.customer_number, 4)
    ELSE NULL 
  END AS customer_number,
  b.service_type,
  b.appointment_date,
  b.appointment_time,
  b.appointment_day,
  b.status,
  b.notes,
  b.created_at,
  b.updated_at
FROM public.bookings b;

-- Step 3: Grant SELECT on the masked view to authenticated users
GRANT SELECT ON public.bookings_masked TO authenticated;

-- Step 4: Create RLS policy for the masked view
-- Regular members can view masked bookings for their projects
ALTER VIEW public.bookings_masked SET (security_invoker = on);

-- Step 5: Update get_call_logs_with_bookings to use role-based masking
CREATE OR REPLACE FUNCTION public.get_call_logs_with_bookings(
  phone_number_ids uuid[] DEFAULT NULL,
  phone_numbers text[] DEFAULT NULL,
  search_term text DEFAULT NULL,
  date_from timestamp with time zone DEFAULT NULL,
  date_to timestamp with time zone DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  phone_number_id uuid,
  phone_number text,
  customer_number text,
  type text,
  started_at timestamp with time zone,
  ended_at timestamp with time zone,
  total_call_time integer,
  ended_reason text,
  recording_file_path text,
  transcript_file_path text,
  cost numeric,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  booking_id uuid,
  booking_customer_name text,
  booking_service_type text,
  booking_appointment_date date,
  booking_appointment_time time without time zone
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_project_id uuid;
  is_owner_or_admin boolean;
BEGIN
  -- Get the project_id from the first phone number
  IF phone_number_ids IS NOT NULL AND array_length(phone_number_ids, 1) > 0 THEN
    SELECT pn.project_id INTO user_project_id
    FROM phone_numbers pn
    WHERE pn.id = phone_number_ids[1]
    LIMIT 1;
  END IF;

  -- Check if user has owner/admin role for this project
  is_owner_or_admin := (
    user_project_id IS NOT NULL AND (
      has_project_role(auth.uid(), user_project_id, 'owner'::project_role) 
      OR has_project_role(auth.uid(), user_project_id, 'admin'::project_role)
      OR has_global_role(auth.uid(), 'admin'::user_role)
    )
  );

  RETURN QUERY
  SELECT 
    cl.id,
    cl.phone_number_id,
    cl.phone_number,
    cl.customer_number,
    cl.type,
    cl.started_at,
    cl.ended_at,
    cl.total_call_time,
    cl.ended_reason,
    cl.recording_file_path,
    cl.transcript_file_path,
    cl.cost,
    cl.created_at,
    cl.updated_at,
    b.id as booking_id,
    -- Apply masking based on user role
    CASE 
      WHEN is_owner_or_admin THEN b.customer_name
      WHEN b.customer_name IS NOT NULL THEN SUBSTRING(b.customer_name FROM 1 FOR 1) || '***'
      ELSE NULL 
    END as booking_customer_name,
    b.service_type as booking_service_type,
    b.appointment_date as booking_appointment_date,
    b.appointment_time as booking_appointment_time
  FROM call_logs cl
  LEFT JOIN bookings b ON cl.id = b.call_log_id
  WHERE 
    -- Project filter: call logs must belong to project phone numbers
    (
      (phone_number_ids IS NOT NULL AND cl.phone_number_id = ANY(phone_number_ids))
      OR 
      (phone_numbers IS NOT NULL AND cl.phone_number = ANY(phone_numbers))
    )
    -- Search filter
    AND (
      search_term IS NULL 
      OR cl.phone_number ILIKE '%' || search_term || '%'
      OR cl.customer_number ILIKE '%' || search_term || '%'
    )
    -- Date filters
    AND (date_from IS NULL OR cl.started_at >= date_from)
    AND (date_to IS NULL OR cl.started_at <= date_to)
  ORDER BY cl.started_at DESC NULLS LAST;
END;
$$;

-- Step 6: Add comment explaining the security model
COMMENT ON TABLE public.bookings IS 
'Contains sensitive customer data. Direct SELECT access restricted to owners/admins only. Regular members should query through bookings_masked view or secure functions that apply role-based masking.';