import { useState } from "react";
import { useCallLogsNotifications } from "./useCallLogsNotifications";
import { notificationStorage } from "@/lib/notificationStorage";

export interface Notification {
  id: string;
  type: "system" | "call" | "booking" | "maintenance" | "analysis";
  title: string;
  description: string;
  time: string;
  iconType: "success" | "info" | "warning" | "error";
  actionButton?: {
    text: string;
    action: () => void;
  };
}

export const useNotifications = () => {
  const [showNotifications, setShowNotifications] = useState(false);
  const { notifications, loading, error, notificationCount, unreadCount } = useCallLogsNotifications();

  const openNotifications = () => {
    // Mark all current notifications as read when opening the popup
    if (notifications.length > 0) {
      const notificationIds = notifications.map(n => n.id);
      notificationStorage.markAsRead(notificationIds);
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