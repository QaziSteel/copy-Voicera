-- Remove tokens_encrypted column and reactivate integrations
ALTER TABLE public.google_integrations DROP COLUMN IF EXISTS tokens_encrypted;

-- Reactivate any integrations that were deactivated due to encryption
UPDATE public.google_integrations 
SET is_active = true 
WHERE is_active = false;