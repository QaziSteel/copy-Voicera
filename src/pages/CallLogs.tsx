import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import NotificationPopup from "@/components/NotificationPopup";
import { DateFilterPopup } from "@/components/DateFilterPopup";
import { useDateFilter } from "@/hooks/useDateFilter";
import { Header } from "@/components/shared/Header";
import { useCallLogs } from "@/hooks/useCallLogs";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const CallLogs: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
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

  // Get real call logs from database
  const { callLogs, loading } = useCallLogs(searchTerm);
  const { play, pause, stop, isPlaying } = useAudioPlayer();
  const [currentlyPlayingPath, setCurrentlyPlayingPath] = useState<string | null>(null);

  // Reset currently playing when audio stops
  useEffect(() => {
    if (!isPlaying) {
      setCurrentlyPlayingPath(null);
    }
  }, [isPlaying]);

  const getStatusStyle = (endedReason: string | null) => {
    // Since we're treating all calls as information inquiries for now
    return "bg-blue-100 text-blue-600";
  };

  const getStatusText = (endedReason: string | null) => {
    // For now, treat all calls as information inquiries
    return "Information Inquiry";
  };

  const formatDuration = (totalCallTime: number | null): string => {
    if (!totalCallTime) return "0:00";
    const minutes = Math.floor(totalCallTime / 60);
    const seconds = totalCallTime % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatTimestamp = (timestamp: string | null): string => {
    if (!timestamp) return "Unknown";
    return new Date(timestamp).toLocaleString();
  };

  const getSignedUrl = async (bucket: string, path: string) => {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, 3600); // 1 hour expiry
      
      if (error) throw error;
      return data.signedUrl;
    } catch (error) {
      console.error('Error getting signed URL:', error);
      return null;
    }
  };

  const handlePlayRecording = async (recordingPath: string) => {
    try {
      const signedUrl = await getSignedUrl('call-recordings', recordingPath);
      if (signedUrl) {
        if (isPlaying && currentlyPlayingPath === recordingPath) {
          pause();
          setCurrentlyPlayingPath(null);
        } else {
          stop(); // Stop any current playback
          setCurrentlyPlayingPath(recordingPath);
          play(signedUrl);
        }
      }
    } catch (error) {
      console.error('Error playing recording:', error);
    }
  };

  const handleDownloadTranscript = async (transcriptPath: string) => {
    try {
      const signedUrl = await getSignedUrl('call-transcripts', transcriptPath);
      if (signedUrl) {
        // Create a temporary link to download the file
        const link = document.createElement('a');
        link.href = signedUrl;
        link.download = transcriptPath.split('/').pop() || 'transcript.txt';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Error downloading transcript:', error);
    }
  };

  const handleViewTranscript = async (transcriptPath: string) => {
    try {
      const signedUrl = await getSignedUrl('call-transcripts', transcriptPath);
      if (signedUrl) {
        // Open transcript in new tab
        window.open(signedUrl, '_blank');
      }
    } catch (error) {
      console.error('Error viewing transcript:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <Header currentPage="call-logs" />

      {/* Main Content */}
      <main className="px-3 md:px-6 lg:px-12 py-6">
        {/* Page Header */}
        <div className="flex justify-between items-end mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-black mb-1">
              Call Logs
            </h1>
            <p className="text-lg font-semibold text-gray-500">
              View and analyze all call interactions
            </p>
          </div>

          <div className="flex gap-3">
            {/* Search */}
            <div className="flex items-center gap-4 px-4 py-2 bg-white border border-gray-200 rounded-lg">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
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
                className="text-gray-500 text-sm bg-transparent border-none outline-none w-72"
              />
            </div>

            {/* Today Button */}
            <button 
              onClick={openDateFilter}
              className="bg-black text-white px-3 py-2 rounded-lg flex items-center gap-2"
            >
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
              <span className="text-sm font-medium">Today</span>
            </button>
          </div>
        </div>

        {/* Call History */}
        <div className="bg-white rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-black mb-4">Call History</h2>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading calls...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {callLogs.map((call) => (
                <div
                  key={call.id}
                  className="flex items-start gap-4 p-4 border border-gray-200 rounded-xl"
                >
                  {/* Call Icon */}
                  <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mt-1">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M9.1585 5.71223L8.75584 4.80625C8.49256 4.21388 8.36092 3.91768 8.16405 3.69101C7.91732 3.40694 7.59571 3.19794 7.23592 3.08785C6.94883 3 6.6247 3 5.97645 3C5.02815 3 4.554 3 4.15597 3.18229C3.68711 3.39702 3.26368 3.86328 3.09497 4.3506C2.95175 4.76429 2.99278 5.18943 3.07482 6.0397C3.94815 15.0902 8.91006 20.0521 17.9605 20.9254C18.8108 21.0075 19.236 21.0485 19.6496 20.9053C20.137 20.7366 20.6032 20.3131 20.818 19.8443C21.0002 19.4462 21.0002 18.9721 21.0002 18.0238C21.0002 17.3755 21.0002 17.0514 20.9124 16.7643C20.8023 16.4045 20.5933 16.0829 20.3092 15.8362C20.0826 15.6393 19.7864 15.5077 19.194 15.2444L18.288 14.8417C17.6465 14.5566 17.3257 14.4141 16.9998 14.3831C16.6878 14.3534 16.3733 14.3972 16.0813 14.5109C15.7762 14.6297 15.5066 14.8544 14.9672 15.3038C14.4304 15.7512 14.162 15.9749 13.834 16.0947C13.5432 16.2009 13.1588 16.2403 12.8526 16.1951C12.5071 16.1442 12.2426 16.0029 11.7135 15.7201C10.0675 14.8405 9.15977 13.9328 8.28011 12.2867C7.99738 11.7577 7.85602 11.4931 7.80511 11.1477C7.75998 10.8414 7.79932 10.457 7.90554 10.1663C8.02536 9.83828 8.24905 9.56986 8.69643 9.033C9.14586 8.49368 9.37058 8.22402 9.48939 7.91891C9.60309 7.62694 9.64686 7.3124 9.61719 7.00048C9.58618 6.67452 9.44362 6.35376 9.1585 5.71223Z"
                        stroke="#6B7280"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>

                  {/* Call Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-medium text-black">{call.id}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-gray-500 capitalize">
                            {call.type || 'Incoming'}
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusStyle(call.ended_reason)}`}
                          >
                            {getStatusText(call.ended_reason)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        <div>{formatTimestamp(call.started_at)}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        <div>📞 {call.phone_number}</div>
                        {call.customer_number && (
                          <div>📞 Customer: {call.customer_number}</div>
                        )}
                        <div>⏱️ Duration: {formatDuration(call.total_call_time)}</div>
                      </div>
                      
                      {/* Recording and Transcript Controls */}
                      <div className="flex items-center gap-2">
                        {call.recording_file_path && (
                          <button
                            onClick={() => handlePlayRecording(call.recording_file_path!)}
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
                            <span className="text-black text-base">
                              {isPlaying && currentlyPlayingPath === call.recording_file_path ? "Pause" : "Replay"}
                            </span>
                          </button>
                        )}
                        
                        {call.transcript_file_path && (
                          <button
                            onClick={() => handleViewTranscript(call.transcript_file_path!)}
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
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Empty State */}
              {callLogs.length === 0 && (
                <div className="text-center py-12">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400 mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No calls yet
                  </h3>
                  <p className="text-gray-500">
                    When calls come in, they'll appear here.
                  </p>
                </div>
              )}
            </div>
          )}
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
    </div>
  );
};

export default CallLogs;