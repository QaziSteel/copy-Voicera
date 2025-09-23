-- Insert dummy booking record for Arthur Morgan
INSERT INTO public.bookings (
  call_log_id,
  project_id,
  customer_name,
  customer_number,
  appointment_date,
  appointment_time,
  appointment_day,
  service_type,
  status,
  notes
) VALUES (
  '3c5806a3-033d-4df4-995d-b3e16dcefcf8',
  '378787b9-9cb4-49cb-a795-371b18511357',
  'Arthur Morgan',
  '+923239526157',
  '2025-09-24',
  '10:00:00',
  'Tuesday',
  'Consultation',
  'scheduled',
  NULL
);