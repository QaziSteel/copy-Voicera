-- Delete orphaned Google integration records
DELETE FROM public.google_integrations 
WHERE id IN (
  '920e91f1-f653-419d-a489-32b9cf72f223',
  '7d902e3e-41cc-48c5-a5aa-baf8c0b9c4f8'
);