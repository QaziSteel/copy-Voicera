-- Create voice-samples storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('voice-samples', 'voice-samples', true);

-- Update Voices table with required columns
ALTER TABLE public.voices 
ADD COLUMN voice_id TEXT UNIQUE,
ADD COLUMN display_name TEXT NOT NULL DEFAULT '',
ADD COLUMN gender TEXT,
ADD COLUMN style TEXT,
ADD COLUMN storage_path TEXT;

-- Create RLS policies for voices table
ALTER TABLE public.voices ENABLE ROW LEVEL SECURITY;

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