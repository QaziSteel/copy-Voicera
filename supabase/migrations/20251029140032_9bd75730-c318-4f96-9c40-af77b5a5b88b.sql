-- Drop the ai_call_schedule column from onboarding_responses table
ALTER TABLE onboarding_responses 
DROP COLUMN IF EXISTS ai_call_schedule;

-- Add comment documenting the removal
COMMENT ON TABLE onboarding_responses IS 
'Updated: Removed ai_call_schedule column as scheduling is now handled by manual agent status controls';