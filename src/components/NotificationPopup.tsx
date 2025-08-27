import React from "react";
import { Notification } from "@/hooks/useNotifications";

interface NotificationPopupProps {
  notifications: Notification[];
  isVisible: boolean;
  onClose: () => void;
  notificationCount: number;
}

const NotificationPopup: React.FC<NotificationPopupProps> = ({
  notifications,
  isVisible,
  onClose,
  notificationCount,
}) => {
  if (!isVisible) return null;

  const getIconComponent = (iconType: Notification["iconType"]) => {
    switch (iconType) {
      case "success":
        return (
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg width="32" height="32" viewBox="0 0 28 28" fill="none">
              <path
                d="M14 0.666992C21.3637 0.666992 27.333 6.6362 27.333 14C27.3329 21.3637 21.3637 27.333 14 27.333C6.63629 27.333 0.667081 21.3636 0.666992 14C0.666992 6.63623 6.63624 0.667036 14 0.666992Z"
                fill="#22C55E"
              />
            </svg>
          </div>
        );
      case "warning":
        return (
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg width="32" height="32" viewBox="0 0 28 28" fill="none">
              <path
                d="M14 0.666992C21.3637 0.666992 27.333 6.6362 27.333 14C27.3329 21.3637 21.3637 27.333 14 27.333C6.63629 27.333 0.667081 21.3636 0.666992 14C0.666992 6.63623 6.63624 0.667036 14 0.666992Z"
                fill="#F59E0B"
              />
            </svg>
          </div>
        );
      case "error":
        return (
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg width="32" height="32" viewBox="0 0 28 28" fill="none">
              <path
                d="M14 0.666992C21.3637 0.666992 27.333 6.6362 27.333 14C27.3329 21.3637 21.3637 27.333 14 27.333C6.63629 27.333 0.667081 21.3636 0.666992 14C0.666992 6.63623 6.63624 0.667036 14 0.666992Z"
                fill="#EF4444"
              />
            </svg>
          </div>
        );
      case "info":
      default:
        return (
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
              <path
                d="M13 0.333984C18.9709 0.333984 21.9565 0.333566 23.8115 2.18848C25.6664 4.04346 25.667 7.02899 25.667 13C25.667 18.9709 25.6663 21.9564 23.8115 23.8115C21.9565 25.6664 18.971 25.667 13 25.667C7.02888 25.667 4.04348 25.6665 2.18848 23.8115C0.333558 21.9565 0.333008 18.971 0.333008 13C0.333008 7.02899 0.333507 4.04346 2.18848 2.18848C4.04349 0.333612 7.02901 0.333984 13 0.333984Z"
                fill="#007AFF"
              />
            </svg>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-20 flex justify-center items-start pt-24 px-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-[650px] max-h-[80vh] overflow-y-auto scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-300 scrollbar-thumb-rounded-full shadow-lg">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-200">
          <h3 className="text-xl font-medium text-gray-600">
            Notifications <span className="text-gray-500">({notificationCount})</span>
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M13.3337 2.6665L2.66699 13.3332"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2.66699 2.6665L13.3337 13.3332"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Notifications */}
        <div className="p-5 space-y-4">
          {notifications.map((notification, index) => (
            <div
              key={notification.id}
              className={`flex items-start gap-4 ${
                index < notifications.length - 1 ? "pb-4 border-b border-gray-200" : ""
              }`}
            >
              {getIconComponent(notification.iconType)}
              <div className="flex-1">
                <p className="text-xl text-black">
                  {notification.title} ·{" "}
                  <span className="text-gray-500">{notification.description}</span>
                </p>
                <p className="text-gray-500 text-sm mt-2">{notification.time}</p>
                
                {notification.actionButton && (
                  <button
                    onClick={notification.actionButton.action}
                    className="bg-black text-white px-5 py-2 rounded-lg text-xs font-semibold mt-3"
                  >
                    {notification.actionButton.text}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NotificationPopup;