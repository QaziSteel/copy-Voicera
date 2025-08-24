-- Update the trigger function to handle both full_name and first_name/last_name
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
    COALESCE(
      NEW.raw_user_meta_data ->> 'full_name',
      CONCAT(
        COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
        CASE 
          WHEN NEW.raw_user_meta_data ->> 'last_name' IS NOT NULL AND NEW.raw_user_meta_data ->> 'last_name' != '' 
          THEN ' ' || (NEW.raw_user_meta_data ->> 'last_name')
          ELSE ''
        END
      )
    )
  );
  RETURN NEW;
END;
$$;