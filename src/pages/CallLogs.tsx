import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import NotificationPopup from "@/components/NotificationPopup";
import { DateFilterPopup } from "@/components/DateFilterPopup";
import { useDateFilter } from "@/hooks/useDateFilter";
import { Header } from "@/components/shared/Header";
import { useCallLogs } from "@/hooks/useCallLogs";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Play, FileText } from "lucide-react";

const CallLogs: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [showTranscriptModal, setShowTranscriptModal] = useState(false);
  const [showReplayModal, setShowReplayModal] = useState(false);
  const [selectedCall, setSelectedCall] = useState<any>(null);

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

  // Check if user is logged in
  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

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

  const handleViewTranscript = (call: any) => {
    setSelectedCall(call);
    setShowTranscriptModal(true);
  };

  const handleReplay = (call: any) => {
    setSelectedCall(call);
    setShowReplayModal(true);
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
        <div className="bg-card rounded-2xl p-6 shadow-sm border">
          <h2 className="text-lg font-semibold text-foreground mb-6">Call History</h2>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading calls...</p>
            </div>
          ) : callLogs.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-muted-foreground mb-4"
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
              <h3 className="text-lg font-medium text-foreground mb-2">
                No calls yet
              </h3>
              <p className="text-muted-foreground">
                When calls come in, they'll appear here.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Call ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Phone Number</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {callLogs.map((call) => (
                    <TableRow key={call.id}>
                      <TableCell className="font-medium">
                        {call.id.substring(0, 8)}...
                      </TableCell>
                      <TableCell className="capitalize">
                        {call.type || 'Incoming'}
                      </TableCell>
                      <TableCell>{call.phone_number}</TableCell>
                      <TableCell>{formatDuration(call.total_call_time)}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusStyle(call.ended_reason)}`}>
                          {getStatusText(call.ended_reason)}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatTimestamp(call.started_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewTranscript(call)}
                            className="text-xs"
                          >
                            <FileText className="h-3 w-3 mr-1" />
                            Transcript
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReplay(call)}
                            className="text-xs"
                          >
                            <Play className="h-3 w-3 mr-1" />
                            Replay
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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

      {/* Transcript Modal */}
      <Dialog open={showTranscriptModal} onOpenChange={setShowTranscriptModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Call Transcript</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedCall && (
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Call ID:</span> {selectedCall.id.substring(0, 8)}...
                  </div>
                  <div>
                    <span className="font-medium">Phone:</span> {selectedCall.phone_number}
                  </div>
                  <div>
                    <span className="font-medium">Duration:</span> {formatDuration(selectedCall.total_call_time)}
                  </div>
                  <div>
                    <span className="font-medium">Date:</span> {formatTimestamp(selectedCall.started_at)}
                  </div>
                </div>
              </div>
            )}
            <div className="bg-muted/30 p-6 rounded-lg text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <h3 className="font-medium text-foreground mb-2">Transcript Not Available</h3>
              <p className="text-sm text-muted-foreground">
                Call transcripts are currently being processed. This feature will be available soon.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Replay Modal */}
      <Dialog open={showReplayModal} onOpenChange={setShowReplayModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Call Replay</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedCall && (
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="text-sm space-y-2">
                  <div>
                    <span className="font-medium">Call ID:</span> {selectedCall.id.substring(0, 8)}...
                  </div>
                  <div>
                    <span className="font-medium">Phone:</span> {selectedCall.phone_number}
                  </div>
                  <div>
                    <span className="font-medium">Duration:</span> {formatDuration(selectedCall.total_call_time)}
                  </div>
                </div>
              </div>
            )}
            <div className="bg-muted/30 p-6 rounded-lg text-center">
              <Play className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <h3 className="font-medium text-foreground mb-2">Recording Not Available</h3>
              <p className="text-sm text-muted-foreground">
                Call recordings are currently being processed. This feature will be available soon.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CallLogs;