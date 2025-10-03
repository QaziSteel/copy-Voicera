-- Enable replica identity for real-time updates on onboarding_responses table
ALTER TABLE onboarding_responses REPLICA IDENTITY FULL;

-- Add the table to realtime publication so clients can subscribe to changes
ALTER PUBLICATION supabase_realtime ADD TABLE onboarding_responses;