-- Fix critical security vulnerability in call_logs table
-- Replace the overly permissive RLS policies with proper user-based access control

-- First, drop the existing insecure policies
DROP POLICY IF EXISTS "Organizations can view their own call logs" ON public.call_logs;
DROP POLICY IF EXISTS "Organizations can insert their own call logs" ON public.call_logs;
DROP POLICY IF EXISTS "Organizations can update their own call logs" ON public.call_logs;
DROP POLICY IF EXISTS "Organizations can delete their own call logs" ON public.call_logs;

-- Create a security definer function to check if a user owns a phone number
CREATE OR REPLACE FUNCTION public.user_owns_phone_number(_user_id uuid, _phone_number text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.onboarding_responses
    WHERE user_id = _user_id AND contact_number = _phone_number
  );
$$;

-- Create secure RLS policies that only allow users to access their own call logs
CREATE POLICY "Users can view their own call logs"
ON public.call_logs
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND 
  public.user_owns_phone_number(auth.uid(), phone_number)
);

CREATE POLICY "Users can insert call logs for their own phone numbers"
ON public.call_logs
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  public.user_owns_phone_number(auth.uid(), phone_number)
);

CREATE POLICY "Users can update their own call logs"
ON public.call_logs
FOR UPDATE
USING (
  auth.uid() IS NOT NULL AND 
  public.user_owns_phone_number(auth.uid(), phone_number)
);

CREATE POLICY "Users can delete their own call logs"
ON public.call_logs
FOR DELETE
USING (
  auth.uid() IS NOT NULL AND 
  public.user_owns_phone_number(auth.uid(), phone_number)
);