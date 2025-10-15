import React, { createContext, useContext, useEffect, useState } from 'react';
import { createDynamicSupabaseClient } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Database } from '@/integrations/supabase/types';

type Project = Database['public']['Tables']['projects']['Row'];
type ProjectMember = Database['public']['Tables']['project_members']['Row'] & {
  profiles?: Database['public']['Tables']['profiles']['Row'] | null;
};

type ProjectRole = 'owner' | 'admin' | 'member';

interface ProjectContextType {
  currentProject: Project | null;
  projects: Project[];
  projectMembers: ProjectMember[];
  currentUserRole: ProjectRole | null;
  loading: boolean;
  switchProject: (projectId: string) => void;
  refreshProjects: () => Promise<void>;
  refreshProjectMembers: () => Promise<void>;
  canViewCustomerData: () => boolean;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};

interface ProjectProviderProps {
  children: React.ReactNode;
}

export const ProjectProvider: React.FC<ProjectProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<ProjectRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    if (!user) return;
    
    const supabase = createDynamicSupabaseClient();
    
    try {
      // First get project memberships
      const { data: memberships, error: memberError } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('user_id', user.id);

      if (memberError) throw memberError;

      if (!memberships || memberships.length === 0) {
        setProjects([]);
        return;
      }

      // Then get the actual projects
      const projectIds = memberships.map(m => m.project_id);
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .in('id', projectIds);

      if (projectsError) throw projectsError;

      setProjects(projectsData || []);
      
      // Set current project to the first one if none is selected
      if (projectsData && projectsData.length > 0 && !currentProject) {
        setCurrentProject(projectsData[0]);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchProjectMembers = async () => {
    if (!currentProject || !user) return;

    const supabase = createDynamicSupabaseClient();

    try {
      // First get project members
      const { data: membersData, error: membersError } = await supabase
        .from('project_members')
        .select('*')
        .eq('project_id', currentProject.id);

      if (membersError) throw membersError;

      if (!membersData || membersData.length === 0) {
        setProjectMembers([]);
        setCurrentUserRole(null);
        return;
      }

      // Find current user's role
      const currentUserMembership = membersData.find(m => m.user_id === user.id);
      setCurrentUserRole(currentUserMembership?.role as ProjectRole || null);

      // Then get profiles for these members
      const userIds = membersData.map(m => m.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);

      if (profilesError) {
        console.warn('Could not fetch profiles:', profilesError);
        // Still set members even if profiles fail
        setProjectMembers(membersData.map(member => ({ ...member, profiles: null })));
        return;
      }

      // Combine members with their profiles
      const membersWithProfiles = membersData.map(member => {
        const profile = profilesData?.find(p => p.id === member.user_id);
        return {
          ...member,
          profiles: profile || null
        };
      });

      setProjectMembers(membersWithProfiles);
    } catch (error) {
      console.error('Error fetching project members:', error);
      setProjectMembers([]);
      setCurrentUserRole(null);
    }
  };

  const switchProject = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setCurrentProject(project);
    }
  };

  const refreshProjects = async () => {
    await fetchProjects();
  };

  const refreshProjectMembers = async () => {
    await fetchProjectMembers();
  };

  const canViewCustomerData = (): boolean => {
    return currentUserRole === 'owner' || currentUserRole === 'admin';
  };

  useEffect(() => {
    if (user) {
      setLoading(true);
      fetchProjects().finally(() => setLoading(false));
    } else {
      setCurrentProject(null);
      setProjects([]);
      setProjectMembers([]);
      setCurrentUserRole(null);
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProjectMembers();
  }, [currentProject]);

  const value = {
    currentProject,
    projects,
    projectMembers,
    currentUserRole,
    loading,
    switchProject,
    refreshProjects,
    refreshProjectMembers,
    canViewCustomerData,
  };

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
};