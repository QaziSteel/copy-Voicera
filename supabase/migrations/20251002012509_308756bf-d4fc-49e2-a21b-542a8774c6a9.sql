-- Create a secure function to check if an email exists in auth.users
CREATE OR REPLACE FUNCTION public.check_email_exists(_email text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'auth', 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users
    WHERE email = _email
  );
$function$;