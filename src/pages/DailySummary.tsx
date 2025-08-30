import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import NotificationPopup from "@/components/NotificationPopup";
import { DateFilterPopup } from "@/components/DateFilterPopup";
import { useDateFilter } from "@/hooks/useDateFilter";
import { Header } from "@/components/shared/Header";

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
  const { user } = useAuth();
  const [showSummaryPopup, setShowSummaryPopup] = useState(false);
  const [selectedSummary, setSelectedSummary] =
    useState<DailySummaryEntry | null>(null);
  const {
    showDateFilter,
    selectedFilter,
    fromDate,
    toDate,
    openDateFilter,
    closeDateFilter,
    setSelectedFilter,
    setFromDate,
    setToDate,
    applyFilter,
  } = useDateFilter();
  const { 
    notifications, 
    showNotifications, 
    openNotifications, 
    closeNotifications, 
    notificationCount 
  } = useNotifications();

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
      <Header currentPage="daily-summary" />

      {/* Main Content */}
      <main className="px-4 md:px-8 lg:px-16 py-8">
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
          <button 
            onClick={openDateFilter}
            className="bg-black text-white px-4 py-3 rounded-lg flex items-center gap-2"
          >
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

      {/* Date Filter Popup */}
      <DateFilterPopup
        isVisible={showDateFilter}
        onClose={closeDateFilter}
        selectedFilter={selectedFilter}
        onFilterChange={setSelectedFilter}
        fromDate={fromDate}
        toDate={toDate}
        onFromDateChange={setFromDate}
        onToDateChange={setToDate}
        onApplyFilter={applyFilter}
      />

      {/* Notification Popup */}
      <NotificationPopup 
        notifications={notifications}
        isVisible={showNotifications}
        onClose={closeNotifications}
        notificationCount={notificationCount}
      />

      {/* Summary Popup */}
      {showSummaryPopup && renderSummaryPopup()}
    </div>
  );
};

export default DailySummary;