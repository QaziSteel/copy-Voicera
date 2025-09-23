-- Create function to get call logs with booking information
CREATE OR REPLACE FUNCTION public.get_call_logs_with_bookings(
  phone_number_ids uuid[] DEFAULT NULL,
  phone_numbers text[] DEFAULT NULL,
  search_term text DEFAULT NULL,
  date_from timestamptz DEFAULT NULL,
  date_to timestamptz DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  phone_number_id uuid,
  phone_number text,
  customer_number text,
  type text,
  started_at timestamptz,
  ended_at timestamptz,
  total_call_time integer,
  ended_reason text,
  recording_file_path text,
  transcript_file_path text,
  cost numeric,
  created_at timestamptz,
  updated_at timestamptz,
  booking_id uuid,
  booking_customer_name text,
  booking_service_type text,
  booking_appointment_date date,
  booking_appointment_time time
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
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
    b.customer_name as booking_customer_name,
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
$function$;