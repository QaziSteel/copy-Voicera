-- Create voices table
CREATE TABLE public.voices (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  voice_id TEXT UNIQUE,
  display_name TEXT NOT NULL,
  gender TEXT,
  style TEXT,
  storage_path TEXT
);

-- Create voice-samples storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('voice-samples', 'voice-samples', true);

-- Enable RLS on voices table
ALTER TABLE public.voices ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for voices table
CREATE POLICY "Anyone can view voices" 
ON public.voices 
FOR SELECT 
USING (true);

-- Create storage policies for voice-samples bucket
CREATE POLICY "Voice samples are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'voice-samples');

CREATE POLICY "Authenticated users can upload voice samples" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'voice-samples' AND auth.role() = 'authenticated');

-- Insert default voice data
INSERT INTO public.voices (voice_id, display_name, gender, style, storage_path) VALUES
('casual-male', 'Casual Male', 'male', 'casual', 'casual-male.wav'),
('professional-female', 'Professional Female', 'female', 'professional', 'professional-female.wav'),
('friendly-female', 'Friendly Female', 'female', 'friendly', 'friendly-female.wav'),
('energetic-male', 'Energetic Male', 'male', 'energetic', 'energetic-male.wav');