-- Create bookings table
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  call_log_id UUID REFERENCES public.call_logs(id) ON DELETE CASCADE,
  customer_number TEXT NOT NULL,
  service_type TEXT,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  appointment_day TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  customer_name TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_bookings_call_log_id ON public.bookings(call_log_id);
CREATE INDEX idx_bookings_appointment_date ON public.bookings(appointment_date);
CREATE INDEX idx_bookings_customer_number ON public.bookings(customer_number);
CREATE INDEX idx_bookings_appointment_date_time ON public.bookings(appointment_date, appointment_time);
CREATE INDEX idx_bookings_status ON public.bookings(status);

-- Enable Row Level Security
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for bookings (mirror call_logs security model)
CREATE POLICY "Users can view bookings for their project phone numbers"
ON public.bookings
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    (call_log_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM call_logs cl
      JOIN phone_numbers pn ON cl.phone_number_id = pn.id
      WHERE cl.id = bookings.call_log_id 
      AND can_access_project(auth.uid(), pn.project_id)
    ))
    OR 
    (call_log_id IS NULL AND EXISTS (
      SELECT 1 FROM call_logs cl
      WHERE cl.phone_number = bookings.customer_number
      AND user_owns_phone_number(auth.uid(), cl.phone_number)
    ))
  )
);

CREATE POLICY "Users can insert bookings for their project phone numbers"
ON public.bookings
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    (call_log_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM call_logs cl
      JOIN phone_numbers pn ON cl.phone_number_id = pn.id
      WHERE cl.id = bookings.call_log_id 
      AND can_access_project(auth.uid(), pn.project_id)
    ))
    OR 
    (call_log_id IS NULL AND EXISTS (
      SELECT 1 FROM call_logs cl
      WHERE cl.phone_number = bookings.customer_number
      AND user_owns_phone_number(auth.uid(), cl.phone_number)
    ))
  )
);

CREATE POLICY "Users can update bookings for their project phone numbers"
ON public.bookings
FOR UPDATE
USING (
  auth.uid() IS NOT NULL AND (
    (call_log_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM call_logs cl
      JOIN phone_numbers pn ON cl.phone_number_id = pn.id
      WHERE cl.id = bookings.call_log_id 
      AND can_access_project(auth.uid(), pn.project_id)
    ))
    OR 
    (call_log_id IS NULL AND EXISTS (
      SELECT 1 FROM call_logs cl
      WHERE cl.phone_number = bookings.customer_number
      AND user_owns_phone_number(auth.uid(), cl.phone_number)
    ))
  )
);

CREATE POLICY "Users can delete bookings for their project phone numbers"
ON public.bookings
FOR DELETE
USING (
  auth.uid() IS NOT NULL AND (
    (call_log_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM call_logs cl
      JOIN phone_numbers pn ON cl.phone_number_id = pn.id
      WHERE cl.id = bookings.call_log_id 
      AND can_access_project(auth.uid(), pn.project_id)
    ))
    OR 
    (call_log_id IS NULL AND EXISTS (
      SELECT 1 FROM call_logs cl
      WHERE cl.phone_number = bookings.customer_number
      AND user_owns_phone_number(auth.uid(), cl.phone_number)
    ))
  )
);

-- Create trigger for automatic updated_at timestamp updates
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();