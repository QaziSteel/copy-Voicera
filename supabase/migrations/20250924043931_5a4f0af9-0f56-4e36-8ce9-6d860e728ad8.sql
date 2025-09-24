-- Add cleanup tracking column to google_integrations
ALTER TABLE google_integrations 
ADD COLUMN created_without_agent TIMESTAMP WITH TIME ZONE;

-- Update existing orphaned records to have the current timestamp
UPDATE google_integrations 
SET created_without_agent = NOW() 
WHERE agent_id IS NULL AND created_without_agent IS NULL;

-- Add cleanup function for orphaned records
CREATE OR REPLACE FUNCTION cleanup_orphaned_google_integrations()
RETURNS void AS $$
BEGIN
  DELETE FROM google_integrations 
  WHERE agent_id IS NULL 
    AND is_active = true 
    AND created_without_agent < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;