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
}

export interface UseDailySummaryResult {
  dailySummaryEntries: DailySummaryEntry[];
  loading: boolean;
  error: string | null;
}

export const useDailySummary = (dateFilter?: { from?: Date; to?: Date }, filterVersion?: number): UseDailySummaryResult => {
  const { callLogs, loading, error } = useCallLogs('', dateFilter, filterVersion);
  const [dailySummaryEntries, setDailySummaryEntries] = useState<DailySummaryEntry[]>([]);

  useEffect(() => {
    if (!callLogs.length) {
      setDailySummaryEntries([]);
      return;
    }

    // Group calls by date
    const callsByDate = callLogs.reduce((acc, call) => {
      if (!call.started_at) return acc;
      
      const date = new Date(call.started_at);
      const dateKey = date.toDateString(); // e.g., "Mon Jan 08 2025"
      
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(call);
      return acc;
    }, {} as Record<string, CallLogRecord[]>);

    // Convert grouped data to daily summary entries
    const summaryEntries: DailySummaryEntry[] = Object.entries(callsByDate)
      .map(([dateKey, calls], index) => {
        const date = new Date(dateKey);
        const callsTaken = calls.length;
        
        // For now, treat all calls as information inquiries
        const informationInquiries = callsTaken;
        const bookingsMade = 0; // Will be 0 for now as requested
        
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

        return {
          id: String(index + 1).padStart(2, '0'),
          date: dateKey,
          formattedDate: date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          callsTaken,
          avgDuration,
          bookingsMade,
          missed,
          informationInquiries,
        };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Most recent first

    setDailySummaryEntries(summaryEntries);
  }, [callLogs]);

  return {
    dailySummaryEntries,
    loading,
    error,
  };
};