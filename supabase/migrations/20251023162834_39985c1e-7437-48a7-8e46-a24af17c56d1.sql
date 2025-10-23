-- Drop unused columns from onboarding_responses table
-- These columns are associated with removed onboarding pages and are no longer used

ALTER TABLE public.onboarding_responses 
  DROP COLUMN IF EXISTS ai_handling_unknown,
  DROP COLUMN IF EXISTS ai_handling_phone_number,
  DROP COLUMN IF EXISTS wants_email_confirmations,
  DROP COLUMN IF EXISTS reminder_settings,
  DROP COLUMN IF EXISTS schedule_full_action;

-- Add comment explaining the cleanup
COMMENT ON TABLE public.onboarding_responses IS 
  'Stores onboarding configuration for AI agents. Cleaned up unused columns from removed onboarding pages on 2025-01-23.';