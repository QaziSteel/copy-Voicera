import { useState, useEffect } from 'react';
import { createDynamicSupabaseClient } from '@/lib/supabaseClient';
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
  // Booking information
  booking_id: string | null;
  booking_customer_name: string | null;
  booking_service_type: string | null;
  booking_appointment_date: string | null;
  booking_appointment_time: string | null;
  // Agent information
  phone_number_id?: string;
  agent_id?: string;
  agent_name?: string;
  wants_daily_summary?: boolean;
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

    const supabase = createDynamicSupabaseClient();

    try {
      setLoading(true);
      setError(null);

      // First, get all phone numbers for the current project with agent info
      const { data: phoneNumbersData, error: phoneNumbersError } = await supabase
        .from('phone_numbers')
        .select(`
          id,
          phone_number,
          project_id
        `)
        .eq('project_id', currentProject.id);

      if (phoneNumbersError) {
        throw phoneNumbersError;
      }

      if (!phoneNumbersData || phoneNumbersData.length === 0) {
        setCallLogs([]);
        setLoading(false);
        return;
      }

      // Get agent information for these phone numbers
      const { data: agentsData, error: agentsError } = await supabase
        .from('onboarding_responses')
        .select('id, contact_number, business_name, wants_daily_summary')
        .eq('project_id', currentProject.id)
        .in('contact_number', phoneNumbersData.map(pn => pn.phone_number));

      if (agentsError) {
        console.error('Error fetching agents:', agentsError);
      }

      // Create a map of phone_number -> agent info
      const agentMap = new Map(
        (agentsData || []).map(agent => [
          agent.contact_number,
          {
            agent_id: agent.id,
            agent_name: agent.business_name || 'Unknown Agent',
            wants_daily_summary: agent.wants_daily_summary || false,
          }
        ])
      );

      // Create a map of phone_number -> phone_number_id
      const phoneNumberIdMap = new Map(
        phoneNumbersData.map(pn => [pn.phone_number, pn.id])
      );

      // Extract phone number IDs and phone number strings
      const phoneNumberIds = phoneNumbersData.map(pn => pn.id);
      const phoneNumberStrings = phoneNumbersData.map(pn => pn.phone_number);

      // Use database function to get call logs with booking information
      const { data, error: callLogsError } = await supabase.rpc('get_call_logs_with_bookings', {
        phone_number_ids: phoneNumberIds,
        phone_numbers: phoneNumberStrings,
        search_term: searchTerm || null,
        date_from: dateFilter?.from?.toISOString() || null,
        date_to: dateFilter?.to?.toISOString() || null
      });

      if (callLogsError) {
        throw callLogsError;
      }

      // Enrich call logs with agent information
      const enrichedCallLogs = (data || []).map(log => {
        const agentInfo = agentMap.get(log.phone_number);
        const phoneNumberId = phoneNumberIdMap.get(log.phone_number);
        return {
          ...log,
          phone_number_id: phoneNumberId,
          agent_id: agentInfo?.agent_id,
          agent_name: agentInfo?.agent_name,
          wants_daily_summary: agentInfo?.wants_daily_summary,
        };
      });

      setCallLogs(enrichedCallLogs);
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

    const supabase = createDynamicSupabaseClient();

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