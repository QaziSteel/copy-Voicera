-- Fix function search path security issues
CREATE OR REPLACE FUNCTION public.mask_email(_email text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  local_part text;
  domain_part text;
  at_position int;
BEGIN
  IF _email IS NULL THEN
    RETURN NULL;
  END IF;
  
  at_position := position('@' in _email);
  IF at_position = 0 THEN
    RETURN '***';
  END IF;
  
  local_part := substring(_email from 1 for at_position - 1);
  domain_part := substring(_email from at_position + 1);
  
  RETURN substring(local_part from 1 for 1) || '***@' || domain_part;
END;
$function$;

CREATE OR REPLACE FUNCTION public.user_can_see_customer_data(_user_id uuid, _project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM project_members
    WHERE project_id = _project_id 
    AND user_id = _user_id 
    AND role IN ('owner', 'admin')
  );
$function$;

-- Backfill project_id for existing bookings
UPDATE public.bookings
SET project_id = get_booking_project_id(id)
WHERE project_id IS NULL;

-- Backfill phone_number_id for call_logs
UPDATE public.call_logs cl
SET phone_number_id = pn.id
FROM phone_numbers pn
WHERE cl.phone_number_id IS NULL
  AND cl.phone_number = pn.phone_number;

-- Drop and recreate bookings INSERT policies with stricter requirements
DROP POLICY IF EXISTS "Authenticated systems can insert bookings via API" ON public.bookings;
DROP POLICY IF EXISTS "Authenticated users can insert bookings for their projects" ON public.bookings;

CREATE POLICY "Users can insert bookings for accessible projects"
ON public.bookings
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND project_id IS NOT NULL
  AND can_access_project(auth.uid(), project_id)
);

CREATE POLICY "Service role can insert bookings with project validation"
ON public.bookings
FOR INSERT
WITH CHECK (
  (auth.jwt() ->> 'role'::text) = 'service_role'::text
  AND project_id IS NOT NULL
);

-- Strengthen call_logs RLS policies to require phone_number_id
DROP POLICY IF EXISTS "Users can insert call logs for accessible projects" ON public.call_logs;
DROP POLICY IF EXISTS "Users can update call logs for accessible projects" ON public.call_logs;
DROP POLICY IF EXISTS "Users can delete call logs for accessible projects" ON public.call_logs;
DROP POLICY IF EXISTS "Users can view call logs for accessible projects" ON public.call_logs;

CREATE POLICY "Users can view call logs via phone_number_id"
ON public.call_logs
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND phone_number_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM phone_numbers pn
    WHERE pn.id = call_logs.phone_number_id
      AND can_access_project(auth.uid(), pn.project_id)
  )
);

CREATE POLICY "Users can insert call logs via phone_number_id"
ON public.call_logs
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND phone_number_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM phone_numbers pn
    WHERE pn.id = call_logs.phone_number_id
      AND can_access_project(auth.uid(), pn.project_id)
  )
);

CREATE POLICY "Users can update call logs via phone_number_id"
ON public.call_logs
FOR UPDATE
USING (
  auth.uid() IS NOT NULL 
  AND phone_number_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM phone_numbers pn
    WHERE pn.id = call_logs.phone_number_id
      AND can_access_project(auth.uid(), pn.project_id)
  )
);

CREATE POLICY "Users can delete call logs via phone_number_id"
ON public.call_logs
FOR DELETE
USING (
  auth.uid() IS NOT NULL 
  AND phone_number_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM phone_numbers pn
    WHERE pn.id = call_logs.phone_number_id
      AND can_access_project(auth.uid(), pn.project_id)
  )
);

-- Restrict project_invitations SELECT to owners/admins only
DROP POLICY IF EXISTS "Users can view invitations for their projects" ON public.project_invitations;

CREATE POLICY "Owners and admins can view invitations"
ON public.project_invitations
FOR SELECT
USING (
  has_project_role(auth.uid(), project_id, 'owner'::project_role) 
  OR has_project_role(auth.uid(), project_id, 'admin'::project_role)
  OR has_global_role(auth.uid(), 'admin'::user_role)
);