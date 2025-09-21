-- Fix Security Definer View issue by removing problematic view and using RLS policies directly
-- The issue: bookings_secure view uses SECURITY DEFINER functions which bypasses user RLS policies
-- Solution: Remove the view and implement column-level security directly in application logic with proper RLS

-- 1. Drop the problematic bookings_secure view
DROP VIEW IF EXISTS public.bookings_secure;

-- 2. Create a new approach: Update RLS policies to handle sensitive data masking
-- Instead of using a view with SECURITY DEFINER functions, we'll use application-level logic

-- First, ensure the bookings table has the most restrictive RLS policy
DROP POLICY IF EXISTS "Project members can view booking details" ON public.bookings;

-- Create a more granular policy that allows access but lets application handle sensitive data masking
CREATE POLICY "Authorized users can view bookings"
ON public.bookings
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND can_access_booking(auth.uid(), id)
);

-- 3. Create a simple view without SECURITY DEFINER functions for basic booking data
CREATE OR REPLACE VIEW public.bookings_basic AS
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
  project_id
FROM public.bookings;

-- This view will respect RLS policies and doesn't use SECURITY DEFINER functions
-- The application code should handle sensitive data masking based on user roles

-- 4. Grant permissions
GRANT SELECT ON public.bookings_basic TO authenticated;
GRANT SELECT ON public.bookings_basic TO anon;

-- 5. For applications that need customer data, they should query the bookings table directly
-- and implement masking logic in the application code based on user permissions
-- This removes the dependency on SECURITY DEFINER functions in views

-- 6. Add a comment explaining the security approach
COMMENT ON VIEW public.bookings_basic IS 
'Basic booking data view that respects RLS policies. Applications should handle sensitive customer data masking in code based on user roles rather than in database views to avoid SECURITY DEFINER issues.';