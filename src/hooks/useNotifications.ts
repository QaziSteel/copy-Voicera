import { useState } from "react";
import { useCallLogsNotifications } from "./useCallLogsNotifications";

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
  const { notifications, loading, error, notificationCount } = useCallLogsNotifications();

  const openNotifications = () => setShowNotifications(true);
  const closeNotifications = () => setShowNotifications(false);

  return {
    notifications,
    showNotifications,
    openNotifications,
    closeNotifications,
    notificationCount,
    loading,
    error,
  };
};