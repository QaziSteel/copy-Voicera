import { useState } from "react";
import { useCallLogsNotifications } from "./useCallLogsNotifications";

export interface Notification {
  id: string;
  type: "system" | "call" | "booking" | "maintenance" | "analysis";
  title: string;
  description: string;
  time: string;
  iconType: "success" | "info" | "warning" | "error";
  timestamp?: number;
  actionButton?: {
    text: string;
    action: () => void;
  };
}

export const useNotifications = () => {
  const [showNotifications, setShowNotifications] = useState(false);
  const { notifications, loading, error, notificationCount, unseenCount, markAsSeen } = useCallLogsNotifications();

  const openNotifications = () => {
    setShowNotifications(true);
    markAsSeen(); // Mark all notifications as seen when opening
  };
  const closeNotifications = () => setShowNotifications(false);

  return {
    notifications,
    showNotifications,
    openNotifications,
    closeNotifications,
    notificationCount,
    unseenCount,
    loading,
    error,
  };
};