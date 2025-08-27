import { useState } from "react";

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

  // Comprehensive notification data from Dashboard
  const notifications: Notification[] = [
    {
      id: "1",
      type: "system",
      title: "System Alert",
      description: "Your AI agent is currently offline. Please check your connection.",
      time: "2 minutes ago",
      iconType: "warning",
    },
    {
      id: "2", 
      type: "call",
      title: "Call Completed",
      description: "Call with John Doe completed successfully with a booking.",
      time: "5 minutes ago",
      iconType: "success",
    },
    {
      id: "3",
      type: "system", 
      title: "System Maintenance",
      description: "Scheduled maintenance will occur tonight from 12:00 AM to 2:00 AM.",
      time: "1 hour ago",
      iconType: "info",
    },
    {
      id: "4",
      type: "booking",
      title: "New Booking",
      description: "Sarah Johnson booked an appointment for tomorrow at 3:00 PM.",
      time: "2 hours ago", 
      iconType: "success",
    },
    {
      id: "5",
      type: "call",
      title: "Missed Call Alert",
      description: "You have 3 missed calls. Please review and follow up.",
      time: "3 hours ago",
      iconType: "error",
    },
    {
      id: "6",
      type: "analysis",
      title: "Daily Summary Ready",
      description: "Your daily summary for today is now available for review.",
      time: "Today · 5:00 PM",
      iconType: "info",
      actionButton: {
        text: "View Summary",
        action: () => {
          // Navigate to daily summary or open popup
          console.log("Navigate to daily summary");
        },
      },
    },
  ];

  const openNotifications = () => setShowNotifications(true);
  const closeNotifications = () => setShowNotifications(false);

  return {
    notifications,
    showNotifications,
    openNotifications,
    closeNotifications,
    notificationCount: notifications.length,
  };
};