import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProject } from '@/contexts/ProjectContext';

export interface CallLogRecord {
  id: string;
  phone_number: string;
  customer_number: string | null;
  type: string | null;
  started_at: string | null;
  ended_at: string | null;
  total_call_time: number | null;
  ended_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface UseCallLogsResult {
  callLogs: CallLogRecord[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useCallLogs = (searchTerm: string = '', dateFilter?: { from?: Date; to?: Date }): UseCallLogsResult => {
  const [callLogs, setCallLogs] = useState<CallLogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { currentProject } = useProject();

  const fetchCallLogs = async () => {
    if (!user || !currentProject) {
      setCallLogs([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Build query for call logs using project_id
      let query = supabase
        .from('call_logs')
        .select('*')
        .eq('project_id', currentProject.id);

      // Add search filter
      if (searchTerm) {
        query = query.or(
          `phone_number.ilike.%${searchTerm}%,customer_number.ilike.%${searchTerm}%`
        );
      }

      // Add date filter
      if (dateFilter?.from) {
        query = query.gte('started_at', dateFilter.from.toISOString());
      }
      if (dateFilter?.to) {
        query = query.lte('started_at', dateFilter.to.toISOString());
      }

      // Order by most recent first
      query = query.order('started_at', { ascending: false });

      const { data, error: callLogsError } = await query;

      if (callLogsError) {
        throw callLogsError;
      }

      setCallLogs(data || []);
    } catch (err) {
      console.error('Error fetching call logs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch call logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCallLogs();
  }, [user, currentProject, searchTerm, dateFilter]);

  // Set up real-time subscription
  useEffect(() => {
    if (!user || !currentProject) return;

    const channel = supabase
      .channel('call-logs-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'call_logs',
          filter: `project_id=eq.${currentProject.id}`
        },
        (payload) => {
          console.log('Call logs changed:', payload);
          fetchCallLogs(); // Refetch data when changes occur
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, currentProject]);

  return {
    callLogs,
    loading,
    error,
    refetch: fetchCallLogs
  };
};