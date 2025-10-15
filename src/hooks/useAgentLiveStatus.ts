import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProject } from '@/contexts/ProjectContext';

export const useAgentLiveStatus = () => {
  const { currentProject } = useProject();
  const [hasLiveAgent, setHasLiveAgent] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentProject) {
      setHasLiveAgent(false);
      setLoading(false);
      return;
    }

    const checkAgentStatus = async () => {
      const { data, error } = await supabase
        .from('onboarding_responses')
        .select('current_status')
        .eq('project_id', currentProject.id)
        .eq('current_status', 'live')
        .limit(1);

      if (!error && data) {
        setHasLiveAgent(data.length > 0);
      }
      setLoading(false);
    };

    checkAgentStatus();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('agent-status-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'onboarding_responses',
          filter: `project_id=eq.${currentProject.id}`
        },
        () => {
          checkAgentStatus();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentProject]);

  return { hasLiveAgent, loading };
};
