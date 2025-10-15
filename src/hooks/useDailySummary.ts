import { useState, useEffect } from 'react';
import { useCallLogs, CallLogRecord } from './useCallLogs';

export interface DailySummaryEntry {
  id: string;
  date: string;
  formattedDate: string;
  callsTaken: number;
  avgDuration: string;
  bookingsMade: number;
  missed: number;
  informationInquiries: number;
  conversionRate: string;
  peakTime: string;
  // Agent grouping
  phone_number?: string;
  agent_id?: string;
  agent_name?: string;
  wants_summary?: boolean;
  // For date-level summaries
  isDateSummary?: boolean;
  agentSummaries?: DailySummaryEntry[];
}

export interface UseDailySummaryResult {
  dailySummaryEntries: DailySummaryEntry[];
  loading: boolean;
  error: string | null;
  callLogs: CallLogRecord[];
}

export const useDailySummary = (dateFilter?: { from?: Date; to?: Date }, filterVersion?: number): UseDailySummaryResult => {
  const { callLogs, loading, error } = useCallLogs('', dateFilter, filterVersion);
  const [dailySummaryEntries, setDailySummaryEntries] = useState<DailySummaryEntry[]>([]);

  useEffect(() => {
    if (!callLogs.length) {
      setDailySummaryEntries([]);
      return;
    }

    // Filter calls to only include those from agents with wants_daily_summary = true
    const filteredCallLogs = callLogs.filter(call => call.wants_daily_summary === true);

    if (filteredCallLogs.length === 0) {
      setDailySummaryEntries([]);
      return;
    }

    // Group calls by date AND agent
    const callsByDateAndAgent = filteredCallLogs.reduce((acc, call) => {
      if (!call.started_at || !call.agent_id) return acc;
      
      const date = new Date(call.started_at);
      const dateKey = date.toDateString();
      const agentKey = call.agent_id;
      
      if (!acc[dateKey]) {
        acc[dateKey] = {};
      }
      if (!acc[dateKey][agentKey]) {
        acc[dateKey][agentKey] = [];
      }
      acc[dateKey][agentKey].push(call);
      return acc;
    }, {} as Record<string, Record<string, CallLogRecord[]>>);

    // Helper function to calculate metrics for a set of calls
    const calculateMetrics = (calls: CallLogRecord[]) => {
      const callsTaken = calls.length;
        
        // For now, treat all calls as information inquiries
        const informationInquiries = callsTaken;
        
        // Count actual bookings from call logs
        const bookingsMade = calls.filter(call => call.booking_id !== null).length;
        
        // Calculate missed calls (very short duration or specific end reasons)
        const missed = calls.filter(call => 
          !call.total_call_time || 
          call.total_call_time < 10 || 
          call.ended_reason === 'dropped' ||
          call.ended_reason === 'missed'
        ).length;

        // Calculate average duration
        const validDurations = calls
          .map(call => call.total_call_time)
          .filter((duration): duration is number => duration !== null && duration > 0);
        
        const averageDurationSeconds = validDurations.length > 0
          ? Math.round(validDurations.reduce((sum, duration) => sum + duration, 0) / validDurations.length)
          : 0;

        const formatDuration = (seconds: number): string => {
          if (seconds < 60) {
            return `${seconds}s`;
          }
          const minutes = Math.floor(seconds / 60);
          const remainingSeconds = seconds % 60;
          return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
        };

        const avgDuration = formatDuration(averageDurationSeconds);

        // Calculate peak time (busiest 2-hour window)
        const calculatePeakTime = (callsForDay: CallLogRecord[]): string => {
          if (callsForDay.length === 0) return 'N/A';
          
          // Create hourly buckets (0-23)
          const hourCounts: Record<number, number> = {};
          
          callsForDay.forEach(call => {
            if (call.started_at) {
              const hour = new Date(call.started_at).getHours();
              hourCounts[hour] = (hourCounts[hour] || 0) + 1;
            }
          });
          
          // Find the busiest 2-hour window
          let maxCalls = 0;
          let peakStartHour = 0;
          
          for (let hour = 0; hour <= 22; hour++) {
            const windowCount = (hourCounts[hour] || 0) + (hourCounts[hour + 1] || 0);
            if (windowCount > maxCalls) {
              maxCalls = windowCount;
              peakStartHour = hour;
            }
          }
          
          // Format the time range
          const formatHour = (hour: number): string => {
            const period = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
            return `${displayHour}:00 ${period}`;
          };
          
          return `${formatHour(peakStartHour)} – ${formatHour(peakStartHour + 2)}`;
        };

      const peakTime = calculatePeakTime(calls);

      // Calculate conversion rate
      const conversionRate = callsTaken > 0 
        ? `${Math.round((bookingsMade / callsTaken) * 100)}%`
        : '0%';

      return {
        callsTaken,
        avgDuration,
        bookingsMade,
        missed,
        informationInquiries,
        conversionRate,
        peakTime,
      };
    };

    // Convert grouped data to nested summary entries
    const summaryEntries: DailySummaryEntry[] = Object.entries(callsByDateAndAgent)
      .map(([dateKey, agentGroups], dateIndex) => {
        const date = new Date(dateKey);
        
        // Create agent-level summaries
        const agentSummaries = Object.entries(agentGroups).map(([agentId, calls], agentIndex) => {
          const firstCall = calls[0];
          const metrics = calculateMetrics(calls);
          
          return {
            id: `${String(dateIndex + 1).padStart(2, '0')}-${String(agentIndex + 1)}`,
            date: dateKey,
            formattedDate: date.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }),
            ...metrics,
            phone_number: firstCall.phone_number,
            agent_id: agentId,
            agent_name: firstCall.agent_name || 'Unknown Agent',
            wants_summary: firstCall.wants_daily_summary,
            isDateSummary: false,
          };
        }).sort((a, b) => a.agent_name!.localeCompare(b.agent_name!));

        // Calculate date-level totals
        const allCallsForDate = Object.values(agentGroups).flat();
        const dateTotals = calculateMetrics(allCallsForDate);

        return {
          id: String(dateIndex + 1).padStart(2, '0'),
          date: dateKey,
          formattedDate: date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          ...dateTotals,
          isDateSummary: true,
          agentSummaries,
        };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setDailySummaryEntries(summaryEntries);
  }, [callLogs]);

  return {
    dailySummaryEntries,
    loading,
    error,
    callLogs,
  };
};