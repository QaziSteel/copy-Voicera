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
  recording_file_path: string | null;
  transcript_file_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface UseCallLogsResult {
  callLogs: CallLogRecord[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useCallLogs = (searchTerm: string = '', dateFilter?: { from?: Date; to?: Date }, filterVersion?: number): UseCallLogsResult => {
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

      // First, get all phone numbers for the current project
      const { data: phoneNumbers, error: phoneNumbersError } = await supabase
        .from('phone_numbers')
        .select('id, phone_number')
        .eq('project_id', currentProject.id);

      if (phoneNumbersError) {
        throw phoneNumbersError;
      }

      if (!phoneNumbers || phoneNumbers.length === 0) {
        setCallLogs([]);
        setLoading(false);
        return;
      }

      // Extract phone number IDs and phone number strings
      const phoneNumberIds = phoneNumbers.map(pn => pn.id);
      const phoneNumberStrings = phoneNumbers.map(pn => pn.phone_number);

      // Build base query for call logs
      let query = supabase
        .from('call_logs')
        .select('*');

      // Create project filter - call logs must belong to project phone numbers
      const projectFilter = `phone_number_id.in.(${phoneNumberIds.join(',')}),phone_number.in.(${phoneNumberStrings.map(pn => `"${pn}"`).join(',')})`;
      
      // Add search filter if provided, combined with project filter
      if (searchTerm) {
        query = query.or(`and(${projectFilter},or(phone_number.ilike.%${searchTerm}%,customer_number.ilike.%${searchTerm}%))`);
      } else {
        query = query.or(projectFilter);
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
  }, [user, currentProject, searchTerm, filterVersion]);

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
          table: 'call_logs'
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