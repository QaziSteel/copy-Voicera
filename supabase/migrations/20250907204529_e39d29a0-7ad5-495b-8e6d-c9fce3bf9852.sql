-- Enable real-time updates for call_logs table
ALTER TABLE public.call_logs REPLICA IDENTITY FULL;

-- Add call_logs table to the realtime publication
-- This enables real-time subscriptions for the table
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_logs;