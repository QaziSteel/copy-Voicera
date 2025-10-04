-- Set integrations with refresh tokens to active
UPDATE google_integrations 
SET is_active = true, updated_at = now()
WHERE encrypted_refresh_token IS NOT NULL 
  AND is_active = false;