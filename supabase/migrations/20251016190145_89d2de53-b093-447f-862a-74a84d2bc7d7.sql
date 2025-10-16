-- Update cleanup function to handle 1-hour expiry
CREATE OR REPLACE FUNCTION public.cleanup_expired_invitations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Update status for expired invitations immediately
  UPDATE project_invitations 
  SET status = 'expired' 
  WHERE status = 'pending' 
    AND expires_at < NOW();
  
  -- Delete expired invitations older than 24 hours (instead of 30 days)
  DELETE FROM project_invitations 
  WHERE status = 'expired' 
    AND expires_at < NOW() - INTERVAL '24 hours';
END;
$function$;