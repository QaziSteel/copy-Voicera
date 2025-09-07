import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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

  const fetchCallLogs = async () => {
    if (!user) {
      setCallLogs([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // First, get the user's phone number from onboarding_responses
      const { data: onboardingData, error: onboardingError } = await supabase
        .from('onboarding_responses')
        .select('contact_number')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (onboardingError || !onboardingData?.contact_number) {
        console.log('No phone number found for user:', onboardingError);
        setCallLogs([]);
        setLoading(false);
        return;
      }

      // Build query for call logs
      let query = supabase
        .from('call_logs')
        .select('*')
        .eq('phone_number', onboardingData.contact_number);

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
  }, [user, searchTerm, dateFilter]);

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return;

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
  }, [user]);

  return {
    callLogs,
    loading,
    error,
    refetch: fetchCallLogs
  };
};