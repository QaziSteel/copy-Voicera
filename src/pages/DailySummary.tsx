import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface DailySummaryEntry {
  id: string;
  date: string;
  callsTaken: number;
  avgDuration: string;
  bookingsMade: number;
  missed: number;
  agentName?: string;
}

const DailySummary: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [showSummaryPopup, setShowSummaryPopup] = useState(false);
  const [selectedSummary, setSelectedSummary] =
    useState<DailySummaryEntry | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);

  // Mock daily summary data
  const dailySummaryEntries: DailySummaryEntry[] = [
    {
      id: "01",
      date: "August 20, 2025",
      callsTaken: 6,
      avgDuration: "3m 45s",
      bookingsMade: 4,
      missed: 0,
    },
    {
      id: "02",
      date: "August 19, 2023",
      callsTaken: 4,
      avgDuration: "2m 15s",
      bookingsMade: 2,
      missed: 1,
    },
    {
      id: "03",
      date: "August 20, 2023",
      callsTaken: 8,
      avgDuration: "5m 30s",
      bookingsMade: 5,
      missed: 0,
    },
    {
      id: "04",
      date: "August 21, 2023",
      callsTaken: 5,
      avgDuration: "4m 10s",
      bookingsMade: 3,
      missed: 2,
    },
    {
      id: "05",
      date: "August 22, 2023",
      callsTaken: 7,
      avgDuration: "3m 55s",
      bookingsMade: 6,
      missed: 1,
    },
    {
      id: "06",
      date: "August 23, 2023",
      callsTaken: 9,
      avgDuration: "4m 25s",
      bookingsMade: 7,
      missed: 0,
    },
    {
      id: "07",
      date: "August 24, 2023",
      callsTaken: 3,
      avgDuration: "2m 50s",
      bookingsMade: 1,
      missed: 2,
    },
    {
      id: "08",
      date: "August 25, 2023",
      callsTaken: 10,
      avgDuration: "6m 00s",
      bookingsMade: 8,
      missed: 0,
    },
    {
      id: "09",
      date: "August 26, 2023",
      callsTaken: 2,
      avgDuration: "1m 30s",
      bookingsMade: 1,
      missed: 3,
    },
    {
      id: "10",
      date: "August 27, 2023",
      callsTaken: 11,
      avgDuration: "7m 10s",
      bookingsMade: 9,
      missed: 1,
    },
  ];

  const openSummaryPopup = (entry: DailySummaryEntry) => {
    setSelectedSummary(entry);
    setShowSummaryPopup(true);
  };

  const renderSummaryPopup = () => (
    <div className="fixed inset-0 bg-black bg-opacity-20 flex justify-center items-center z-50">
      <div className="bg-white rounded-3xl w-[400px] max-w-md max-h-[80vh] shadow-lg flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-200 flex-shrink-0">
          <h3 className="text-xl font-medium text-gray-800">
            Summary – {selectedSummary?.date || "August 20, 2025"}
          </h3>
          <button
            onClick={() => setShowSummaryPopup(false)}
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

        {/* Summary Content */}
        <div className="p-5 space-y-6 overflow-y-auto max-h-[60vh]">
          {/* Summary Section */}
          <div className="space-y-3">
            <h4 className="text-xl font-medium text-gray-800">Summary</h4>
            <div className="space-y-5">
              <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                <span className="text-lg text-gray-500">Calls Taken:</span>
                <span className="text-lg font-semibold text-black">
                  {selectedSummary?.callsTaken || 6} Calls
                </span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                <span className="text-lg text-gray-500">Average Duration:</span>
                <span className="text-lg font-semibold text-black">{selectedSummary?.avgDuration || "3m 45s"}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                <span className="text-lg text-gray-500">Bookings Made:</span>
                <span className="text-lg font-semibold text-black">
                  {selectedSummary?.bookingsMade || 4} Bookings
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-lg text-gray-500">Missed Calls:</span>
                <span className="text-lg font-semibold text-black">
                  {selectedSummary?.missed || 0} Missed
                </span>
              </div>
            </div>
          </div>

          {/* Additional Insights */}
          <div className="space-y-3">
            <h4 className="text-xl font-medium text-gray-800">
              Additional Insights:
            </h4>
            <div className="space-y-5">
              <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                <span className="text-lg text-gray-500">Conversion Rate:</span>
                <span className="text-lg font-semibold text-black">66%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-lg text-gray-500">Peak Time:</span>
                <span className="text-lg font-semibold text-black">
                  11:00 AM – 1:00 PM
                </span>
              </div>
            </div>
          </div>

          {/* Close Button */}
          <div className="flex">
            <button
              onClick={() => setShowSummaryPopup(false)}
              className="flex-1 bg-gray-100 text-gray-500 font-semibold text-lg py-4 px-5 rounded-xl hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-16 py-4">
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
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M18 9.00005C18 9.00005 13.5811 15 12 15C10.4188 15 6 9 6 9"
                  stroke="#141B34"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-center mt-4">
          <div className="bg-gray-100 rounded-full p-2 flex items-center gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              className={`px-4 py-2 rounded-full transition-colors ${
                location.pathname === "/dashboard" 
                  ? "bg-white shadow-sm" 
                  : "hover:bg-gray-200"
              }`}
            >
              <span className={`text-lg font-semibold ${
                location.pathname === "/dashboard" 
                  ? "text-black" 
                  : "text-gray-500"
              }`}>
                Dashboard
              </span>
            </button>
            <button
              onClick={() => navigate("/call-logs")}
              className={`px-4 py-2 rounded-full transition-colors ${
                location.pathname === "/call-logs" 
                  ? "bg-white shadow-sm" 
                  : "hover:bg-gray-200"
              }`}
            >
              <span className={`text-lg font-semibold ${
                location.pathname === "/call-logs" 
                  ? "text-black" 
                  : "text-gray-500"
              }`}>
                Call Logs
              </span>
            </button>
            <button
              onClick={() => navigate("/daily-summary")}
              className={`px-4 py-2 rounded-full transition-colors ${
                location.pathname === "/daily-summary" 
                  ? "bg-white shadow-sm" 
                  : "hover:bg-gray-200"
              }`}
            >
              <span className={`text-lg font-semibold ${
                location.pathname === "/daily-summary" 
                  ? "text-black" 
                  : "text-gray-500"
              }`}>
                Daily Summary
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-16 py-8">
        {/* Page Header */}
        <div className="flex justify-between items-end mb-7">
          <div>
            <h1 className="text-3xl font-semibold text-black mb-1">
              Daily Summary
            </h1>
            <p className="text-xl font-semibold text-gray-500">
              Review and analyze the day's call performance at a glance.
            </p>
          </div>

          {/* Today Button */}
          <button className="bg-black text-white px-4 py-3 rounded-lg flex items-center gap-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <g clipPath="url(#clip0_82_219)">
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
                <clipPath id="clip0_82_219">
                  <rect width="24" height="24" fill="white" />
                </clipPath>
              </defs>
            </svg>
            <span className="text-base font-medium">Today</span>
          </button>
        </div>

        {/* Daily Summary Table */}
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          {/* Table Header */}
          <div className="flex items-center gap-4 p-3 bg-gray-100 border-b border-black border-opacity-10">
            <div className="w-4 h-4 border border-gray-300"></div>
            <div className="w-8 text-xs font-bold text-gray-700 uppercase tracking-wide">
              NO.
            </div>
            <div className="flex-1 text-xs font-bold text-gray-700 uppercase tracking-wide">
              DATE
            </div>
            <div className="flex-1 text-xs font-bold text-gray-700 uppercase tracking-wide">
              CALLS TAKEN
            </div>
            <div className="flex-1 text-xs font-bold text-gray-700 uppercase tracking-wide">
              AVG DURATION
            </div>
            <div className="flex-1 text-xs font-bold text-gray-700 uppercase tracking-wide">
              BOOKINGS MADE
            </div>
            <div className="flex-1 text-xs font-bold text-gray-700 uppercase tracking-wide">
              MISSED
            </div>
            <div className="flex-1 text-xs font-bold text-gray-700 uppercase tracking-wide">
              ACTION
            </div>
          </div>

          {/* Table Rows */}
          {dailySummaryEntries.map((entry) => (
            <div
              key={entry.id}
              className={`flex items-center gap-4 p-3 h-16 bg-white border-b border-gray-200 ${
                entry.id === "06" ? "border-b-black border-opacity-10" : ""
              }`}
            >
              <div className="w-4 h-4 border border-gray-300"></div>
              <div
                className={`w-8 font-semibold text-gray-700 ${entry.id === "06" ? "text-xs" : "text-sm"}`}
              >
                {entry.id}
              </div>
              <div
                className={`flex-1 text-gray-700 ${entry.id === "06" ? "text-xs font-semibold uppercase" : "text-sm"}`}
              >
                {entry.date}
              </div>
              <div
                className={`flex-1 text-gray-700 ${entry.id === "06" ? "text-xs font-semibold uppercase" : "text-sm"}`}
              >
                {entry.callsTaken} Calls
              </div>
              <div
                className={`flex-1 text-gray-700 ${entry.id === "06" ? "text-xs font-semibold uppercase" : "text-sm"}`}
              >
                {entry.avgDuration}
              </div>
              <div
                className={`flex-1 text-gray-700 ${entry.id === "06" ? "text-xs font-semibold uppercase" : "text-sm"}`}
              >
                {entry.bookingsMade} Booking
                {entry.bookingsMade !== 1 ? "s" : ""}
              </div>
              <div
                className={`flex-1 text-gray-700 ${entry.id === "06" ? "text-xs font-semibold uppercase" : "text-sm"}`}
              >
                {entry.missed} Missed
              </div>
              <div className="flex-1">
                <button
                  onClick={() => openSummaryPopup(entry)}
                  className="bg-black text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-gray-800 transition-colors"
                >
                  View Summary
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Notification Popup */}
      {showNotifications && (
        <div className="fixed inset-0 bg-black bg-opacity-20 flex justify-center items-start pt-24 px-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-[650px] max-h-[80vh] overflow-y-auto scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-300 scrollbar-thumb-rounded-full shadow-lg">
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
              {/* Sample Notifications */}
              <div className="flex items-start gap-4 pb-4 border-b border-gray-200">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                    <path
                      d="M13 0.333984C18.9709 0.333984 21.9565 0.333566 23.8115 2.18848C25.6664 4.04346 25.667 7.02899 25.667 13C25.667 18.9709 25.6663 21.9564 23.8115 23.8115C21.9565 25.6664 18.971 25.667 13 25.667C7.02888 25.667 4.04348 25.6665 2.18848 23.8115C0.333558 21.9565 0.333008 18.971 0.333008 13C0.333008 7.02899 0.333507 4.04346 2.18848 2.18848C4.04349 0.333612 7.02901 0.333984 13 0.333984Z"
                      fill="#007AFF"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-xl text-black">
                    Daily Summary Ready ·{" "}
                    <span className="text-gray-500">
                      Your daily summary for August 20, 2025 is now available.
                    </span>
                  </p>
                  <p className="text-gray-500 text-sm mt-2">Today · 5:00 PM</p>
                  <button className="bg-black text-white px-5 py-2 rounded-lg text-xs font-semibold mt-3">
                    View Summary
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-4 pb-4 border-b border-gray-200">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg width="32" height="32" viewBox="0 0 28 28" fill="none">
                    <path
                      d="M14 0.666992C21.3637 0.666992 27.333 6.6362 27.333 14C27.3329 21.3637 21.3637 27.333 14 27.333C6.63629 27.333 0.667081 21.3636 0.666992 14C0.666992 6.63623 6.63624 0.667036 14 0.666992Z"
                      fill="#22C55E"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-xl text-black">
                    Analysis Complete ·{" "}
                    <span className="text-gray-500">
                      Call analysis for the past week has been completed.
                    </span>
                  </p>
                  <p className="text-gray-500 text-sm mt-2">Today · 4:30 PM</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Popup */}
      {showSummaryPopup && renderSummaryPopup()}
    </div>
  );
};

export default DailySummary;