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

  // Realistic notification data matching screenshot
  const notifications: Notification[] = [
    {
      id: "1",
      type: "booking",
      title: "Booking Confirmed",
      description: "Anna Smith booked for Today • 3:00 PM",
      time: "Today • 2:45 PM",
      iconType: "success",
      actionButton: {
        text: "View",
        action: () => {
          console.log("View booking details");
        },
      },
    },
    {
      id: "2", 
      type: "system",
      title: "Syncing Failed",
      description: "Google Calendar sync failed. Please check your connection.",
      time: "Today • 2:30 PM",
      iconType: "error",
      actionButton: {
        text: "Retry",
        action: () => {
          console.log("Retry sync");
        },
      },
    },
    {
      id: "3",
      type: "system", 
      title: "Subscription Activated",
      description: "Voicera AI Basic Plan is now active and ready to use.",
      time: "Today • 1:15 PM",
      iconType: "success",
    },
    {
      id: "4",
      type: "call",
      title: "Transcript Ready",
      description: "New call transcript is available for your review.",
      time: "Today • 12:45 PM", 
      iconType: "info",
      actionButton: {
        text: "View Transcript",
        action: () => {
          console.log("View transcript");
        },
      },
    },
    {
      id: "5",
      type: "analysis",
      title: "AI Performance Insight",
      description: "AI agent answered 95% of client queries correctly today.",
      time: "Today • 11:30 AM",
      iconType: "info",
      actionButton: {
        text: "View Report",
        action: () => {
          console.log("View performance report");
        },
      },
    },
    {
      id: "6",
      type: "booking",
      title: "Booking Cancelled",
      description: "Emma Johnson cancelled her appointment for Today • 5:00 PM.",
      time: "Today • 10:15 AM",
      iconType: "warning",
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