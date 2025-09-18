-- Drop the problematic unique constraint that's causing storage_failed error
-- This constraint prevents multiple agents from the same project having Google integrations
ALTER TABLE google_integrations DROP CONSTRAINT IF EXISTS unique_project_google_integration;

-- Ensure we have the correct unique constraint on agent_id
-- This was added in the previous migration but let's make sure it exists
ALTER TABLE google_integrations DROP CONSTRAINT IF EXISTS google_integrations_agent_id_unique;
ALTER TABLE google_integrations ADD CONSTRAINT google_integrations_agent_id_unique UNIQUE (agent_id);