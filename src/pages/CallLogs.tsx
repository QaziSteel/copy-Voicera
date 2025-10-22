import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProject } from "@/contexts/ProjectContext";
import { useNotifications } from "@/hooks/useNotifications";
import NotificationPopup from "@/components/NotificationPopup";
import { DateFilterPopup } from "@/components/DateFilterPopup";
import { useDateFilter } from "@/hooks/useDateFilter";
import { Header } from "@/components/shared/Header";
import { useCallLogs } from "@/hooks/useCallLogs";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, Clock, Calendar } from "lucide-react";
import { getMaskedCustomerData, getMaskedBookingCustomerName } from "@/lib/customerDataMasking";

const CallLogs: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { canViewCustomerData } = useProject();
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

  // Get real call logs from database
  const { callLogs: rawCallLogs, loading } = useCallLogs(searchTerm, getDateFilter(), filterVersion);
  
  // Apply customer data masking based on user role
  const callLogs = rawCallLogs.map(log => {
    const maskedLog = getMaskedCustomerData(log, canViewCustomerData());
    return {
      ...maskedLog,
      booking_customer_name: getMaskedBookingCustomerName(log.booking_customer_name, canViewCustomerData())
    };
  });
  
  const audioPlayer = useAudioPlayer();
  const [currentlyPlayingPath, setCurrentlyPlayingPath] = useState<string | null>(null);
  const [showAudioPlayer, setShowAudioPlayer] = useState<boolean>(false);
  const [selectedCallForPlayer, setSelectedCallForPlayer] = useState<any>(null);
  const [currentCallIndex, setCurrentCallIndex] = useState<number>(0);
  
  // Transcript popup state
  const [showTranscript, setShowTranscript] = useState<boolean>(false);
  const [selectedTranscript, setSelectedTranscript] = useState<any>(null);
  const [transcriptContent, setTranscriptContent] = useState<Array<{speaker: string, role: string, message: string}>>([]);

  // Reset currently playing when audio stops
  useEffect(() => {
    if (!audioPlayer.isPlaying) {
      setCurrentlyPlayingPath(null);
    }
  }, [audioPlayer.isPlaying]);

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

  const handlePlayRecording = async (call: any) => {
    // Find calls with recordings for navigation
    const callsWithRecordings = callLogs.filter(c => c.recording_file_path);
    const callIndex = callsWithRecordings.findIndex(c => c.id === call.id);
    
    setSelectedCallForPlayer(call);
    setCurrentCallIndex(callIndex);
    setShowAudioPlayer(true);
    
    try {
      const signedUrl = await getSignedUrl('call-recordings', call.recording_file_path);
      if (signedUrl) {
        await audioPlayer.play(signedUrl);
      }
    } catch (error) {
      console.error('Error playing recording:', error);
    }
  };

  const handleCloseAudioPlayer = () => {
    setShowAudioPlayer(false);
    setSelectedCallForPlayer(null);
    audioPlayer.stop();
  };

  const handlePreviousCall = async () => {
    const callsWithRecordings = callLogs.filter(c => c.recording_file_path);
    if (callsWithRecordings.length === 0) return;
    
    const newIndex = currentCallIndex > 0 ? currentCallIndex - 1 : callsWithRecordings.length - 1;
    const previousCall = callsWithRecordings[newIndex];
    
    setSelectedCallForPlayer(previousCall);
    setCurrentCallIndex(newIndex);
    
    try {
      const signedUrl = await getSignedUrl('call-recordings', previousCall.recording_file_path);
      if (signedUrl) {
        await audioPlayer.play(signedUrl);
      }
    } catch (error) {
      console.error('Error playing previous recording:', error);
    }
  };

  const handleNextCall = async () => {
    const callsWithRecordings = callLogs.filter(c => c.recording_file_path);
    if (callsWithRecordings.length === 0) return;
    
    const newIndex = currentCallIndex < callsWithRecordings.length - 1 ? currentCallIndex + 1 : 0;
    const nextCall = callsWithRecordings[newIndex];
    
    setSelectedCallForPlayer(nextCall);
    setCurrentCallIndex(newIndex);
    
    try {
      const signedUrl = await getSignedUrl('call-recordings', nextCall.recording_file_path);
      if (signedUrl) {
        await audioPlayer.play(signedUrl);
      }
    } catch (error) {
      console.error('Error playing next recording:', error);
    }
  };

  const handleTogglePlayback = async () => {
    if (!selectedCallForPlayer) return;

    if (audioPlayer.isPlaying) {
      audioPlayer.pause();
    } else {
      const signedUrl = await getSignedUrl('call-recordings', selectedCallForPlayer.recording_file_path);
      if (signedUrl) {
        try {
          await audioPlayer.play(signedUrl);
        } catch (error) {
          console.error('Error playing recording:', error);
        }
      }
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleSeek = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!audioPlayer.duration) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * audioPlayer.duration;
    
    audioPlayer.seek(newTime);
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

  const parseTranscript = (content: string) => {
    const lines = content.split('\n').filter(line => line.trim());
    const messages = [];
    
    for (const line of lines) {
      if (line.startsWith('AI:')) {
        const message = line.replace('AI:', '').trim();
        // Extract AI name from message like "Hello. This is Morgan from VoiceAera AI."
        let aiName = 'Voicera AI';
        if (message.includes('from ') && message.includes('AI')) {
          const fromIndex = message.indexOf('from ');
          const nameSection = message.substring(fromIndex + 5);
          const periodIndex = nameSection.indexOf('.');
          if (periodIndex > 0) {
            aiName = nameSection.substring(0, periodIndex).trim();
          }
        }
        messages.push({
          speaker: 'AI Agent',
          role: aiName,
          message: message
        });
      } else if (line.startsWith('User:')) {
        const message = line.replace('User:', '').trim();
        messages.push({
          speaker: 'Customer',
          role: 'Customer',
          message: message
        });
      }
    }
    
    return messages;
  };

  const fetchAndParseTranscript = async (transcriptPath: string) => {
    try {
      const signedUrl = await getSignedUrl('call-transcripts', transcriptPath);
      if (!signedUrl) {
        throw new Error('Failed to get transcript URL');
      }
      
      const response = await fetch(signedUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch transcript');
      }
      
      const content = await response.text();
      const parsed = parseTranscript(content);
      
      return parsed;
    } catch (error) {
      console.error('Error fetching and parsing transcript:', error);
      return [];
    }
  };

  const handleOpenTranscript = async (call: any) => {
    if (!call.transcript_file_path) return;
    
    // Clear previous transcript content immediately
    setTranscriptContent([]);
    setSelectedTranscript(call);
    setShowTranscript(true);
    
    const parsed = await fetchAndParseTranscript(call.transcript_file_path);
    setTranscriptContent(parsed);
  };

  const handleCloseTranscript = () => {
    setShowTranscript(false);
    setSelectedTranscript(null);
    setTranscriptContent([]);
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
                placeholder="Search by customer or business number"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="text-gray-500 text-sm bg-transparent border-none outline-none w-80"
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
              <span className="text-sm font-medium">{getButtonText()}</span>
            </button>
          </div>
        </div>

        {/* Call History */}
        <div className="bg-white rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-black">Call History</h2>
          </div>
          
          <div className="max-h-[calc(100vh-280px)] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-gray-400 p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Loading calls...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {callLogs.map((call, index) => (
                  <div
                    key={call.id}
                    className="bg-card border border-border rounded-2xl p-4 hover:shadow-lg transition-shadow"
                  >
                    {/* Horizontal Call Log Layout */}
                    <div className="flex items-center justify-between gap-4">
                      {/* Call ID */}
                      <div className="flex-shrink-0">
                        <span className="text-sm font-semibold text-foreground">
                          Call {call.id}
                        </span>
                      </div>

                      {/* Status Badges */}
                      <div className="flex gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {call.type === 'outbound' ? 'Outgoing' : 'Incoming'}
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            call.ended_reason === 'voicemail' || call.ended_reason === 'customer-did-not-give-microphone-permission'
                              ? 'bg-gray-50 text-gray-600 border-gray-200'
                              : call.booking_id 
                              ? 'bg-green-50 text-green-600 border-green-200' 
                              : 'bg-blue-50 text-blue-600 border-blue-200'
                          }`}
                        >
                          {call.ended_reason === 'voicemail' || call.ended_reason === 'customer-did-not-give-microphone-permission'
                            ? 'Dropped'
                            : call.booking_id ? 'Booking' : 'Inquiry'}
                        </Badge>
                      </div>

                      {/* Phone Number */}
                      <div className="flex items-center gap-2 min-w-0">
                        <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm text-foreground truncate">
                          {call.customer_number || call.phone_number}
                        </span>
                      </div>

                      {/* Duration */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">
                          {formatDuration(call.total_call_time)}
                        </span>
                      </div>

                      {/* Date & Time */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <div className="text-right">
                          <div className="text-sm text-foreground">
                            {new Date(call.started_at).toLocaleTimeString('en-US', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(call.started_at).toLocaleDateString('en-US', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3 flex-shrink-0">
                        <button 
                          onClick={() => handleOpenTranscript(call)}
                          disabled={!call.transcript_file_path}
                          className="flex items-center gap-2.5 px-4 py-2 border border-border rounded-xl hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path
                              d="M5.0823 15.8335C3.99888 15.7269 3.18725 15.4015 2.64293 14.8572C1.66663 13.8809 1.66663 12.3095 1.66663 9.16683V8.75016C1.66663 5.60746 1.66663 4.03612 2.64293 3.0598C3.61925 2.0835 5.19059 2.0835 8.33329 2.0835H11.6666C14.8093 2.0835 16.3807 2.0835 17.357 3.0598C18.3333 4.03612 18.3333 5.60746 18.3333 8.75016V9.16683C18.3333 12.3095 18.3333 13.8809 17.357 14.8572C16.3807 15.8335 14.8093 15.8335 11.6666 15.8335C11.1995 15.8439 10.8275 15.8794 10.4621 15.9627C9.46346 16.1926 8.53871 16.7036 7.62485 17.1492C6.32270 17.7842 5.67163 18.1017 5.26303 17.8044C4.48137 17.2222 5.24541 15.4184 5.41663 14.5835"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                            />
                          </svg>
                          <span className="text-foreground text-base">Transcript</span>
                        </button>
                        
                        <button 
                          onClick={() => handlePlayRecording(call)}
                          disabled={!call.recording_file_path}
                          className="flex items-center gap-2.5 px-4 py-2 border border-border rounded-xl hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path
                              d="M15.7421 10.705C15.4475 11.8242 14.0555 12.615 11.2714 14.1968C8.57996 15.7258 7.23429 16.4903 6.14982 16.183C5.70146 16.0559 5.29295 15.8147 4.96349 15.4822C4.16663 14.6782 4.16663 13.1188 4.16663 10C4.16663 6.88117 4.16663 5.32175 4.96349 4.51777C5.29295 4.18538 5.70146 3.94407 6.14982 3.81702C7.23429 3.50971 8.57996 4.27423 11.2714 5.80328C14.0555 7.38498 15.4475 8.17583 15.7421 9.295C15.8637 9.757 15.8637 10.243 15.7421 10.705Z"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinejoin="round"
                            />
                          </svg>
                          <span className="text-foreground text-base">Replay</span>
                        </button>
                      </div>
                    </div>

                    {/* Booking information */}
                    {call.booking_id && (
                      <div className="mt-4 p-3 rounded-lg bg-green-50 border border-green-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-green-800">
                              Booking: {call.booking_customer_name}
                              {call.booking_service_type && ` - ${call.booking_service_type}`}
                            </span>
                          </div>
                          <div className="text-sm text-green-700">
                            {call.booking_appointment_date && call.booking_appointment_time && (
                              <>
                                {new Date(call.booking_appointment_date).toLocaleDateString()} at{' '}
                                {new Date(`2000-01-01T${call.booking_appointment_time}`).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
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

      {/* Audio Player Popup */}
      {showAudioPlayer && selectedCallForPlayer && (
        <div className="fixed inset-0 bg-black bg-opacity-20 flex justify-center items-center z-50">
          <div className="bg-white rounded-2xl w-[800px] shadow-lg">
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b border-gray-200">
              <h3 className="text-xl font-medium text-gray-800">
                Call Recording Playback – {selectedCallForPlayer.id}
              </h3>
              <button
                onClick={handleCloseAudioPlayer}
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
                <button onClick={handlePreviousCall} className="p-2">
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

                {/* Play/Pause Button */}
                <button 
                  onClick={handleTogglePlayback}
                  className="w-12 h-12 bg-black rounded-full flex items-center justify-center"
                >
                  {audioPlayer.isPlaying ? (
                    // Pause icon
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <rect x="9" y="6" width="2" height="12" fill="white" rx="1"/>
                      <rect x="13" y="6" width="2" height="12" fill="white" rx="1"/>
                    </svg>
                  ) : (
                    // Play icon
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M18.8906 12.846C18.5371 14.189 16.8667 15.138 13.5257 17.0361C10.296 18.8709 8.6812 19.7884 7.37983 19.4196C6.8418 19.2671 6.35159 18.9776 5.95624 18.5787C5 17.6139 5 15.7426 5 12C5 8.2574 5 6.3861 5.95624 5.42132C6.35159 5.02245 6.8418 4.73288 7.37983 4.58042C8.6812 4.21165 10.296 5.12907 13.5257 6.96393C16.8667 8.86197 18.5371 9.811 18.8906 11.154C19.0365 11.7084 19.0365 12.2916 18.8906 12.846Z"
                        fill="white"
                      />
                    </svg>
                  )}
                </button>

                {/* Next Button */}
                <button onClick={handleNextCall} className="p-2">
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

                {/* Current Time */}
                <span className="text-gray-500 text-base ml-4">
                  {formatTime(audioPlayer.currentTime)}
                </span>

                {/* Progress Bar */}
                <div 
                  className="flex-1 mx-4 relative cursor-pointer" 
                  onClick={handleSeek}
                >
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div 
                      className="h-2 bg-black rounded-l-full transition-all duration-100"
                      style={{ 
                        width: audioPlayer.duration > 0 
                          ? `${(audioPlayer.currentTime / audioPlayer.duration) * 100}%` 
                          : '0%' 
                      }}
                    ></div>
                    <div 
                      className="w-1 h-4 bg-black rounded-full absolute -top-1 transition-all duration-100"
                      style={{ 
                        left: audioPlayer.duration > 0 
                          ? `${(audioPlayer.currentTime / audioPlayer.duration) * 100}%` 
                          : '0%' 
                      }}
                    ></div>
                  </div>
                </div>

                {/* Total Time */}
                <span className="text-gray-500 text-base">
                  {formatTime(audioPlayer.duration)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transcript Popup */}
      {showTranscript && selectedTranscript && (
        <div className="fixed inset-0 bg-black bg-opacity-20 flex justify-center items-center z-50" onClick={handleCloseTranscript}>
          <div className="bg-white rounded-2xl w-[700px] overflow-hidden shadow-lg" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b border-gray-200">
              <h3 className="text-xl font-medium text-gray-800">
                Call Transcript – {formatTimestamp(selectedTranscript.started_at)}
              </h3>
              <button
                onClick={handleCloseTranscript}
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
            <div className="max-h-[calc(90vh-80px)] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-gray-400 p-5">
              <div className="space-y-4">
                {transcriptContent.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Loading transcript...
                  </div>
                ) : (
                  transcriptContent.map((message, index) => (
                    <div key={index} className="flex gap-4 pb-4">
                      <div className="flex-1">
                        <div className="mb-3">
                          <div className="text-xl font-medium text-black">{message.speaker}</div>
                          <div className="text-gray-500 text-base">{message.role}</div>
                        </div>
                        <div className="p-3 border border-gray-200 rounded-xl">
                          <div className="text-gray-600">{message.message}</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CallLogs;