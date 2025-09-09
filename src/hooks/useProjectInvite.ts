import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useProjectInvite = () => {
  const [loading, setLoading] = useState(false);

  const inviteUserToProject = async (email: string, projectId: string, role: 'member' | 'admin' = 'member') => {
    setLoading(true);
    try {
      // First, check if user exists
      const { data: existingUser, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (userError && userError.code !== 'PGRST116') {
        throw userError;
      }

      if (existingUser) {
        // User exists, add them directly to the project
        const { error: memberError } = await supabase
          .from('project_members')
          .insert({
            project_id: projectId,
            user_id: existingUser.id,
            role: role
          });

        if (memberError) {
          if (memberError.code === '23505') {
            toast.error('User is already a member of this project');
            return { success: false };
          }
          throw memberError;
        }

        toast.success('User invited successfully!');
        return { success: true };
      } else {
        // User doesn't exist, send invitation email
        // For now, we'll just show a message that the user needs to sign up first
        toast.error('User not found. They need to sign up first.');
        return { success: false };
      }
    } catch (error) {
      console.error('Error inviting user:', error);
      toast.error('Failed to invite user');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const removeUserFromProject = async (userId: string, projectId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('project_members')
        .delete()
        .eq('project_id', projectId)
        .eq('user_id', userId);

      if (error) throw error;

      toast.success('User removed from project');
      return { success: true };
    } catch (error) {
      console.error('Error removing user:', error);
      toast.error('Failed to remove user');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  return {
    inviteUserToProject,
    removeUserFromProject,
    loading
  };
};