import { useCallback, useEffect, useState } from 'react';
import { createDynamicSupabaseClient } from '@/lib/supabaseClient';
import { toast } from 'sonner';

export type PendingInvitation = {
  id: string;
  project_id: string;
  project_name: string | null;
  role: 'member' | 'admin' | 'owner' | string;
  expires_at: string | null;
  token: string;
  status: string;
  email: string;
  inviter_id: string | null;
};

export function useInvitations() {
  const [invites, setInvites] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchInvites = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createDynamicSupabaseClient();
      const { data, error } = await supabase.functions.invoke('list-user-invitations');
      if (error) throw error;
      setInvites(data?.invitations || []);
    } catch (err: any) {
      console.error('Failed to load invitations', err);
      toast.error(err?.message || 'Failed to load invitations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvites();
  }, [fetchInvites]);

  const acceptInvite = useCallback(async (token: string): Promise<{ success: boolean; projectId?: string; error?: string }> => {
    try {
      const supabase = createDynamicSupabaseClient();
      const { data, error } = await supabase.functions.invoke('accept-project-invite', {
        body: { token },
      });
      if (error) throw error;
      return { success: true, projectId: data?.projectId };
    } catch (err: any) {
      console.error('Accept invite failed', err);
      return { success: false, error: err?.message || 'Failed to accept invitation' };
    }
  }, []);

  const declineInvite = useCallback(async (token: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const supabase = createDynamicSupabaseClient();
      const { error } = await supabase.functions.invoke('decline-project-invite', {
        body: { token },
      });
      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      console.error('Decline invite failed', err);
      return { success: false, error: err?.message || 'Failed to decline invitation' };
    }
  }, []);

  return {
    invites,
    loading,
    refresh: fetchInvites,
    acceptInvite,
    declineInvite,
  };
}
