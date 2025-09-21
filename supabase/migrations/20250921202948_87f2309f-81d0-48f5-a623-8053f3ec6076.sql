-- Add token and expiration columns to project_invitations table
ALTER TABLE project_invitations 
ADD COLUMN token TEXT UNIQUE,
ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster token lookups
CREATE INDEX idx_project_invitations_token ON project_invitations(token);

-- Update existing records to have an expiration date (7 days from now)
UPDATE project_invitations 
SET expires_at = NOW() + INTERVAL '7 days' 
WHERE expires_at IS NULL;