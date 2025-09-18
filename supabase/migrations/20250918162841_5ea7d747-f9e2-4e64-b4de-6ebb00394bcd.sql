-- Fix Google Calendar integration constraints to support per-agent connections

-- Drop the unique constraint on project_id if it exists
-- This allows multiple agents from the same project to have Google Calendar integrations
ALTER TABLE google_integrations DROP CONSTRAINT IF EXISTS google_integrations_project_id_key;

-- Add unique constraint on agent_id to ensure each agent can only have one active integration
-- This will allow the edge function's onConflict: 'agent_id' to work properly
ALTER TABLE google_integrations ADD CONSTRAINT google_integrations_agent_id_unique UNIQUE (agent_id);