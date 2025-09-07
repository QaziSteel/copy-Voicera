-- Create call-recordings bucket (private)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('call-recordings', 'call-recordings', false);

-- Create call-transcripts bucket (private)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('call-transcripts', 'call-transcripts', false);

-- RLS policies for call-recordings bucket
CREATE POLICY "Users can upload their own call recordings" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'call-recordings' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own call recordings" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'call-recordings' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own call recordings" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'call-recordings' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own call recordings" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'call-recordings' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS policies for call-transcripts bucket
CREATE POLICY "Users can upload their own call transcripts" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'call-transcripts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own call transcripts" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'call-transcripts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own call transcripts" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'call-transcripts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own call transcripts" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'call-transcripts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);