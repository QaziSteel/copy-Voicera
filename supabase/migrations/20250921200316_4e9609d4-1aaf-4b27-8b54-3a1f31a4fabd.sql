-- Create project invitations table
CREATE TABLE public.project_invitations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL,
  inviter_id uuid NOT NULL,
  email text NOT NULL,
  role project_role NOT NULL DEFAULT 'member',
  status text NOT NULL DEFAULT 'pending',
  invited_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_invitations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Project owners and admins can manage invitations" 
ON public.project_invitations 
FOR ALL 
USING (
  has_project_role(auth.uid(), project_id, 'owner'::project_role) OR 
  has_project_role(auth.uid(), project_id, 'admin'::project_role) OR 
  has_global_role(auth.uid(), 'admin'::user_role)
);

CREATE POLICY "Users can view invitations for their projects" 
ON public.project_invitations 
FOR SELECT 
USING (can_access_project(auth.uid(), project_id));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_project_invitations_updated_at
BEFORE UPDATE ON public.project_invitations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();