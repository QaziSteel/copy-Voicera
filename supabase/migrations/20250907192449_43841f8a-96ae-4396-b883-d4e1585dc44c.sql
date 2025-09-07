-- Create call_logs table
CREATE TABLE public.call_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number_id UUID,
  phone_number TEXT NOT NULL,
  type TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  total_call_time INTEGER,
  recording_url TEXT,
  org_id UUID,
  cost DECIMAL(10,4),
  customer_number TEXT,
  ended_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for organization-based access
CREATE POLICY "Organizations can view their own call logs" 
ON public.call_logs 
FOR SELECT 
USING (true); -- For now allow all reads, will refine when org access is implemented

CREATE POLICY "Organizations can insert their own call logs" 
ON public.call_logs 
FOR INSERT 
WITH CHECK (true); -- For now allow all inserts, will refine when org access is implemented

CREATE POLICY "Organizations can update their own call logs" 
ON public.call_logs 
FOR UPDATE 
USING (true); -- For now allow all updates, will refine when org access is implemented

CREATE POLICY "Organizations can delete their own call logs" 
ON public.call_logs 
FOR DELETE 
USING (true); -- For now allow all deletes, will refine when org access is implemented

-- Create indexes for performance
CREATE INDEX idx_call_logs_phone_number_id ON public.call_logs(phone_number_id);
CREATE INDEX idx_call_logs_started_at ON public.call_logs(started_at);
CREATE INDEX idx_call_logs_org_id ON public.call_logs(org_id);
CREATE INDEX idx_call_logs_phone_number ON public.call_logs(phone_number);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_call_logs_updated_at
BEFORE UPDATE ON public.call_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();