import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Database } from '@/integrations/supabase/types';

type Project = Database['public']['Tables']['projects']['Row'];
type ProjectMember = Database['public']['Tables']['project_members']['Row'] & {
  profiles?: Database['public']['Tables']['profiles']['Row'] | null;
};

interface ProjectContextType {
  currentProject: Project | null;
  projects: Project[];
  projectMembers: ProjectMember[];
  loading: boolean;
  switchProject: (projectId: string) => void;
  refreshProjects: () => Promise<void>;
  refreshProjectMembers: () => Promise<void>;
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
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('project_members')
        .select(`
          *,
          projects (*)
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      const userProjects = data?.map(member => member.projects).filter(Boolean) as Project[];
      setProjects(userProjects);
      
      // Set current project to the first one if none is selected
      if (userProjects.length > 0 && !currentProject) {
        setCurrentProject(userProjects[0]);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchProjectMembers = async () => {
    if (!currentProject) return;

    try {
      const { data, error } = await supabase
        .from('project_members')
        .select(`
          *,
          profiles!inner (full_name, email)
        `)
        .eq('project_id', currentProject.id);

      if (error) throw error;
      setProjectMembers((data as any) || []);
    } catch (error) {
      console.error('Error fetching project members:', error);
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

  useEffect(() => {
    if (user) {
      setLoading(true);
      fetchProjects().finally(() => setLoading(false));
    } else {
      setCurrentProject(null);
      setProjects([]);
      setProjectMembers([]);
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
    loading,
    switchProject,
    refreshProjects,
    refreshProjectMembers,
  };

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
};