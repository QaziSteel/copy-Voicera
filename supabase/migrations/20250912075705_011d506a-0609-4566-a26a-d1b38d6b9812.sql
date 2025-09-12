-- Add recording and transcript file path columns to call_logs table
ALTER TABLE call_logs 
ADD COLUMN recording_file_path text,
ADD COLUMN transcript_file_path text;

-- Create RLS policies for call-recordings storage bucket
CREATE POLICY "Users can view recordings for their project call logs"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'call-recordings'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM call_logs cl
    JOIN phone_numbers pn ON (
      (cl.phone_number_id IS NOT NULL AND pn.id = cl.phone_number_id) OR
      (cl.phone_number_id IS NULL AND pn.phone_number = cl.phone_number)
    )
    WHERE cl.recording_file_path = name
    AND can_access_project(auth.uid(), pn.project_id)
  )
);

-- Create RLS policies for call-transcripts storage bucket  
CREATE POLICY "Users can view transcripts for their project call logs"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'call-transcripts'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM call_logs cl
    JOIN phone_numbers pn ON (
      (cl.phone_number_id IS NOT NULL AND pn.id = cl.phone_number_id) OR
      (cl.phone_number_id IS NULL AND pn.phone_number = cl.phone_number)
    )
    WHERE cl.transcript_file_path = name
    AND can_access_project(auth.uid(), pn.project_id)
  )
);