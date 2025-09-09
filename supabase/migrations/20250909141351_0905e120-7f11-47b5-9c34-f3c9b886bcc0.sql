-- Create a project for each existing profile
DO $$
DECLARE
    profile_record RECORD;
    new_project_id UUID;
BEGIN
    -- Loop through each profile in the profiles table
    FOR profile_record IN 
        SELECT id FROM public.profiles 
        WHERE NOT EXISTS (
            SELECT 1 FROM public.project_members pm 
            WHERE pm.user_id = profiles.id AND pm.role = 'owner'
        )
    LOOP
        -- Create a new project for this user
        INSERT INTO public.projects (created_by, name, description)
        VALUES (profile_record.id, 'My Business', 'Default project for my business')
        RETURNING id INTO new_project_id;
        
        -- Make the user the owner of their project
        INSERT INTO public.project_members (project_id, user_id, role)
        VALUES (new_project_id, profile_record.id, 'owner');
        
        -- Update any existing onboarding_responses for this user to link to their project
        UPDATE public.onboarding_responses 
        SET project_id = new_project_id 
        WHERE user_id = profile_record.id AND project_id IS NULL;
        
        -- Update any existing call_logs for this user to link to their project
        -- (based on phone numbers they own through onboarding responses)
        UPDATE public.call_logs 
        SET project_id = new_project_id 
        WHERE project_id IS NULL 
        AND phone_number IN (
            SELECT contact_number 
            FROM public.onboarding_responses 
            WHERE user_id = profile_record.id 
            AND contact_number IS NOT NULL
        );
        
    END LOOP;
END $$;