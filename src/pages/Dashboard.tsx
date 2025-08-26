import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface Call {
  id: string;
  time: string;
  status: "booked" | "dropped" | "inquiry";
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("today");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Mock data - in a real app this would come from an API
  // Start with sample data to show the normal dashboard state
  const [calls, setCalls] = useState<Call[]>([
    { id: "1000", time: "16:54:03", status: "booked" },
    { id: "1001", time: "16:55:10", status: "dropped" },
    { id: "1002", time: "16:56:45", status: "inquiry" },
    { id: "1003", time: "16:57:30", status: "booked" },
    { id: "1004", time: "16:58:15", status: "inquiry" },
    { id: "1005", time: "16:55:10", status: "dropped" },
    { id: "1006", time: "16:57:30", status: "booked" },
    { id: "1007", time: "16:58:15", status: "inquiry" },
  ]);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "booked":
        return "bg-black text-white";
      case "dropped":
        return "bg-red-500 text-white";
      case "inquiry":
        return "bg-gray-200 text-black";
      default:
        return "bg-gray-200 text-black";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "booked":
        return "Booked";
      case "dropped":
        return "Dropped";
      case "inquiry":
        return "Inquiry";
      default:
        return "Unknown";
    }
  };

  const renderNotificationsPopup = () => (
    <div className="fixed inset-0 bg-black bg-opacity-20 flex justify-center items-start pt-24 px-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-[650px] max-h-[936px] overflow-y-auto shadow-lg">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-200">
          <h3 className="text-xl font-medium text-gray-600">
            Notifications <span className="text-gray-500">(6)</span>
          </h3>
          <button
            onClick={() => setShowNotifications(false)}
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
          {/* Booking Confirmed */}
          <div className="flex items-start gap-4 pb-4 border-b border-gray-200">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg width="32" height="32" viewBox="0 0 28 28" fill="none">
                <path
                  d="M14 0.666992C21.3637 0.666992 27.333 6.6362 27.333 14C27.3329 21.3637 21.3637 27.333 14 27.333C6.63629 27.333 0.667081 21.3636 0.666992 14C0.666992 6.63623 6.63624 0.667036 14 0.666992ZM19.9912 8.30762C19.7925 7.9442 19.3371 7.81004 18.9736 8.00879C16.6688 9.26925 14.7179 11.738 13.3721 13.7988C12.6901 14.8432 12.145 15.8121 11.7705 16.5195C11.7613 16.5368 11.7521 16.5543 11.7432 16.5713C11.2772 16.038 10.769 15.5887 10.332 15.2432C9.97818 14.9634 9.65911 14.7424 9.42773 14.5908C9.31213 14.5151 9.21724 14.4557 9.15039 14.415C9.11725 14.3949 9.09014 14.3793 9.07129 14.3682C9.06211 14.3628 9.0543 14.3577 9.04883 14.3545C9.04639 14.3531 9.04366 14.3515 9.04199 14.3506L9.04004 14.3496H9.03906V14.3486H9.03809C8.67834 14.1438 8.22075 14.2692 8.01562 14.6289C7.81078 14.9885 7.93566 15.4461 8.29492 15.6514L8.29688 15.6533C8.29954 15.6548 8.30449 15.6576 8.31055 15.6611C8.32343 15.6687 8.34442 15.681 8.37109 15.6973C8.42501 15.7301 8.50612 15.78 8.60645 15.8457C8.80823 15.9779 9.08927 16.1732 9.40137 16.4199C10.0361 16.9218 10.7574 17.6062 11.2236 18.3857C11.3668 18.6243 11.6304 18.7643 11.9082 18.749C12.1862 18.7336 12.433 18.5647 12.5488 18.3115C12.549 18.3111 12.5502 18.3105 12.5508 18.3096C12.552 18.3069 12.554 18.3017 12.5566 18.2959C12.5622 18.284 12.5706 18.2654 12.582 18.2412C12.6051 18.1924 12.6403 18.119 12.6865 18.0244C12.7792 17.8349 12.9176 17.5591 13.0967 17.2207C13.4554 16.543 13.977 15.6159 14.6279 14.6191C15.9487 12.5967 17.7316 10.3981 19.6934 9.3252C20.0566 9.12657 20.1894 8.67093 19.9912 8.30762Z"
                  fill="#22C55E"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-xl text-black">
                Booking Confirmed ·{" "}
                <span className="text-gray-500">
                  Anna Smith booked for 3:00 PM.
                </span>
              </p>
              <p className="text-gray-500 text-sm mt-2">Today · 2:45 PM</p>
              <button className="bg-black text-white px-5 py-2 rounded-lg text-xs font-semibold mt-3">
                View
              </button>
            </div>
          </div>

          {/* Syncing Failed */}
          <div className="flex items-start gap-4 pb-4 border-b border-gray-200">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg width="32" height="24" viewBox="0 0 28 24" fill="none">
                <path
                  d="M14.0005 0C16.2495 0.000268468 17.7662 2.5572 20.7993 7.6709L23.3657 11.998C26.5235 17.3219 28.1029 19.9842 26.9653 21.9922C25.8277 24.0002 22.7404 24 16.5669 24H11.4341C5.26057 24 2.17341 23.9999 1.03564 21.9922C-0.101934 19.9842 1.47648 17.3218 4.63428 11.998L7.20068 7.6709C10.234 2.55687 11.7513 0 14.0005 0ZM14.0005 11.7666C13.5034 11.7666 13.1001 12.1699 13.1001 12.667V18.667C13.1003 19.1639 13.5035 19.5664 14.0005 19.5664C14.4972 19.5662 14.9007 19.1638 14.9009 18.667V12.667C14.9009 12.1701 14.4973 11.7668 14.0005 11.7666ZM14.0005 7.08398C13.5034 7.08398 13.1001 7.48732 13.1001 7.98438V7.99805C13.1003 8.49495 13.5035 8.89746 14.0005 8.89746C14.4972 8.89722 14.9007 8.4948 14.9009 7.99805V7.98438C14.9009 7.48747 14.4973 7.08422 14.0005 7.08398Z"
                  fill="#EF4444"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-xl text-black">
                Syncing Failed ·{" "}
                <span className="text-gray-500">
                  Google Calendar sync failed Please reconnect your calendar.
                </span>
              </p>
              <p className="text-gray-500 text-sm mt-2">Today · 2:50 PM</p>
              <button className="bg-black text-white px-5 py-2 rounded-lg text-xs font-semibold mt-3">
                Retry
              </button>
            </div>
          </div>

          {/* Subscription Activated */}
          <div className="flex items-start gap-4 pb-4 border-b border-gray-200">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg width="32" height="32" viewBox="0 0 28 28" fill="none">
                <path
                  d="M14 0.666016C21.3637 0.666016 27.333 6.6362 27.333 14C27.3329 21.3637 21.3637 27.333 14 27.333C6.63629 27.333 0.667081 21.3636 0.666992 14C0.666992 6.63623 6.63624 0.666059 14 0.666016ZM19.9912 8.30762C19.7925 7.9442 19.3371 7.81004 18.9736 8.00879C16.6688 9.26925 14.7179 11.738 13.3721 13.7988C12.6901 14.8432 12.145 15.8121 11.7705 16.5195C11.7613 16.5368 11.7521 16.5543 11.7432 16.5713C11.2772 16.038 10.769 15.5887 10.332 15.2432C9.97818 14.9634 9.65911 14.7424 9.42773 14.5908C9.31213 14.5151 9.21724 14.4557 9.15039 14.415C9.11725 14.3949 9.09014 14.3793 9.07129 14.3682C9.06211 14.3628 9.0543 14.3577 9.04883 14.3545C9.04639 14.3531 9.04366 14.3515 9.04199 14.3506L9.04004 14.3496H9.03906V14.3486H9.03809C8.67834 14.1438 8.22075 14.2692 8.01562 14.6289C7.81078 14.9885 7.93566 15.4461 8.29492 15.6514L8.29688 15.6533C8.29954 15.6548 8.30449 15.6576 8.31055 15.6611C8.32343 15.6687 8.34442 15.681 8.37109 15.6973C8.42501 15.7301 8.50612 15.78 8.60645 15.8457C8.80823 15.9779 9.08927 16.1732 9.40137 16.4199C10.0361 16.9218 10.7574 17.6062 11.2236 18.3857C11.3668 18.6243 11.6304 18.7643 11.9082 18.749C12.1862 18.7336 12.433 18.5647 12.5488 18.3115C12.549 18.3111 12.5502 18.3105 12.5508 18.3096C12.552 18.3069 12.554 18.3017 12.5566 18.2959C12.5622 18.284 12.5706 18.2654 12.582 18.2412C12.6051 18.1924 12.6403 18.119 12.6865 18.0244C12.7792 17.8349 12.9176 17.5591 13.0967 17.2207C13.4554 16.543 13.977 15.6159 14.6279 14.6191C15.9487 12.5967 17.7316 10.3981 19.6934 9.3252C20.0566 9.12657 20.1894 8.67093 19.9912 8.30762Z"
                  fill="#22C55E"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-xl text-black">
                Subscription Activated ·{" "}
                <span className="text-gray-500">
                  Your Voicera AI Basic Plan is now active. You can manage your
                  billing in account settings.
                </span>
              </p>
              <p className="text-gray-500 text-sm mt-2">Today · 2:45 PM</p>
            </div>
          </div>

          {/* Transcript */}
          <div className="flex items-start gap-4 pb-4 border-b border-gray-200">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
              <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                <path
                  d="M13 0.333984C18.9709 0.333984 21.9565 0.333566 23.8115 2.18848C25.6664 4.04346 25.667 7.02899 25.667 13C25.667 18.9709 25.6663 21.9564 23.8115 23.8115C21.9565 25.6664 18.971 25.667 13 25.667C7.02888 25.667 4.04348 25.6665 2.18848 23.8115C0.333558 21.9565 0.333008 18.971 0.333008 13C0.333008 7.02899 0.333507 4.04346 2.18848 2.18848C4.04349 0.333612 7.02901 0.333984 13 0.333984ZM13 11.584C12.5858 11.584 12.25 11.9198 12.25 12.334V18.334C12.2503 18.748 12.5859 19.084 13 19.084C13.4141 19.084 13.7497 18.748 13.75 18.334V12.334C13.75 11.9198 13.4142 11.584 13 11.584ZM13 6.76855C12.5029 6.76855 12.0996 7.17189 12.0996 7.66895V7.68262C12.0998 8.17952 12.5031 8.58203 13 8.58203C13.4969 8.58203 13.9002 8.17952 13.9004 7.68262V7.66895C13.9004 7.17189 13.4971 6.76855 13 6.76855Z"
                  fill="#007AFF"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-xl text-black">
                Transcript ·{" "}
                <span className="text-gray-500">
                  New call transcript available Caller: 0207 123 4567
                </span>
              </p>
              <p className="text-gray-500 text-sm mt-2">Today · 2:55 PM</p>
              <button className="bg-black text-white px-5 py-2 rounded-lg text-xs font-semibold mt-3">
                View Transcript
              </button>
            </div>
          </div>

          {/* AI Performance Insight */}
          <div className="flex items-start gap-4 pb-4 border-b border-gray-200">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
              <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                <path
                  d="M13 0.333984C18.9709 0.333984 21.9565 0.333566 23.8115 2.18848C25.6664 4.04346 25.667 7.02899 25.667 13C25.667 18.9709 25.6663 21.9564 23.8115 23.8115C21.9565 25.6664 18.971 25.667 13 25.667C7.02888 25.667 4.04348 25.6665 2.18848 23.8115C0.333558 21.9565 0.333008 18.971 0.333008 13C0.333008 7.02899 0.333507 4.04346 2.18848 2.18848C4.04349 0.333612 7.02901 0.333984 13 0.333984ZM13 11.584C12.5858 11.584 12.25 11.9198 12.25 12.334V18.334C12.2503 18.748 12.5859 19.084 13 19.084C13.4141 19.084 13.7497 18.748 13.75 18.334V12.334C13.75 11.9198 13.4142 11.584 13 11.584ZM13 6.76855C12.5029 6.76855 12.0996 7.17189 12.0996 7.66895V7.68262C12.0998 8.17952 12.5031 8.58203 13 8.58203C13.4969 8.58203 13.9002 8.17952 13.9004 7.68262V7.66895C13.9004 7.17189 13.4971 6.76855 13 6.76855Z"
                  fill="#007AFF"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-xl text-black">
                AI Performance Insight ·{" "}
                <span className="text-gray-500">
                  Your AI agent answered 95% of client queries correctly this
                  week.
                </span>
              </p>
              <p className="text-gray-500 text-sm mt-2">Today · 2:55 PM</p>
              <button className="bg-black text-white px-5 py-2 rounded-lg text-xs font-semibold mt-3">
                View Report
              </button>
            </div>
          </div>

          {/* Booking Cancelled */}
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg width="32" height="24" viewBox="0 0 28 24" fill="none">
                <path
                  d="M14 0C16.2492 0 17.7656 2.55704 20.7988 7.6709L23.3662 11.998C26.5239 17.3218 28.1024 19.9842 26.9648 21.9922C25.8271 24.0001 22.74 24 16.5664 24H11.4336C5.25994 24 2.17285 24.0001 1.03516 21.9922C-0.10243 19.9842 1.47693 17.3219 4.63477 11.998L7.20117 7.6709C10.2344 2.55707 11.7509 1.95237e-05 14 0ZM14 11.7666C13.5029 11.7666 13.0996 12.1699 13.0996 12.667V18.667C13.0998 19.1639 13.5031 19.5664 14 19.5664C14.4969 19.5664 14.9002 19.1639 14.9004 18.667V12.667C14.9004 12.17 14.497 11.7666 14 11.7666ZM14 7.08398C13.5029 7.08398 13.0996 7.48732 13.0996 7.98438V7.99805C13.0998 8.49495 13.5031 8.89746 14 8.89746C14.4969 8.89743 14.9002 8.49493 14.9004 7.99805V7.98438C14.9004 7.48734 14.497 7.08402 14 7.08398Z"
                  fill="#EF4444"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-xl text-black">
                Booking Cancelled ·{" "}
                <span className="text-gray-500">
                  Emma Johnson cancelled her 5:00 PM appointment for today.
                </span>
              </p>
              <p className="text-gray-500 text-sm mt-2">Today · 2:50 PM</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDateFilterPopup = () => (
    <div className="fixed inset-0 bg-black bg-opacity-20 flex justify-center items-start pt-32 px-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-[500px] shadow-lg">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-200">
          <h3 className="text-xl font-medium text-gray-800">Filter</h3>
          <button
            onClick={() => setShowDateFilter(false)}
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

        {/* Filter Options */}
        <div className="p-5 space-y-6">
          {/* Today */}
          <div className="flex items-center gap-4">
            <div
              className={`w-4 h-4 rounded-full border-2 cursor-pointer ${
                selectedFilter === "today"
                  ? "border-black bg-black"
                  : "border-gray-400"
              }`}
              onClick={() => setSelectedFilter("today")}
            />
            <span className="text-gray-600">Today</span>
          </div>

          {/* 30 days ago */}
          <div className="flex items-center gap-4">
            <div
              className={`w-4 h-4 rounded-full border-2 cursor-pointer ${
                selectedFilter === "30days"
                  ? "border-black bg-black"
                  : "border-gray-400"
              }`}
              onClick={() => setSelectedFilter("30days")}
            />
            <span className="text-gray-600">30 days ago</span>
          </div>

          {/* Custom */}
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div
                className={`w-4 h-4 rounded-full border-2 cursor-pointer ${
                  selectedFilter === "custom"
                    ? "border-black bg-black"
                    : "border-gray-400"
                }`}
                onClick={() => setSelectedFilter("custom")}
              />
              <span className="text-gray-600">Custom</span>
            </div>

            {/* Date inputs */}
            <div className="flex gap-3 ml-8">
              <div className="flex-1">
                <label className="block text-sm text-gray-600 mb-2">From</label>
                <input
                  type="text"
                  placeholder="Enter the start date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg text-xs text-gray-500 placeholder-gray-400"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm text-gray-600 mb-2">To</label>
                <input
                  type="text"
                  placeholder="Enter the end date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg text-xs text-gray-500 placeholder-gray-400"
                />
              </div>
            </div>
          </div>

          {/* Apply button */}
          <button
            onClick={() => setShowDateFilter(false)}
            className="w-full bg-black text-white py-3 rounded-lg text-sm font-semibold"
          >
            Apply filter
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 md:px-8 lg:px-16 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-black">Voicera AI</h1>

          <div className="flex items-center gap-8">
            {/* Agent Live */}
            <button
              onClick={() => navigate("/agent-management")}
              className="flex items-center gap-3 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M19 16V14C19 11.1716 19 9.75736 18.1213 8.87868C17.2426 8 15.8284 8 13 8H11C8.17157 8 6.75736 8 5.87868 8.87868C5 9.75736 5 11.1716 5 14V16C5 18.8284 5 20.2426 5.87868 21.1213C6.75736 22 8.17157 22 11 22H13C15.8284 22 17.2426 22 18.1213 21.1213C19 20.2426 19 18.8284 19 16Z"
                  stroke="#141B34"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <path
                  d="M19 18C20.4142 18 21.1213 18 21.5607 17.5607C22 17.1213 22 16.4142 22 15C22 13.5858 22 12.8787 21.5607 12.4393C21.1213 12 20.4142 12 19 12"
                  stroke="#141B34"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <path
                  d="M5 18C3.58579 18 2.87868 18 2.43934 17.5607C2 17.1213 2 16.4142 2 15C2 13.5858 2 12.8787 2.43934 12.4393C2.87868 12 3.58579 12 5 12"
                  stroke="#141B34"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <path
                  d="M13.5 3.5C13.5 4.32843 12.8284 5 12 5C11.1716 5 10.5 4.32843 10.5 3.5C10.5 2.67157 11.1716 2 12 2C12.8284 2 13.5 2.67157 13.5 3.5Z"
                  stroke="#141B34"
                  strokeWidth="1.5"
                />
                <path
                  d="M12 5V8"
                  stroke="#141B34"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M9 13V14"
                  stroke="#141B34"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M15 13V14"
                  stroke="#141B34"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M10 17.5C10 17.5 10.6667 18 12 18C13.3333 18 14 17.5 14 17.5"
                  stroke="#141B34"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              <span className="text-lg font-semibold text-black">
                Agent Live
              </span>
            </button>

            {/* Notification Bell */}
            <button
              onClick={() => setShowNotifications(true)}
              className="relative"
            >
              <svg width="29" height="33" viewBox="0 0 29 33" fill="none">
                <path
                  d="M15.5 27C15.5 28.933 13.933 30.5 12 30.5C10.067 30.5 8.5 28.933 8.5 27"
                  stroke="#141B34"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M19.2311 27H4.76887C3.79195 27 3 26.208 3 25.2311C3 24.762 3.18636 24.3121 3.51809 23.9803L4.12132 23.3771C4.68393 22.8145 5 22.0514 5 21.2558V18.5C5 14.634 8.13401 11.5 12 11.5C15.866 11.5 19 14.634 19 18.5V21.2558C19 22.0514 19.3161 22.8145 19.8787 23.3771L20.4819 23.9803C20.8136 24.3121 21 24.762 21 25.2311C21 26.208 20.208 27 19.2311 27Z"
                  stroke="#141B34"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="24.5" cy="4" r="4" fill="#EF4444" />
              </svg>
            </button>

            {/* User Avatar */}
            <div className="flex items-center gap-5">
              <button
                onClick={() => navigate("/profile")}
                className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                title="Profile"
              >
                <span className="text-lg font-semibold text-gray-800">
                  {user?.email?.[0]?.toUpperCase() || "U"}
                </span>
              </button>
              <button onClick={signOut} className="hover:opacity-70">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M18 9.00005C18 9.00005 13.5811 15 12 15C10.4188 15 6 9 6 9"
                    stroke="#141B34"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-center mt-4">
          <div className="bg-gray-100 rounded-full p-2 flex items-center gap-3">
            <div className="bg-white px-4 py-2 rounded-full shadow-sm">
              <span className="text-lg font-semibold text-black">
                Dashboard
              </span>
            </div>
            <button
              onClick={() => navigate("/call-logs")}
              className="px-4 py-2 hover:bg-gray-200 rounded-full transition-colors"
            >
              <span className="text-lg font-semibold text-gray-500">
                Call Logs
              </span>
            </button>
            <button
              onClick={() => navigate("/daily-summary")}
              className="px-4 py-2 hover:bg-gray-200 rounded-full transition-colors"
            >
              <span className="text-lg font-semibold text-gray-500">
                Daily Summary
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 md:px-8 lg:px-16 py-8">
        {/* Dashboard Header */}
        <div className="flex justify-between items-end mb-6">
          <div>
            <h1 className="text-3xl font-semibold text-black mb-1">
              Dashboard
            </h1>
            <p className="text-xl font-semibold text-gray-500">
              Monitor your AI agent performance and call analytics
            </p>
          </div>

          <div className="flex gap-3">
            {/* Today Button */}
            <button
              onClick={() => setShowDateFilter(true)}
              className="bg-black text-white px-4 py-3 rounded-lg flex items-center gap-2"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <g clipPath="url(#clip0_195_35)">
                  <path
                    d="M19.5 3.75H4.5C4.08579 3.75 3.75 4.08579 3.75 4.5V19.5C3.75 19.9142 4.08579 20.25 4.5 20.25H19.5C19.9142 20.25 20.25 19.9142 20.25 19.5V4.5C20.25 4.08579 19.9142 3.75 19.5 3.75Z"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M16.5 2.25V5.25"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M7.5 2.25V5.25"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M3.75 8.25H20.25"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 13.5C12.6213 13.5 13.125 12.9963 13.125 12.375C13.125 11.7537 12.6213 11.25 12 11.25C11.3787 11.25 10.875 11.7537 10.875 12.375C10.875 12.9963 11.3787 13.5 12 13.5Z"
                    fill="white"
                  />
                  <path
                    d="M16.125 13.5C16.7463 13.5 17.25 12.9963 17.25 12.375C17.25 11.7537 16.7463 11.25 16.125 11.25C15.5037 11.25 15 11.7537 15 12.375C15 12.9963 15.5037 13.5 16.125 13.5Z"
                    fill="white"
                  />
                  <path
                    d="M7.875 17.25C8.49632 17.25 9 16.7463 9 16.125C9 15.5037 8.49632 15 7.875 15C7.25368 15 6.75 15.5037 6.75 16.125C6.75 16.7463 7.25368 17.25 7.875 17.25Z"
                    fill="white"
                  />
                  <path
                    d="M12 17.25C12.6213 17.25 13.125 16.7463 13.125 16.125C13.125 15.5037 12.6213 15 12 15C11.3787 15 10.875 15.5037 10.875 16.125C10.875 16.7463 11.3787 17.25 12 17.25Z"
                    fill="white"
                  />
                  <path
                    d="M16.125 17.25C16.7463 17.25 17.25 16.7463 17.25 16.125C17.25 15.5037 16.7463 15 16.125 15C15.5037 15 15 15.5037 15 16.125C15 16.7463 15.5037 17.25 16.125 17.25Z"
                    fill="white"
                  />
                </g>
                <defs>
                  <clipPath id="clip0_195_35">
                    <rect width="24" height="24" fill="white" />
                  </clipPath>
                </defs>
              </svg>
              <span className="text-base font-medium">Today</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Column */}
          <div className="flex-1 space-y-6">
            {/* Metrics Cards */}
            <div className="grid grid-cols-2 gap-5">
              {/* Total Calls */}
              <div className="bg-white rounded-2xl p-5">
                <div className="flex justify-between items-center mb-9">
                  <h3 className="text-lg font-semibold text-black">
                    Total Calls
                  </h3>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M9.1585 5.71223L8.75584 4.80625C8.49256 4.21388 8.36092 3.91768 8.16405 3.69101C7.91732 3.40694 7.59571 3.19794 7.23592 3.08785C6.94883 3 6.6247 3 5.97645 3C5.02815 3 4.554 3 4.15597 3.18229C3.68711 3.39702 3.26368 3.86328 3.09497 4.3506C2.95175 4.76429 2.99278 5.18943 3.07482 6.0397C3.94815 15.0902 8.91006 20.0521 17.9605 20.9254C18.8108 21.0075 19.236 21.0485 19.6496 20.9053C20.137 20.7366 20.6032 20.3131 20.818 19.8443C21.0002 19.4462 21.0002 18.9721 21.0002 18.0238C21.0002 17.3755 21.0002 17.0514 20.9124 16.7643C20.8023 16.4045 20.5933 16.0829 20.3092 15.8362C20.0826 15.6393 19.7864 15.5077 19.194 15.2444L18.288 14.8417C17.6465 14.5566 17.3257 14.4141 16.9998 14.3831C16.6878 14.3534 16.3733 14.3972 16.0813 14.5109C15.7762 14.6297 15.5066 14.8544 14.9672 15.3038C14.4304 15.7512 14.162 15.9749 13.834 16.0947C13.5432 16.2009 13.1588 16.2403 12.8526 16.1951C12.5071 16.1442 12.2426 16.0029 11.7135 15.7201C10.0675 14.8405 9.15977 13.9328 8.28011 12.2867C7.99738 11.7577 7.85602 11.4931 7.80511 11.1477C7.75998 10.8414 7.79932 10.457 7.90554 10.1663C8.02536 9.83828 8.24905 9.56986 8.69643 9.033C9.14586 8.49368 9.37058 8.22402 9.48939 7.91891C9.60309 7.62694 9.64686 7.3124 9.61719 7.00048C9.58618 6.67452 9.44362 6.35376 9.1585 5.71223Z"
                      stroke="#6B7280"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <div>
                  <div className="text-3xl font-semibold text-black mb-2">
                    {calls.length}
                  </div>
                  <div className="text-gray-500">
                    {calls.length} calls today
                  </div>
                </div>
              </div>

              {/* Total Bookings */}
              <div className="bg-white rounded-2xl p-5">
                <div className="flex justify-between items-center mb-9">
                  <h3 className="text-lg font-semibold text-black">
                    Total Bookings
                  </h3>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M16 2V6M8 2V6"
                      stroke="#6B7280"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M13 4H11C7.22876 4 5.34315 4 4.17157 5.17157C3 6.34315 3 8.22876 3 12V14C3 17.7712 3 19.6569 4.17157 20.8284C5.34315 22 7.22876 22 11 22H13C16.7712 22 18.6569 22 19.8284 20.8284C21 19.6569 21 17.7712 21 14V12C21 8.22876 21 6.34315 19.8284 5.17157C18.6569 4 16.7712 4 13 4Z"
                      stroke="#6B7280"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M3 10H21"
                      stroke="#6B7280"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div>
                  <div className="text-3xl font-semibold text-black mb-2">
                    {calls.filter((call) => call.status === "booked").length}
                  </div>
                  <div className="text-gray-500">Appointments Scheduled</div>
                </div>
              </div>

              {/* Conversion Rate */}
              <div className="bg-white rounded-2xl p-5">
                <div className="flex justify-between items-center mb-9">
                  <h3 className="text-lg font-semibold text-black">
                    Conversion Rate
                  </h3>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M18.7781 9.12121L13.1212 14.7781L10.4999 11.9998L6.49993 15.5M18.7781 9.12121C19.0257 11.8436 19.1318 13.0103 19.1318 13.0103M18.7781 9.12121C16.4447 8.90915 14.8891 8.7677 14.8891 8.7677"
                      stroke="#6B7280"
                      strokeLinecap="square"
                    />
                  </svg>
                </div>
                <div>
                  <div className="text-3xl font-semibold text-black mb-2">
                    0.0%
                  </div>
                  <div className="text-gray-500">Calls to bookings</div>
                </div>
              </div>

              {/* Avg Call Duration */}
              <div className="bg-white rounded-2xl p-5">
                <div className="flex justify-between items-center mb-9">
                  <h3 className="text-lg font-semibold text-black">
                    Avg Call Duration
                  </h3>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                      stroke="#6B7280"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M12 8V12L14 14"
                      stroke="#6B7280"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div>
                  <div className="text-3xl font-semibold text-black mb-2">
                    0s
                  </div>
                  <div className="text-gray-500">Avg Call Duration</div>
                </div>
              </div>
            </div>

            {/* Call Outcomes */}
            <div className="bg-white rounded-2xl p-5">
              <div className="mb-5">
                <h3 className="text-xl font-semibold text-black mb-1">
                  Call Outcomes
                </h3>
                <p className="text-lg font-semibold text-gray-500">
                  Distribution of call results
                </p>
              </div>

              {(() => {
                const successfulBookings = calls.filter(
                  (call) => call.status === "booked",
                ).length;
                const informationInquiries = calls.filter(
                  (call) => call.status === "inquiry",
                ).length;
                const droppedMissed = calls.filter(
                  (call) => call.status === "dropped",
                ).length;
                const unsuccessful = 1; // Static for now

                return (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-1">
                      <div className="flex items-center gap-3">
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 20 20"
                          fill="none"
                        >
                          <path
                            d="M14.1667 2.78135C12.9409 2.07231 11.5178 1.6665 10 1.6665C5.39762 1.6665 1.66666 5.39746 1.66666 9.99984C1.66666 14.6022 5.39762 18.3332 10 18.3332C14.6023 18.3332 18.3333 14.6022 18.3333 9.99984C18.3333 9.42909 18.2759 8.87167 18.1667 8.33317"
                            stroke="#22C55E"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                          />
                          <path
                            d="M6.66666 10.4165C6.66666 10.4165 7.91666 10.4165 9.58333 13.3332C9.58333 13.3332 14.2157 5.69428 18.3333 4.1665"
                            stroke="#22C55E"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span className="text-lg text-black">
                          Successful Bookings
                        </span>
                      </div>
                      <span className="text-lg font-semibold text-black">
                        {successfulBookings}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-1">
                      <div className="flex items-center gap-3">
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 20 20"
                          fill="none"
                        >
                          <path
                            d="M13.75 16.6665V14.9752C13.75 13.9399 13.2839 12.9248 12.3419 12.4953C11.1929 11.9716 9.81491 11.6665 8.33333 11.6665C6.85176 11.6665 5.47375 11.9716 4.32473 12.4953C3.38272 12.9248 2.91666 13.9399 2.91666 14.9752V16.6665"
                            stroke="#2C7FFF"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M17.0833 16.6673V14.9759C17.0833 13.9406 16.6173 12.9256 15.6753 12.4961C15.4581 12.3971 15.2327 12.3059 15 12.2231"
                            stroke="#2C7FFF"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M8.33333 9.16683C9.94416 9.16683 11.25 7.86099 11.25 6.25016C11.25 4.63933 9.94416 3.3335 8.33333 3.3335C6.7225 3.3335 5.41666 4.63933 5.41666 6.25016C5.41666 7.86099 6.7225 9.16683 8.33333 9.16683Z"
                            stroke="#2C7FFF"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M12.5 3.45361C13.7048 3.81218 14.5833 4.92824 14.5833 6.2495C14.5833 7.57075 13.7048 8.68684 12.5 9.04542"
                            stroke="#2C7FFF"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span className="text-lg text-black">
                          Information Inquires
                        </span>
                      </div>
                      <span className="text-lg font-semibold text-black">
                        {informationInquiries}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-1">
                      <div className="flex items-center gap-3">
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 20 20"
                          fill="none"
                        >
                          <path
                            d="M17.5 2.5L2.5 17.5"
                            stroke="#EF4444"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M6.73679 9.92983C6.60721 9.67667 6.53525 9.50142 6.50406 9.28975C6.46645 9.0345 6.49923 8.71417 6.58775 8.47192C6.6876 8.19857 6.87401 7.97488 7.24683 7.5275C7.62135 7.07807 7.80862 6.85335 7.90763 6.59909C8.00238 6.35578 8.03884 6.09367 8.01412 5.83373C7.98828 5.5621 7.86948 5.2948 7.63188 4.76019L7.29633 4.00521C7.07693 3.51157 6.96723 3.26473 6.80317 3.07584C6.59756 2.83912 6.32956 2.66495 6.02973 2.57321C5.79048 2.5 5.52038 2.5 4.98018 2.5C4.18993 2.5 3.79479 2.5 3.46311 2.65191C3.07239 2.83085 2.71953 3.2194 2.57894 3.6255C2.45959 3.97024 2.49378 4.32453 2.56215 5.03308C2.82826 7.79079 3.54988 10.093 4.72702 11.9397M6.20917 13.7908C8.27663 15.8582 11.1959 17.074 14.9669 17.4378C15.6755 17.5062 16.0298 17.5404 16.3745 17.4211C16.7806 17.2805 17.1692 16.9276 17.3481 16.5369C17.5 16.2052 17.5 15.8101 17.5 15.0198C17.5 14.4796 17.5 14.2095 17.4268 13.9702C17.3351 13.6704 17.1609 13.4024 16.9242 13.1968C16.7352 13.0327 16.4884 12.9231 15.9948 12.7037L15.2398 12.3681C14.7052 12.1305 14.4379 12.0117 14.1663 11.9859C13.9063 11.9612 13.6443 11.9977 13.4009 12.0924C13.1467 12.1914 12.9219 12.3787 12.4725 12.7532C12.0251 13.126 11.8014 13.3124 11.5281 13.4122C11.2858 13.5007 10.9655 13.5336 10.7103 13.4959C10.4224 13.4535 10.2019 13.3358 9.76108 13.1001C9.07525 12.7336 8.54317 12.3612 8.09098 11.909"
                            stroke="#EF4444"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span className="text-lg text-black">
                          Dropped/Missed
                        </span>
                      </div>
                      <span className="text-lg font-semibold text-black">
                        {droppedMissed}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-1">
                      <div className="flex items-center gap-3">
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 20 20"
                          fill="none"
                        >
                          <path
                            d="M18.3333 9.99984C18.3333 5.39746 14.6023 1.6665 10 1.6665C5.39762 1.6665 1.66666 5.39746 1.66666 9.99984C1.66666 14.6022 5.39762 18.3332 10 18.3332C14.6023 18.3332 18.3333 14.6022 18.3333 9.99984Z"
                            stroke="#6B7280"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M12.4995 12.5L7.5 7.5M7.50053 12.5L12.5 7.5"
                            stroke="#6B7280"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span className="text-lg text-black">Unsuccessful</span>
                      </div>
                      <span className="text-lg font-semibold text-black">
                        {calls.length > 0 ? unsuccessful : 0}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Right Column - Recent Calls */}
          <div className="w-full lg:w-[790px] lg:flex-shrink-0">
            <div className="bg-white rounded-2xl p-5">
              <div className="mb-5">
                <h3 className="text-xl font-semibold text-black mb-1">
                  Recent Calls
                </h3>
                <p className="text-lg font-semibold text-gray-500">
                  Latest call activity from your AI agent
                </p>
              </div>

              {calls.length === 0 ? (
                <div className="flex items-center justify-center py-40">
                  <div className="text-center opacity-15">
                    <img
                      src="https://api.builder.io/api/v1/image/assets/TEMP/b806c01e97879ada90b7566a617f9dcacf61430b?width=752"
                      alt="No calls"
                      className="w-48 h-48 md:w-64 md:h-64 lg:w-96 lg:h-96 mx-auto"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {calls.map((call) => (
                    <div
                      key={call.id}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div>
                          <div className="text-lg font-semibold text-black">
                            Incoming Call #{call.id}
                          </div>
                          <div className="text-gray-500">{call.time}</div>
                        </div>
                      </div>
                      <div
                        className={`px-4 py-1 rounded-xl text-sm font-medium ${getStatusStyle(call.status)}`}
                      >
                        {getStatusText(call.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Popups */}
      {showNotifications && renderNotificationsPopup()}
      {showDateFilter && renderDateFilterPopup()}
    </div>
  );
};

export default Dashboard;