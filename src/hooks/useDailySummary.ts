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
          conversionRate,
          peakTime,
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