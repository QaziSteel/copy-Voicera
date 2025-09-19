import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { DateFilterPopup } from "@/components/DateFilterPopup";
import { useDateFilter } from "@/hooks/useDateFilter";
import { useNotifications } from "@/hooks/useNotifications";
import NotificationPopup from "@/components/NotificationPopup";
import { Header } from "@/components/shared/Header";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";
import { useCallLogs } from "@/hooks/useCallLogs";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
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

  // Get real dashboard metrics from database
  const { metrics, loading: metricsLoading } = useDashboardMetrics(getDateFilter(), filterVersion);
  const { callLogs, loading: callLogsLoading } = useCallLogs('', getDateFilter(), filterVersion);

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

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <Header currentPage="dashboard" />

      {/* Main Content */}
      <main className="px-3 md:px-6 lg:px-12 py-6">
        {/* Dashboard Header */}
        <div className="flex justify-between items-end mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-black mb-1">
              Dashboard
            </h1>
            <p className="text-lg font-semibold text-gray-500">
              Monitor your AI agent performance and call analytics
            </p>
          </div>

          <div className="flex gap-3">
            {/* Today Button */}
            <button 
              onClick={openDateFilter}
              className="bg-black text-white px-3 py-2 rounded-lg flex items-center gap-2"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
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
              <span className="text-base font-medium">{getButtonText()}</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Left Column */}
          <div className="flex-1 space-y-4">
            {/* Metrics Cards */}
            <div className="grid grid-cols-2 gap-4">
              {/* Total Calls */}
              <div className="bg-white rounded-2xl p-4">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-base font-semibold text-black">
                    Total Calls
                  </h3>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M9.1585 5.71223L8.75584 4.80625C8.49256 4.21388 8.36092 3.91768 8.16405 3.69101C7.91732 3.40694 7.59571 3.19794 7.23592 3.08785C6.94883 3 6.6247 3 5.97645 3C5.02815 3 4.554 3 4.15597 3.18229C3.68711 3.39702 3.26368 3.86328 3.09497 4.3506C2.95175 4.76429 2.99278 5.18943 3.07482 6.0397C3.94815 15.0902 8.91006 20.0521 17.9605 20.9254C18.8108 21.0075 19.236 21.0485 19.6496 20.9053C20.137 20.7366 20.6032 20.3131 20.818 19.8443C21.0002 19.4462 21.0002 18.9721 21.0002 18.0238C21.0002 17.3755 21.0002 17.0514 20.9124 16.7643C20.8023 16.4045 20.5933 16.0829 20.3092 15.8362C20.0826 15.6393 19.7864 15.5077 19.194 15.2444L18.288 14.8417C17.6465 14.5566 17.3257 14.4141 16.9998 14.3831C16.6878 14.3534 16.3733 14.3972 16.0813 14.5109C15.7762 14.6297 15.5066 14.8544 14.9672 15.3038C14.4304 15.7512 14.162 15.9749 13.834 16.0947C13.5432 16.2009 13.1588 16.2403 12.8526 16.1951C12.5071 16.1442 12.2426 16.0029 11.7135 15.7201C10.0675 14.8405 9.15977 13.9328 8.28011 12.2867C7.99738 11.7577 7.85602 11.4931 7.80511 11.1477C7.75998 10.8414 7.79932 10.457 7.90554 10.1663C8.02536 9.83828 8.24905 9.56986 8.69643 9.033C9.14586 8.49368 9.37058 8.22402 9.48939 7.91891C9.60309 7.62694 9.64686 7.3124 9.61719 7.00048C9.58618 6.67452 9.44362 6.35376 9.1585 5.71223Z"
                      stroke="#6B7280"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <div>
                  <div className="text-2xl font-semibold text-black mb-2">
                    {metricsLoading ? '...' : metrics.totalCalls}
                  </div>
                  <div className="text-gray-500">
                    {metricsLoading ? 'Loading...' : `${metrics.totalCalls} calls total`}
                  </div>
                </div>
              </div>

              {/* Total Bookings */}
              <div className="bg-white rounded-2xl p-4">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-base font-semibold text-black">
                    Total Bookings
                  </h3>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
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
                  <div className="text-2xl font-semibold text-black mb-2">
                    {metricsLoading ? '...' : metrics.totalBookings}
                  </div>
                  <div className="text-gray-500">Appointments Scheduled</div>
                </div>
              </div>

              {/* Conversion Rate */}
              <div className="bg-white rounded-2xl p-4">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-base font-semibold text-black">
                    Conversion Rate
                  </h3>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M18.7781 9.12121L13.1212 14.7781L10.4999 11.9998L6.49993 15.5M18.7781 9.12121C19.0257 11.8436 19.1318 13.0103 19.1318 13.0103M18.7781 9.12121C16.4447 8.90915 14.8891 8.7677 14.8891 8.7677"
                      stroke="#6B7280"
                      strokeLinecap="square"
                    />
                  </svg>
                </div>
                <div>
                  <div className="text-2xl font-semibold text-black mb-2">
                    {metricsLoading ? '...' : `${metrics.conversionRate.toFixed(1)}%`}
                  </div>
                  <div className="text-gray-500">Calls to bookings</div>
                </div>
              </div>

              {/* Avg Call Duration */}
              <div className="bg-white rounded-2xl p-4">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-base font-semibold text-black">
                    Avg Call Duration
                  </h3>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
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
                  <div className="text-2xl font-semibold text-black mb-2">
                    {metricsLoading ? '...' : metrics.averageCallDuration}
                  </div>
                  <div className="text-gray-500">Avg Call Duration</div>
                </div>
              </div>
            </div>

            {/* Call Outcomes */}
            <div className="bg-white rounded-2xl p-4">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-black mb-1">
                  Call Outcomes
                </h3>
                <p className="text-base font-semibold text-gray-500">
                  Distribution of call results
                </p>
              </div>

              {(() => {
                const successfulBookings = metricsLoading ? 0 : metrics.successfulBookings;
                const informationInquiries = metricsLoading ? 0 : metrics.informationInquiries;
                const droppedMissed = metricsLoading ? 0 : metrics.droppedMissed;
                const unsuccessful = 0; // Set to 0 to match zero state

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
                            d="M2.5 2.5L17.5 17.5"
                            stroke="#EF4444"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span className="text-lg text-black">Dropped/Missed</span>
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
                            d="M17.5 2.5L2.5 17.5"
                            stroke="#EF4444"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M2.5 2.5L17.5 17.5"
                            stroke="#EF4444"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span className="text-lg text-black">Unsuccessful</span>
                      </div>
                      <span className="text-lg font-semibold text-black">
                        {unsuccessful}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Right Column - Recent Calls */}
          <div className="flex-1">
            <div className="bg-white rounded-2xl p-4">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-black mb-1">
                  Recent Calls
                </h3>
                <p className="text-base font-semibold text-gray-500">
                  Latest call activity from your AI agent
                </p>
              </div>

              {callLogsLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
                </div>
              ) : callLogs.length === 0 ? (
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
                <div className="space-y-2">
                  {callLogs.slice(0, 5).map((call) => (
                    <div
                      key={call.id}
                      className="flex justify-between items-center p-2 bg-gray-50 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <div>
                          <div className="text-lg font-semibold text-black">
                            Call {call.id}
                          </div>
                          <div className="text-gray-500">
                            {call.started_at ? new Date(call.started_at).toLocaleString() : 'Unknown time'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-600">
                          Information Inquiry
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
        isVisible={showNotifications}
        onClose={closeNotifications}
        notifications={notifications}
        notificationCount={notificationCount}
      />
    </div>
  );
};

export default Dashboard;