-- Backfill existing users into profiles table
INSERT INTO public.profiles (id, email, full_name)
SELECT 
  u.id,
  u.email,
  COALESCE(
    u.raw_user_meta_data ->> 'full_name',
    CONCAT(
      COALESCE(u.raw_user_meta_data ->> 'first_name', ''),
      CASE 
        WHEN u.raw_user_meta_data ->> 'last_name' IS NOT NULL AND u.raw_user_meta_data ->> 'last_name' != '' 
        THEN ' ' || (u.raw_user_meta_data ->> 'last_name')
        ELSE ''
      END
    )
  ) as full_name
FROM auth.users u
WHERE u.id NOT IN (SELECT id FROM public.profiles);