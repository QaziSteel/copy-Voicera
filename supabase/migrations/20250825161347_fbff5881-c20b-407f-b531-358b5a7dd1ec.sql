-- Create enums for user and project roles
CREATE TYPE public.user_role AS ENUM ('admin', 'user');
CREATE TYPE public.project_role AS ENUM ('owner', 'admin', 'member', 'viewer');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role public.user_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Create projects table
CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create project_members table
CREATE TABLE public.project_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role public.project_role NOT NULL DEFAULT 'member',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (project_id, user_id)
);

-- Enable RLS on all new tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

-- Create security definer functions to avoid RLS recursion
CREATE OR REPLACE FUNCTION public.has_global_role(_user_id UUID, _role public.user_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.has_project_role(_user_id UUID, _project_id UUID, _role public.project_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.project_members
    WHERE user_id = _user_id AND project_id = _project_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.can_access_project(_user_id UUID, _project_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.project_members
    WHERE user_id = _user_id AND project_id = _project_id
  ) OR public.has_global_role(_user_id, 'admin');
$$;

CREATE OR REPLACE FUNCTION public.get_user_projects(_user_id UUID)
RETURNS TABLE(project_id UUID, project_name TEXT, user_role public.project_role)
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT p.id, p.name, pm.role
  FROM public.projects p
  JOIN public.project_members pm ON p.id = pm.project_id
  WHERE pm.user_id = _user_id
  OR public.has_global_role(_user_id, 'admin');
$$;

-- Create RLS policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all user roles" ON public.user_roles
FOR SELECT USING (public.has_global_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage user roles" ON public.user_roles
FOR ALL USING (public.has_global_role(auth.uid(), 'admin'));

-- Create RLS policies for projects
CREATE POLICY "Users can view projects they are members of" ON public.projects
FOR SELECT USING (public.can_access_project(auth.uid(), id));

CREATE POLICY "Project owners and admins can update projects" ON public.projects
FOR UPDATE USING (
  public.has_project_role(auth.uid(), id, 'owner') OR 
  public.has_project_role(auth.uid(), id, 'admin') OR
  public.has_global_role(auth.uid(), 'admin')
);

CREATE POLICY "Authenticated users can create projects" ON public.projects
FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Project owners and global admins can delete projects" ON public.projects
FOR DELETE USING (
  public.has_project_role(auth.uid(), id, 'owner') OR
  public.has_global_role(auth.uid(), 'admin')
);

-- Create RLS policies for project_members
CREATE POLICY "Users can view project members for projects they belong to" ON public.project_members
FOR SELECT USING (public.can_access_project(auth.uid(), project_id));

CREATE POLICY "Project owners and admins can manage members" ON public.project_members
FOR ALL USING (
  public.has_project_role(auth.uid(), project_id, 'owner') OR 
  public.has_project_role(auth.uid(), project_id, 'admin') OR
  public.has_global_role(auth.uid(), 'admin')
);

-- Add trigger to projects for updated_at
CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update handle_new_user function to assign default user role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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
  
  -- Assign default user role to new users
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Assign roles to existing users
-- First, get the earliest created user (should be qazi@getthenga.com) and assign admin role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM public.profiles
WHERE email = 'qazi@getthenga.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Assign user role to all other existing users
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'user'
FROM public.profiles
WHERE email != 'qazi@getthenga.com' OR email IS NULL
ON CONFLICT (user_id, role) DO NOTHING;