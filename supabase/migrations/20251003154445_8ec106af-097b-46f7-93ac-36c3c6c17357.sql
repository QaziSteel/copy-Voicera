-- Update cleanup function to also remove old inactive orphans
CREATE OR REPLACE FUNCTION public.cleanup_orphaned_google_integrations()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Delete orphaned integrations (active ones older than 24 hours)
  DELETE FROM google_integrations 
  WHERE agent_id IS NULL 
    AND is_active = true 
    AND created_without_agent < NOW() - INTERVAL '24 hours';
  
  -- Also delete old inactive orphans (older than 7 days)
  DELETE FROM google_integrations 
  WHERE agent_id IS NULL 
    AND is_active = false
    AND created_without_agent < NOW() - INTERVAL '7 days';
END;
$function$;