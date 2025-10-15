-- Add column for storing the phone number when user selects transfer option
ALTER TABLE public.onboarding_responses 
ADD COLUMN ai_handling_phone_number text;

-- Add comment for documentation
COMMENT ON COLUMN public.onboarding_responses.ai_handling_phone_number IS 
'Phone number to transfer calls to when AI cannot answer questions. Only relevant when ai_handling_unknown is set to transfer option.';