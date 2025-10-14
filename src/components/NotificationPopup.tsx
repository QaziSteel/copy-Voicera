import React from "react";
import { Notification } from "@/hooks/useNotifications";
import { CheckCircle, AlertTriangle, Info, AlertCircle } from "lucide-react";

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
        return <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />;
      case "info":
        return <Info className="w-6 h-6 text-blue-500 flex-shrink-0" />;
      case "warning":
        return <AlertTriangle className="w-6 h-6 text-orange-500 flex-shrink-0" />;
      case "error":
        return <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />;
      default:
        return <Info className="w-6 h-6 text-blue-500 flex-shrink-0" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-20 flex justify-center items-start pt-24 px-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-[650px] overflow-hidden shadow-lg">
        <div className="max-h-[80vh] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-gray-400">
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
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationPopup;