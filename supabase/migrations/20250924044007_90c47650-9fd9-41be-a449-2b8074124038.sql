-- Fix security issue: set search_path on the cleanup function
CREATE OR REPLACE FUNCTION cleanup_orphaned_google_integrations()
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM google_integrations 
  WHERE agent_id IS NULL 
    AND is_active = true 
    AND created_without_agent < NOW() - INTERVAL '24 hours';
END;
$$;