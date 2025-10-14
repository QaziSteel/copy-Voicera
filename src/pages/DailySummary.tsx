import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import NotificationPopup from "@/components/NotificationPopup";
import { DateFilterPopup } from "@/components/DateFilterPopup";
import { useDateFilter } from "@/hooks/useDateFilter";
import { Header } from "@/components/shared/Header";
import { useDailySummary, DailySummaryEntry } from "@/hooks/useDailySummary";

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
    getButtonText,
    getDateFilter,
    filterVersion,
  } = useDateFilter();
  const { 
    notifications, 
    showNotifications, 
    openNotifications, 
    closeNotifications, 
    notificationCount 
  } = useNotifications();

  // Get real daily summary data from database
  const { dailySummaryEntries, loading } = useDailySummary(getDateFilter(), filterVersion);

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
                  {selectedSummary?.callsTaken ?? 0} Calls
                </span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                <span className="text-lg text-gray-500">Average Duration:</span>
                <span className="text-lg font-semibold text-black">{selectedSummary?.avgDuration ?? "0s"}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                <span className="text-lg text-gray-500">Bookings Made:</span>
                <span className="text-lg font-semibold text-black">
                  {selectedSummary?.bookingsMade ?? 0} Bookings
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
                <span className="text-lg font-semibold text-black">{selectedSummary?.conversionRate ?? '0%'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-lg text-gray-500">Peak Time:</span>
                <span className="text-lg font-semibold text-black">
                  {selectedSummary?.peakTime ?? 'N/A'}
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
      <main className="px-3 md:px-6 lg:px-12 py-6">
        {/* Page Header */}
        <div className="flex justify-between items-end mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-black mb-1">
              Daily Summary
            </h1>
            <p className="text-lg font-semibold text-gray-500">
              Review and analyze the day's call performance at a glance.
            </p>
          </div>

          {/* Today Button */}
          <button 
            onClick={openDateFilter}
            className="bg-black text-white px-3 py-2 rounded-lg flex items-center gap-2"
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
            <span className="text-sm font-medium">{getButtonText()}</span>
          </button>
        </div>

        {/* Daily Summary Table */}
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          {/* Table Header - Fixed */}
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
              INFO INQUIRIES
            </div>
            <div className="flex-1 text-xs font-bold text-gray-700 uppercase tracking-wide">
              MISSED
            </div>
            <div className="flex-1 text-xs font-bold text-gray-700 uppercase tracking-wide">
              ACTION
            </div>
          </div>

          {/* Scrollable Content Area */}
          <div className="max-h-[calc(100vh-320px)] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-gray-400">
            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="ml-2 text-muted-foreground">Loading summaries...</p>
              </div>
            )}

            {/* Table Rows */}
            {!loading && dailySummaryEntries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-4 p-3 h-16 bg-white border-b border-gray-200"
              >
                <div className="w-4 h-4 border border-gray-300"></div>
                <div className="w-8 font-semibold text-gray-700 text-sm">
                  {entry.id}
                </div>
                <div className="flex-1 text-gray-700 text-sm">
                  {entry.formattedDate}
                </div>
                <div className="flex-1 text-gray-700 text-sm">
                  {entry.callsTaken} Calls
                </div>
                <div className="flex-1 text-gray-700 text-sm">
                  {entry.avgDuration}
                </div>
                <div className="flex-1 text-gray-700 text-sm">
                  {entry.informationInquiries} Inquiries
                </div>
                <div className="flex-1 text-gray-700 text-sm">
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

            {/* Empty State */}
            {!loading && dailySummaryEntries.length === 0 && (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No call data yet
                </h3>
                <p className="text-gray-500">
                  Daily summaries will appear here once calls are logged.
                </p>
              </div>
            )}
          </div>
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