-- Update handle_new_user function to skip project creation for invited users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  new_project_id uuid;
  is_invited boolean;
BEGIN
  -- Create profile
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
  
  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  -- Check if user is signing up via invitation
  is_invited := (NEW.raw_user_meta_data ->> 'invitation_token') IS NOT NULL;
  
  -- Only create default project if NOT signing up via invitation
  IF NOT is_invited THEN
    -- Create a default project for the new user
    INSERT INTO public.projects (created_by, name, description)
    VALUES (NEW.id, 'My Business', 'Default project for my business')
    RETURNING id INTO new_project_id;
    
    -- Make the user the owner of their project
    INSERT INTO public.project_members (project_id, user_id, role)
    VALUES (new_project_id, NEW.id, 'owner');
  END IF;
  
  RETURN NEW;
END;
$function$;