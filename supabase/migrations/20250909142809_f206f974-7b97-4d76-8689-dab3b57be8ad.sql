-- Create phone_numbers table
CREATE TABLE public.phone_numbers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    phone_number TEXT NOT NULL UNIQUE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on phone_numbers
ALTER TABLE public.phone_numbers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for phone_numbers
CREATE POLICY "Users can view phone numbers for their projects" 
ON public.phone_numbers 
FOR SELECT 
USING (can_access_project(auth.uid(), project_id));

CREATE POLICY "Project owners and admins can manage phone numbers" 
ON public.phone_numbers 
FOR ALL 
USING (
    has_project_role(auth.uid(), project_id, 'owner'::project_role) OR 
    has_project_role(auth.uid(), project_id, 'admin'::project_role) OR 
    has_global_role(auth.uid(), 'admin'::user_role)
);

-- Migrate existing data: Create phone_numbers records from onboarding_responses
-- Handle duplicates by taking the most recent onboarding_response for each phone number
INSERT INTO public.phone_numbers (phone_number, project_id)
SELECT DISTINCT ON (or_table.contact_number)
    or_table.contact_number,
    or_table.project_id
FROM public.onboarding_responses or_table
WHERE or_table.contact_number IS NOT NULL 
AND or_table.project_id IS NOT NULL
ORDER BY or_table.contact_number, or_table.updated_at DESC;

-- Update call_logs.phone_number_id to reference the new phone_numbers table
UPDATE public.call_logs 
SET phone_number_id = pn.id
FROM public.phone_numbers pn
WHERE call_logs.phone_number = pn.phone_number
AND call_logs.phone_number_id IS NULL;

-- Remove project_id column from call_logs
ALTER TABLE public.call_logs DROP COLUMN IF EXISTS project_id;

-- Drop old call_logs RLS policies
DROP POLICY IF EXISTS "Users can view project call logs" ON public.call_logs;
DROP POLICY IF EXISTS "Users can insert project call logs" ON public.call_logs;
DROP POLICY IF EXISTS "Users can update project call logs" ON public.call_logs;
DROP POLICY IF EXISTS "Users can delete project call logs" ON public.call_logs;

-- Create new call_logs RLS policies that work through phone_numbers
CREATE POLICY "Users can view call logs for their project phone numbers" 
ON public.call_logs 
FOR SELECT 
USING (
    auth.uid() IS NOT NULL AND (
        (phone_number_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.phone_numbers pn 
            WHERE pn.id = call_logs.phone_number_id 
            AND can_access_project(auth.uid(), pn.project_id)
        )) OR 
        (phone_number_id IS NULL AND user_owns_phone_number(auth.uid(), phone_number))
    )
);

CREATE POLICY "Users can insert call logs for their project phone numbers" 
ON public.call_logs 
FOR INSERT 
WITH CHECK (
    auth.uid() IS NOT NULL AND (
        (phone_number_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.phone_numbers pn 
            WHERE pn.id = call_logs.phone_number_id 
            AND can_access_project(auth.uid(), pn.project_id)
        )) OR 
        (phone_number_id IS NULL AND user_owns_phone_number(auth.uid(), phone_number))
    )
);

CREATE POLICY "Users can update call logs for their project phone numbers" 
ON public.call_logs 
FOR UPDATE 
USING (
    auth.uid() IS NOT NULL AND (
        (phone_number_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.phone_numbers pn 
            WHERE pn.id = call_logs.phone_number_id 
            AND can_access_project(auth.uid(), pn.project_id)
        )) OR 
        (phone_number_id IS NULL AND user_owns_phone_number(auth.uid(), phone_number))
    )
);

CREATE POLICY "Users can delete call logs for their project phone numbers" 
ON public.call_logs 
FOR DELETE 
USING (
    auth.uid() IS NOT NULL AND (
        (phone_number_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.phone_numbers pn 
            WHERE pn.id = call_logs.phone_number_id 
            AND can_access_project(auth.uid(), pn.project_id)
        )) OR 
        (phone_number_id IS NULL AND user_owns_phone_number(auth.uid(), phone_number))
    )
);

-- Create trigger for phone_numbers updated_at
CREATE TRIGGER update_phone_numbers_updated_at
    BEFORE UPDATE ON public.phone_numbers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();