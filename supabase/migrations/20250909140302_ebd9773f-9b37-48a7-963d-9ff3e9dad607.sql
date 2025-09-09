-- Add project_id to onboarding_responses table
ALTER TABLE public.onboarding_responses 
ADD COLUMN project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE;

-- Add project_id to call_logs table  
ALTER TABLE public.call_logs
ADD COLUMN project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE;

-- Update the user_owns_phone_number function to work with projects
CREATE OR REPLACE FUNCTION public.project_owns_phone_number(_user_id uuid, _phone_number text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.onboarding_responses or_table
    JOIN public.project_members pm ON or_table.project_id = pm.project_id
    WHERE pm.user_id = _user_id 
    AND or_table.contact_number = _phone_number
  );
$function$;

-- Update handle_new_user function to create a default project
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  new_project_id uuid;
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
  
  -- Create a default project for the new user
  INSERT INTO public.projects (created_by, name, description)
  VALUES (NEW.id, 'My Business', 'Default project for my business')
  RETURNING id INTO new_project_id;
  
  -- Make the user the owner of their project
  INSERT INTO public.project_members (project_id, user_id, role)
  VALUES (new_project_id, NEW.id, 'owner');
  
  RETURN NEW;
END;
$function$;

-- Update RLS policies for onboarding_responses to work with projects
DROP POLICY IF EXISTS "Users can view their own onboarding responses" ON public.onboarding_responses;
DROP POLICY IF EXISTS "Users can create their own onboarding responses" ON public.onboarding_responses;
DROP POLICY IF EXISTS "Users can update their own onboarding responses" ON public.onboarding_responses;
DROP POLICY IF EXISTS "Users can delete their own onboarding responses" ON public.onboarding_responses;

CREATE POLICY "Users can view project onboarding responses" 
ON public.onboarding_responses 
FOR SELECT 
USING (
  project_id IS NULL AND auth.uid() = user_id OR -- Legacy support
  project_id IS NOT NULL AND can_access_project(auth.uid(), project_id)
);

CREATE POLICY "Users can create project onboarding responses" 
ON public.onboarding_responses 
FOR INSERT 
WITH CHECK (
  project_id IS NULL AND auth.uid() = user_id OR -- Legacy support
  project_id IS NOT NULL AND can_access_project(auth.uid(), project_id)
);

CREATE POLICY "Users can update project onboarding responses" 
ON public.onboarding_responses 
FOR UPDATE 
USING (
  project_id IS NULL AND auth.uid() = user_id OR -- Legacy support
  project_id IS NOT NULL AND can_access_project(auth.uid(), project_id)
);

CREATE POLICY "Users can delete project onboarding responses" 
ON public.onboarding_responses 
FOR DELETE 
USING (
  project_id IS NULL AND auth.uid() = user_id OR -- Legacy support
  project_id IS NOT NULL AND can_access_project(auth.uid(), project_id)
);

-- Update RLS policies for call_logs to work with projects
DROP POLICY IF EXISTS "Users can view own call logs" ON public.call_logs;
DROP POLICY IF EXISTS "Users can insert own call logs" ON public.call_logs;
DROP POLICY IF EXISTS "Users can update own call logs" ON public.call_logs;
DROP POLICY IF EXISTS "Users can delete own call logs" ON public.call_logs;

CREATE POLICY "Users can view project call logs" 
ON public.call_logs 
FOR SELECT 
USING (
  (auth.uid() IS NOT NULL) AND (
    project_id IS NULL AND user_owns_phone_number(auth.uid(), phone_number) OR -- Legacy support
    project_id IS NOT NULL AND can_access_project(auth.uid(), project_id)
  )
);

CREATE POLICY "Users can insert project call logs" 
ON public.call_logs 
FOR INSERT 
WITH CHECK (
  (auth.uid() IS NOT NULL) AND (
    project_id IS NULL AND user_owns_phone_number(auth.uid(), phone_number) OR -- Legacy support
    project_id IS NOT NULL AND can_access_project(auth.uid(), project_id)
  )
);

CREATE POLICY "Users can update project call logs" 
ON public.call_logs 
FOR UPDATE 
USING (
  (auth.uid() IS NOT NULL) AND (
    project_id IS NULL AND user_owns_phone_number(auth.uid(), phone_number) OR -- Legacy support
    project_id IS NOT NULL AND can_access_project(auth.uid(), project_id)
  )
);

CREATE POLICY "Users can delete project call logs" 
ON public.call_logs 
FOR DELETE 
USING (
  (auth.uid() IS NOT NULL) AND (
    project_id IS NULL AND user_owns_phone_number(auth.uid(), phone_number) OR -- Legacy support
    project_id IS NOT NULL AND can_access_project(auth.uid(), project_id)
  )
);