import { useMemo } from "react";
import { useCallLogs } from "./useCallLogs";
import { useProject } from "@/contexts/ProjectContext";
import { format, isToday, isYesterday } from "date-fns";
import { maskPhoneNumber } from "@/lib/customerDataMasking";
import { notificationStorage } from "@/lib/notificationStorage";
import type { Notification } from "./useNotifications";

export const useCallLogsNotifications = (readTrigger?: number) => {
  const { callLogs, loading, error } = useCallLogs();
  const { canViewCustomerData } = useProject();

  const notifications: Notification[] = useMemo(() => {
    if (!callLogs || callLogs.length === 0) return [];

    const canView = canViewCustomerData();

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

        // Mask customer number if user doesn't have permission
        const displayNumber = callLog.customer_number 
          ? (canView ? callLog.customer_number : maskPhoneNumber(callLog.customer_number))
          : "unknown number";

        if (hasBooking) {
          // Booking notification
          return {
            id: callLog.id,
            type: "booking" as const,
            title: "Booking Confirmed",
            description: `Customer booked appointment via ${displayNumber}`,
            time: timeDisplay,
            iconType: "success" as const,
          };
        } else {
          // Inquiry notification
          return {
            id: callLog.id,
            type: "call" as const,
            title: "New Inquiry Call",
            description: `Call received from ${displayNumber}`,
            time: timeDisplay,
            iconType: "info" as const,
          };
        }
      });
  }, [callLogs, canViewCustomerData]);

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !notificationStorage.isRead(n.id)).length;
  }, [notifications, readTrigger]);

  return {
    notifications,
    loading,
    error,
    notificationCount: notifications.length,
    unreadCount,
  };
};