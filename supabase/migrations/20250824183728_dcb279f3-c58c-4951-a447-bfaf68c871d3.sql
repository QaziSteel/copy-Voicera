-- Remove first_name and last_name columns and add full_name column
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS first_name,
DROP COLUMN IF EXISTS last_name,
ADD COLUMN full_name TEXT;

-- Update the trigger function to use full_name instead of first_name/last_name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', '') || ' ' || COALESCE(NEW.raw_user_meta_data ->> 'last_name', '')
  );
  RETURN NEW;
END;
$$;