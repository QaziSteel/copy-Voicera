import { useMemo, useEffect, useState } from "react";
import { useCallLogs } from "./useCallLogs";
import { format, isToday, isYesterday } from "date-fns";
import type { Notification } from "./useNotifications";

export const useCallLogsNotifications = () => {
  const { callLogs, loading, error } = useCallLogs();
  const [lastSeenTimestamp, setLastSeenTimestamp] = useState<number>(() => {
    const stored = localStorage.getItem('notifications_last_seen');
    return stored ? parseInt(stored, 10) : 0;
  });

  // Update localStorage when lastSeenTimestamp changes
  useEffect(() => {
    if (lastSeenTimestamp > 0) {
      localStorage.setItem('notifications_last_seen', lastSeenTimestamp.toString());
    }
  }, [lastSeenTimestamp]);

  const notifications: Notification[] = useMemo(() => {
    if (!callLogs || callLogs.length === 0) return [];

    // Get the most recent 10 call logs for notifications
    return callLogs
      .slice(0, 10)
      .map((callLog) => {
        const hasBooking = !!callLog.booking_id;
        const startTime = callLog.started_at ? new Date(callLog.started_at) : new Date();
        
        // Format time display
        let timeDisplay = "";
        if (isToday(startTime)) {
          timeDisplay = `Today • ${format(startTime, "h:mm a")}`;
        } else if (isYesterday(startTime)) {
          timeDisplay = `Yesterday • ${format(startTime, "h:mm a")}`;
        } else {
          timeDisplay = format(startTime, "MMM d • h:mm a");
        }

        if (hasBooking) {
          // Booking notification
          return {
            id: callLog.id,
            type: "booking" as const,
            title: "Booking Confirmed",
            description: `Customer booked appointment via ${callLog.customer_number || "phone call"}`,
            time: timeDisplay,
            iconType: "success" as const,
            timestamp: startTime.getTime(),
          };
        } else {
          // Inquiry notification
          return {
            id: callLog.id,
            type: "call" as const,
            title: "New Inquiry Call",
            description: `Call received from ${callLog.customer_number || "unknown number"}`,
            time: timeDisplay,
            iconType: "info" as const,
            timestamp: startTime.getTime(),
          };
        }
      });
  }, [callLogs]);

  const unseenCount = useMemo(() => {
    return notifications.filter(notification => 
      notification.timestamp && notification.timestamp > lastSeenTimestamp
    ).length;
  }, [notifications, lastSeenTimestamp]);

  const markAsSeen = () => {
    setLastSeenTimestamp(Date.now());
  };

  return {
    notifications,
    loading,
    error,
    notificationCount: notifications.length,
    unseenCount,
    markAsSeen,
  };
};