-- Add new columns to test_call_logs table for Vapi integration
ALTER TABLE public.test_call_logs 
ADD COLUMN vapi_call_id text,
ADD COLUMN recording_url text,
ADD COLUMN transcript_url text;