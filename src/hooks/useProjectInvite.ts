import { useState } from 'react';
import { createDynamicSupabaseClient } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { useProject } from '@/contexts/ProjectContext';

export const useProjectInvite = () => {
  const [loading, setLoading] = useState(false);
  const { currentProject } = useProject();

  const inviteUserToProject = async (email: string, role: 'member' | 'admin' = 'member') => {
    if (!currentProject) {
      toast.error('No project selected');
      return { success: false };
    }

    setLoading(true);
    try {
      const supabase = createDynamicSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to send invitations');
        return { success: false };
      }

      console.log('Sending invitation via edge function:', { email, projectId: currentProject.id, role });

      // Call the edge function to send invitation
      const { data, error } = await supabase.functions.invoke('send-project-invite', {
        body: {
          email,
          projectId: currentProject.id,
          inviterId: user.id,
          role
        }
      });

      if (error) {
        console.error('Error sending invitation:', error);
        
        // Handle specific error codes
        if (error.message?.includes('USER_ALREADY_IN_PROJECT') || 
            error.message?.includes('already a member') || 
            error.message?.includes('already a')) {
          toast.error(error.message, { duration: 6000 });
        } else if (error.message?.includes('409')) {
          toast.error('This user is already part of another project');
        } else {
          toast.error('Failed to send invitation');
        }
        return { success: false };
      }

      if (!data?.success) {
        console.error('Invitation failed:', data);
        
        // Handle error codes from response
        if (data?.code === 'USER_ALREADY_IN_PROJECT') {
          toast.error(data?.error, { duration: 6000 });
        } else {
          toast.error(data?.error || 'Failed to send invitation');
        }
        return { success: false };
      }

      console.log('Invitation sent successfully:', data);
      if (data?.emailSent === false) {
        toast.info('Invitation created, but email could not be sent. Share the invite link directly.', {
          action: {
            label: 'Copy link',
            onClick: () => {
              if (data?.invitationUrl) navigator.clipboard.writeText(data.invitationUrl);
            }
          }
        });
      } else {
        toast.success(`Invitation sent to ${email}! They will receive an email with instructions to join.`);
      }
      
      return { 
        success: true, 
        invitationId: data.invitationId,
        token: data.token,
        emailId: data.emailId,
        expiresAt: data.expiresAt,
        inviteUrl: data.invitationUrl,
        emailSent: data.emailSent
      };
    } catch (error) {
      console.error('Error inviting user:', error);
      toast.error('Failed to send invitation');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const removeUserFromProject = async (userId: string) => {
    if (!currentProject) {
      toast.error('No project selected');
      return { success: false };
    }

    const projectId = currentProject.id;
    setLoading(true);
    try {
      const supabase = createDynamicSupabaseClient();
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