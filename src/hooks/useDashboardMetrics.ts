import { useState, useEffect } from 'react';
import { useCallLogs, CallLogRecord } from './useCallLogs';

export interface DashboardMetrics {
  totalCalls: number;
  totalBookings: number;
  conversionRate: number;
  averageCallDuration: string;
  informationInquiries: number;
  successfulBookings: number;
  droppedMissed: number;
}

export interface UseDashboardMetricsResult {
  metrics: DashboardMetrics;
  loading: boolean;
  error: string | null;
}

export const useDashboardMetrics = (dateFilter?: { from?: Date; to?: Date }, filterVersion?: number): UseDashboardMetricsResult => {
  const { callLogs, loading, error } = useCallLogs('', dateFilter, filterVersion);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalCalls: 0,
    totalBookings: 0,
    conversionRate: 0,
    averageCallDuration: '0s',
    informationInquiries: 0,
    successfulBookings: 0,
    droppedMissed: 0,
  });

  useEffect(() => {
    if (!callLogs.length) {
      setMetrics({
        totalCalls: 0,
        totalBookings: 0,
        conversionRate: 0,
        averageCallDuration: '0s',
        informationInquiries: 0,
        successfulBookings: 0,
        droppedMissed: 0,
      });
      return;
    }

    // Calculate metrics from call logs
    const totalCalls = callLogs.length;
    
    // Successful bookings: calls that have a booking_id
    const successfulBookings = callLogs.filter(call => call.booking_id !== null).length;
    const totalBookings = successfulBookings;
    
    // Information inquiries: calls without bookings that weren't dropped/missed
    const informationInquiries = callLogs.filter(call => 
      call.booking_id === null && 
      call.total_call_time && 
      call.total_call_time >= 10
    ).length;
    
    // Calculate dropped/missed calls (calls with very short duration or specific end reasons)
    const droppedMissed = callLogs.filter(call => 
      !call.total_call_time || 
      call.total_call_time < 10 || 
      call.ended_reason === 'dropped' ||
      call.ended_reason === 'missed'
    ).length;

    // Calculate average call duration
    const validDurations = callLogs
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

    const averageCallDuration = formatDuration(averageDurationSeconds);
    
    // Calculate conversion rate (bookings / total calls * 100)
    const conversionRate = totalCalls > 0 ? (totalBookings / totalCalls) * 100 : 0;

    setMetrics({
      totalCalls,
      totalBookings,
      conversionRate,
      averageCallDuration,
      informationInquiries,
      successfulBookings,
      droppedMissed,
    });
  }, [callLogs]);

  return {
    metrics,
    loading,
    error,
  };
};