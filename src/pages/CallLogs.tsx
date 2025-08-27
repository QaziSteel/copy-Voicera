import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import NotificationPopup from "@/components/NotificationPopup";

interface CallLogEntry {
  id: string;
  type: "incoming" | "outgoing";
  status: "booking" | "inquiry" | "dropped";
  phoneNumber: string;
  duration: string;
  timestamp: string;
  customerName?: string;
  bookingDetails?: string;
  bookingTime?: string;
}

const CallLogs: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [showTranscript, setShowTranscript] = useState(false);
  const [showReplay, setShowReplay] = useState(false);
  const [selectedCall, setSelectedCall] = useState<CallLogEntry | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { 
    notifications, 
    showNotifications, 
    openNotifications, 
    closeNotifications, 
    notificationCount 
  } = useNotifications();

  // Check if user is logged in
  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  // Logout function
  const handleLogout = async () => {
    await signOut();
  };

  // Mock call logs data
  const callLogs: CallLogEntry[] = [
    {
      id: "Call-001",
      type: "incoming",
      status: "booking",
      phoneNumber: "+1 (555) 123-4567",
      duration: "3:00",
      timestamp: "01/08/2025, 16:16:07",
      customerName: "John Smith",
      bookingDetails: "Booking: John Smith - Consultation",
      bookingTime: "2024-01-15 at 14:00",
    },
    {
      id: "Call-002",
      type: "incoming",
      status: "inquiry",
      phoneNumber: "+1 (555) 987-6543",
      duration: "1:35",
      timestamp: "01/08/2025, 15:16:07",
    },
    {
      id: "Call-002",
      type: "incoming",
      status: "dropped",
      phoneNumber: "Unknown",
      duration: "0:15",
      timestamp: "01/08/2025, 14:16:07",
    },
  ];

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "booking":
        return "bg-green-100 text-green-800";
      case "inquiry":
        return "bg-blue-100 text-blue-600";
      case "dropped":
        return "bg-red-100 text-red-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const openTranscript = (call: CallLogEntry) => {
    setSelectedCall(call);
    setShowTranscript(true);
  };

  const openReplay = (call: CallLogEntry) => {
    setSelectedCall(call);
    setShowReplay(true);
  };

  const renderTranscriptPopup = () => (
    <div className="fixed inset-0 bg-black bg-opacity-20 flex justify-center items-center z-50">
      <div className="bg-white rounded-2xl w-[700px] max-h-[90vh] overflow-y-auto shadow-lg">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-200">
          <h3 className="text-xl font-medium text-gray-800">
            Call Transcript – 14 Aug 2025, 2:45 PM
          </h3>
          <button
            onClick={() => setShowTranscript(false)}
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

        {/* Transcript Content */}
        <div className="p-5 space-y-4">
          {/* AI Agent Message */}
          <div className="flex gap-4 pb-4">
            <div className="flex-1">
              <div className="mb-3">
                <div className="text-xl font-medium text-black">AI Agent</div>
                <div className="text-gray-500 text-base">
                  Bella – Voicera AI
                </div>
              </div>
              <div className="p-3 border border-gray-200 rounded-xl">
                <div className="text-gray-600">
                  Hello, thank you for calling Bella Salon. How can I help you
                  today?
                </div>
              </div>
            </div>
          </div>

          {/* Customer Message */}
          <div className="flex gap-4 pb-4">
            <div className="flex-1">
              <div className="mb-3">
                <div className="text-xl font-medium text-black">John Doe</div>
                <div className="text-gray-500 text-base">Customer</div>
              </div>
              <div className="p-3 border border-gray-200 rounded-xl">
                <div className="text-gray-600">
                  Hi, I'd like to book a haircut for this afternoon if possible.
                </div>
              </div>
            </div>
          </div>

          {/* AI Agent Response */}
          <div className="flex gap-4 pb-4">
            <div className="flex-1">
              <div className="mb-3">
                <div className="text-xl font-medium text-black">AI Agent</div>
                <div className="text-gray-500 text-base">
                  Bella – Voicera AI
                </div>
              </div>
              <div className="p-3 border border-gray-200 rounded-xl">
                <div className="text-gray-600">
                  Sure! We have availability today. What time works best for
                  you?
                </div>
              </div>
            </div>
          </div>

          {/* Customer Response */}
          <div className="flex gap-4 pb-4">
            <div className="flex-1">
              <div className="mb-3">
                <div className="text-xl font-medium text-black">John Doe</div>
                <div className="text-gray-500 text-base">Customer</div>
              </div>
              <div className="p-3 border border-gray-200 rounded-xl">
                <div className="text-gray-600">3:00 PM would be perfect.</div>
              </div>
            </div>
          </div>

          {/* AI Agent Confirmation */}
          <div className="flex gap-4 pb-4">
            <div className="flex-1">
              <div className="mb-3">
                <div className="text-xl font-medium text-black">AI Agent</div>
                <div className="text-gray-500 text-base">
                  Bella – Voicera AI
                </div>
              </div>
              <div className="p-3 border border-gray-200 rounded-xl">
                <div className="text-gray-600">
                  Great, I've booked you in for a haircut today at 3:00 PM with
                  our senior stylist, James. Can I get your phone number to
                  confirm your booking?
                </div>
              </div>
            </div>
          </div>

          {/* Customer Phone */}
          <div className="flex gap-4 pb-4">
            <div className="flex-1">
              <div className="mb-3">
                <div className="text-xl font-medium text-black">John Doe</div>
                <div className="text-gray-500 text-base">Customer</div>
              </div>
              <div className="p-3 border border-gray-200 rounded-xl">
                <div className="text-gray-600">Yes, it's 07456 789 432.</div>
              </div>
            </div>
          </div>

          {/* Final AI Confirmation */}
          <div className="flex gap-4 pb-4">
            <div className="flex-1">
              <div className="mb-3">
                <div className="text-xl font-medium text-black">AI Agent</div>
                <div className="text-gray-500 text-base">
                  Bella – Voicera AI
                </div>
              </div>
              <div className="p-3 border border-gray-200 rounded-xl">
                <div className="text-gray-600">
                  Perfect. Your appointment is confirmed for today at 3:00 PM.
                  We look forward to seeing you, Anna. Have a great day!
                </div>
              </div>
            </div>
          </div>

          {/* Thank You */}
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="mb-3">
                <div className="text-xl font-medium text-black">John Doe</div>
                <div className="text-gray-500 text-base">Customer</div>
              </div>
              <div className="p-3 border border-gray-200 rounded-xl">
                <div className="text-gray-600">Thank you!</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderReplayPopup = () => (
    <div className="fixed inset-0 bg-black bg-opacity-20 flex justify-center items-center z-50">
      <div className="bg-white rounded-2xl w-[800px] shadow-lg">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-200">
          <h3 className="text-xl font-medium text-gray-800">
            Call Record – 14 Aug 2025, 2:45 PM
          </h3>
          <button
            onClick={() => setShowReplay(false)}
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

        {/* Audio Player */}
        <div className="p-5">
          <div className="flex items-center gap-5 p-3 border border-gray-200 rounded-lg">
            {/* Previous Button */}
            <button className="p-2">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M8.06492 12.6258C8.31931 13.8374 9.67295 14.7077 12.3802 16.4481C15.3247 18.3411 16.797 19.2876 17.9895 18.9229C18.3934 18.7994 18.7654 18.5823 19.0777 18.2876C20 17.4178 20 15.6118 20 12C20 8.38816 20 6.58224 19.0777 5.71235C18.7654 5.41773 18.3934 5.20057 17.9895 5.07707C16.797 4.71243 15.3247 5.6589 12.3802 7.55186C9.67295 9.29233 8.31931 10.1626 8.06492 11.3742C7.97836 11.7865 7.97836 12.2135 8.06492 12.6258Z"
                  stroke="#141B34"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <path
                  d="M4 4V20"
                  stroke="#141B34"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            {/* Play Button */}
            <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M18.8906 12.846C18.5371 14.189 16.8667 15.138 13.5257 17.0361C10.296 18.8709 8.6812 19.7884 7.37983 19.4196C6.8418 19.2671 6.35159 18.9776 5.95624 18.5787C5 17.6139 5 15.7426 5 12C5 8.2574 5 6.3861 5.95624 5.42132C6.35159 5.02245 6.8418 4.73288 7.37983 4.58042C8.6812 4.21165 10.296 5.12907 13.5257 6.96393C16.8667 8.86197 18.5371 9.811 18.8906 11.154C19.0365 11.7084 19.0365 12.2916 18.8906 12.846Z"
                  fill="white"
                />
              </svg>
            </div>

            {/* Next Button */}
            <button className="p-2">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M15.9351 12.6258C15.6807 13.8374 14.327 14.7077 11.6198 16.4481C8.67528 18.3411 7.20303 19.2876 6.01052 18.9229C5.60662 18.7994 5.23463 18.5823 4.92227 18.2876C4 17.4178 4 15.6118 4 12C4 8.38816 4 6.58224 4.92227 5.71235C5.23463 5.41773 5.60662 5.20057 6.01052 5.07707C7.20304 4.71243 8.67528 5.6589 11.6198 7.55186C14.327 9.29233 15.6807 10.1626 15.9351 11.3742C16.0216 11.7865 16.0216 12.2135 15.9351 12.6258Z"
                  stroke="#141B34"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <path
                  d="M20 5V19"
                  stroke="#141B34"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            {/* Time Display */}
            <span className="text-gray-500 text-base ml-4">00:28</span>

            {/* Progress Bar */}
            <div className="flex-1 mx-4 relative">
              <div className="h-2 bg-gray-200 rounded-full">
                <div className="w-6 h-2 bg-black rounded-l-full"></div>
                <div className="w-1 h-4 bg-black rounded-full absolute left-5 -top-1"></div>
              </div>
            </div>

            {/* Total Time */}
            <span className="text-gray-500 text-base">03:00</span>
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
              onClick={openNotifications}
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
                <span className="text-lg font-semibold text-gray-800">H</span>
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
              className="px-4 py-2 rounded-full"
            >
              <span className="text-lg font-semibold text-gray-500">
                Dashboard
              </span>
            </button>
            <div className="bg-white px-4 py-2 rounded-full shadow-sm">
              <span className="text-lg font-semibold text-black">
                Call Logs
              </span>
            </div>
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
      <main className="px-16 py-8">
        {/* Page Header */}
        <div className="flex justify-between items-end mb-7">
          <div>
            <h1 className="text-3xl font-semibold text-black mb-1">
              Call Logs
            </h1>
            <p className="text-xl font-semibold text-gray-500">
              View and analyze all call interactions
            </p>
          </div>

          <div className="flex gap-3">
            {/* Search */}
            <div className="flex items-center gap-5 px-5 py-3 bg-white border border-gray-200 rounded-lg">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M17 17L21 21"
                  stroke="#6B7280"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19C15.4183 19 19 15.4183 19 11Z"
                  stroke="#6B7280"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <input
                type="text"
                placeholder="Search by caller, call ID, or customer name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="text-gray-500 text-base bg-transparent border-none outline-none w-80"
              />
            </div>

            {/* Today Button */}
            <button className="bg-black text-white px-4 py-3 rounded-lg flex items-center gap-2">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <g clipPath="url(#clip0_183_24)">
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
                  <clipPath id="clip0_183_24">
                    <rect width="24" height="24" fill="white" />
                  </clipPath>
                </defs>
              </svg>
              <span className="text-base font-medium">Today</span>
            </button>
          </div>
        </div>

        {/* Call History */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200">
          <div className="mb-5">
            <h3 className="text-xl font-semibold text-black mb-1">
              Call History
            </h3>
            <p className="text-lg font-semibold text-gray-500">3 or 3 calls</p>
          </div>

          <div className="space-y-3.5">
            {callLogs.map((call, index) => (
              <div
                key={index}
                className="p-4 border border-gray-200 rounded-xl"
              >
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                      >
                        <path
                          d="M12.3683 15.2398L12.7038 15.9948C12.9232 16.4884 13.0329 16.7353 13.197 16.9242C13.4026 17.1609 13.6706 17.335 13.9704 17.4268C14.2097 17.5 14.4798 17.5 15.02 17.5C15.8102 17.5 16.2054 17.5 16.5371 17.3481C16.9278 17.1691 17.2806 16.7806 17.4212 16.3745C17.5406 16.0298 17.5064 15.6755 17.438 14.9669C16.7102 7.42483 12.5753 3.28992 5.03329 2.56217C4.3247 2.49375 3.97037 2.45958 3.6257 2.57892C3.21954 2.7195 2.83104 3.07242 2.65204 3.46308C2.5002 3.79483 2.5002 4.18992 2.5002 4.98017C2.5002 5.52042 2.5002 5.7905 2.57337 6.02975C2.66512 6.32958 2.83929 6.59758 3.07604 6.80317C3.26487 6.96725 3.5117 7.07692 4.00537 7.29633L4.76037 7.63192C5.29495 7.8695 5.56229 7.98825 5.83387 8.01408C6.09387 8.03883 6.35595 8.00233 6.59929 7.90758C6.85354 7.80858 7.0782 7.62133 7.5277 7.24683C7.97504 6.874 8.1987 6.68758 8.47204 6.58775C8.71437 6.49925 9.0347 6.46642 9.28987 6.50408C9.57779 6.5465 9.7982 6.66425 10.2391 6.89992C11.6108 7.63292 12.3672 8.38933 13.1003 9.76108C13.3359 10.2019 13.4537 10.4224 13.4961 10.7102C13.5337 10.9655 13.5009 11.2858 13.4124 11.5281C13.3126 11.8014 13.1262 12.0251 12.7533 12.4725C12.3788 12.9219 12.1916 13.1467 12.0925 13.4009C11.9978 13.6442 11.9613 13.9063 11.986 14.1663C12.0119 14.4379 12.1307 14.7052 12.3683 15.2398Z"
                          stroke="#22C55E"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-4 mb-3">
                        <h4 className="text-lg font-semibold text-black">
                          {call.id}
                        </h4>
                        <span className="px-3 py-1 border border-gray-200 rounded-lg text-base text-black">
                          {call.type === "incoming" ? "Incoming" : "Outgoing"}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-lg text-base ${getStatusStyle(call.status)}`}
                        >
                          {call.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-7">
                        <div className="flex items-center gap-1">
                          <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <path
                              d="M17 8.5C17 5.73858 14.7614 3.5 12 3.5C9.23858 3.5 7 5.73858 7 8.5C7 11.2614 9.23858 13.5 12 13.5C14.7614 13.5 17 11.2614 17 8.5Z"
                              stroke="#6B7280"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M19 20.5C19 16.634 15.866 13.5 12 13.5C8.13401 13.5 5 16.634 5 20.5"
                              stroke="#6B7280"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          <span className="text-gray-500 text-base">
                            {call.phoneNumber}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
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
                          <span className="text-gray-500 text-base">
                            {call.duration}
                          </span>
                        </div>
                        <span className="text-gray-500 text-base">
                          {call.timestamp}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => openTranscript(call)}
                      className="flex items-center gap-2.5 px-4 py-2 border border-gray-200 rounded-xl"
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                      >
                        <path
                          d="M5.0823 15.8335C3.99888 15.7269 3.18725 15.4015 2.64293 14.8572C1.66663 13.8809 1.66663 12.3095 1.66663 9.16683V8.75016C1.66663 5.60746 1.66663 4.03612 2.64293 3.0598C3.61925 2.0835 5.19059 2.0835 8.33329 2.0835H11.6666C14.8093 2.0835 16.3807 2.0835 17.357 3.0598C18.3333 4.03612 18.3333 5.60746 18.3333 8.75016V9.16683C18.3333 12.3095 18.3333 13.8809 17.357 14.8572C16.3807 15.8335 14.8093 15.8335 11.6666 15.8335C11.1995 15.8439 10.8275 15.8794 10.4621 15.9627C9.46346 16.1926 8.53871 16.7036 7.62485 17.1492C6.3227 17.7842 5.67163 18.1017 5.26303 17.8044C4.48137 17.2222 5.24541 15.4184 5.41663 14.5835"
                          stroke="#141B34"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="text-black text-base">Transcript</span>
                    </button>
                    <button
                      onClick={() => openReplay(call)}
                      className="flex items-center gap-2.5 px-4 py-2 border border-gray-200 rounded-xl"
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                      >
                        <path
                          d="M15.7421 10.705C15.4475 11.8242 14.0555 12.615 11.2714 14.1968C8.57996 15.7258 7.23429 16.4903 6.14982 16.183C5.70146 16.0559 5.29295 15.8147 4.96349 15.4822C4.16663 14.6782 4.16663 13.1188 4.16663 10C4.16663 6.88117 4.16663 5.32175 4.96349 4.51777C5.29295 4.18538 5.70146 3.94407 6.14982 3.81702C7.23429 3.50971 8.57996 4.27423 11.2714 5.80328C14.0555 7.38498 15.4475 8.17583 15.7421 9.295C15.8637 9.757 15.8637 10.243 15.7421 10.705Z"
                          stroke="#141B34"
                          strokeWidth="1.5"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span className="text-black text-base">Replay</span>
                    </button>
                  </div>
                </div>

                {/* Booking Details (only for booking status) */}
                {call.status === "booking" && call.bookingDetails && (
                  <div className="flex justify-between items-center p-3 bg-green-50 border border-green-200 rounded-lg">
                    <span className="text-green-800 text-base">
                      {call.bookingDetails}
                    </span>
                    <span className="text-green-500 text-base">
                      {call.bookingTime}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Notification Popup */}
      <NotificationPopup 
        notifications={notifications}
        isVisible={showNotifications}
        onClose={closeNotifications}
        notificationCount={notificationCount}
      />

      {/* Popups */}
      {showTranscript && renderTranscriptPopup()}
      {showReplay && renderReplayPopup()}
    </div>
  );
};

export default CallLogs;