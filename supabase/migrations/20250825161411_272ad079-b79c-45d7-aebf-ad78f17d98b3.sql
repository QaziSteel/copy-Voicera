-- Fix search_path for security definer functions to address security warnings
CREATE OR REPLACE FUNCTION public.has_global_role(_user_id UUID, _role public.user_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = 'public'
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
SET search_path = 'public'
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
SET search_path = 'public'
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
SET search_path = 'public'
AS $$
  SELECT p.id, p.name, pm.role
  FROM public.projects p
  JOIN public.project_members pm ON p.id = pm.project_id
  WHERE pm.user_id = _user_id
  OR public.has_global_role(_user_id, 'admin');
$$;