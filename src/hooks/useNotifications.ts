import { useState } from "react";
import { useCallLogsNotifications } from "./useCallLogsNotifications";
import { notificationStorage } from "@/lib/notificationStorage";

export interface Notification {
  id: string;
  type: "system" | "call" | "booking" | "maintenance" | "analysis" | "dropped";
  title: string;
  description: string;
  time: string;
  iconType: "success" | "info" | "warning" | "error" | "dropped";
  actionButton?: {
    text: string;
    action: () => void;
  };
}

export const useNotifications = () => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [readTrigger, setReadTrigger] = useState(0);
  const { notifications, loading, error, notificationCount, unreadCount } = useCallLogsNotifications(readTrigger);

  const openNotifications = () => {
    // Mark all current notifications as read when opening the popup
    if (notifications.length > 0) {
      const notificationIds = notifications.map(n => n.id);
      notificationStorage.markAsRead(notificationIds);
      setReadTrigger(prev => prev + 1); // Force re-calculation of unread count
    }
    setShowNotifications(true);
  };

  const closeNotifications = () => setShowNotifications(false);

  return {
    notifications,
    showNotifications,
    openNotifications,
    closeNotifications,
    notificationCount,
    unreadCount,
    loading,
    error,
  };
};