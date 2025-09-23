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
  // Booking information
  booking_id: string | null;
  booking_customer_name: string | null;
  booking_service_type: string | null;
  booking_appointment_date: string | null;
  booking_appointment_time: string | null;
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