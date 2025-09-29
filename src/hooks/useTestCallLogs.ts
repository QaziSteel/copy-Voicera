import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface TestCallLog {
  id: string;
  agent_id: string;
  project_id: string;
  user_id: string;
  assistant_id: string | null;
  call_started_at: string | null;
  call_ended_at: string | null;
  duration_seconds: number | null;
  vapi_call_id: string | null;
  recording_url: string | null;
  transcript_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTestCallLogParams {
  agent_id: string;
  project_id: string;
  assistant_id?: string;
  call_started_at?: string;
}

export interface UpdateTestCallLogParams {
  id: string;
  call_ended_at?: string;
  duration_seconds?: number;
  vapi_call_id?: string;
  recording_url?: string;
  transcript_url?: string;
}

export const useTestCallLogs = (agentId: string) => {
  const { user } = useAuth();
  const [testCallLogs, setTestCallLogs] = useState<TestCallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTestCallLogs = useCallback(async () => {
    if (!user || !agentId) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('test_call_logs')
        .select('*')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching test call logs:', error);
        setError(error.message);
        return;
      }

      setTestCallLogs(data || []);
    } catch (err) {
      console.error('Error in fetchTestCallLogs:', err);
      setError('Failed to fetch test call logs');
    } finally {
      setLoading(false);
    }
  }, [user, agentId]);

  const createTestCallLog = useCallback(async (params: CreateTestCallLogParams) => {
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('test_call_logs')
      .insert({
        agent_id: params.agent_id,
        project_id: params.project_id,
        user_id: user.id,
        assistant_id: params.assistant_id,
        call_started_at: params.call_started_at,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating test call log:', error);
      throw error;
    }

    return data;
  }, [user]);

  const updateTestCallLog = useCallback(async (params: UpdateTestCallLogParams) => {
    const updateData: any = {};
    
    if (params.call_ended_at !== undefined) updateData.call_ended_at = params.call_ended_at;
    if (params.duration_seconds !== undefined) updateData.duration_seconds = params.duration_seconds;
    if (params.vapi_call_id !== undefined) updateData.vapi_call_id = params.vapi_call_id;
    if (params.recording_url !== undefined) updateData.recording_url = params.recording_url;
    if (params.transcript_url !== undefined) updateData.transcript_url = params.transcript_url;

    const { data, error } = await supabase
      .from('test_call_logs')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating test call log:', error);
      throw error;
    }

    return data;
  }, []);

  useEffect(() => {
    fetchTestCallLogs();
  }, [fetchTestCallLogs]);

  // Set up real-time subscription for test call logs
  useEffect(() => {
    if (!agentId) return;

    const channel = supabase
      .channel('test_call_logs_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'test_call_logs',
          filter: `agent_id=eq.${agentId}`,
        },
        () => {
          fetchTestCallLogs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [agentId, fetchTestCallLogs]);

  return {
    testCallLogs,
    loading,
    error,
    createTestCallLog,
    updateTestCallLog,
    refetch: fetchTestCallLogs,
  };
};