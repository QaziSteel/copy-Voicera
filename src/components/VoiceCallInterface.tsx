import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useVapiCall } from '@/hooks/useVapiCall';
import { useTestCallLogs } from '@/hooks/useTestCallLogs';
import { Mic, MicOff, Phone, PhoneOff, Volume2, VolumeX, Play, Pause, Square, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface VoiceCallInterfaceProps {
  agentData?: any;
  assistantId?: string;
  testScenarios: string[];
}

export const VoiceCallInterface: React.FC<VoiceCallInterfaceProps> = ({
  agentData,
  assistantId,
  testScenarios
}) => {
  const [currentTestCallId, setCurrentTestCallId] = useState<string | null>(null);
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);
  const [selectedTranscript, setSelectedTranscript] = useState<string | null>(null);
  const [transcriptLoading, setTranscriptLoading] = useState(false);
  
  // Check if assistant_id exists in agentData
  const hasAssistantId = agentData?.assistant_id;
  
  const { 
    startCall, 
    endCall, 
    toggleMute, 
    toggleVolume,
    isConnecting, 
    isCallActive, 
    isMuted, 
    isVolumeOff,
    error, 
    transcript, 
    callMetrics, 
    formatDuration 
  } = useVapiCall();
  
  const { testCallLogs, loading: testCallLogsLoading, createTestCallLog, updateTestCallLog, refetch: refetchTestCallLogs } = useTestCallLogs(agentData?.id || '');

  const fetchTranscript = useCallback(async (transcriptFilePath: string) => {
    setTranscriptLoading(true);
    try {
      const { data, error } = await supabase.storage
        .from('call-transcripts')
        .download(transcriptFilePath);

      if (error) throw error;

      const text = await data.text();
      setSelectedTranscript(text);
    } catch (error) {
      console.error('Error fetching transcript:', error);
      setSelectedTranscript('Error loading transcript. Please try again.');
    } finally {
      setTranscriptLoading(false);
    }
  }, []);

  const handleCallRecordClick = useCallback((callId: string, transcriptFilePath: string | null) => {
    if (selectedCallId === callId) {
      setSelectedCallId(null);
      setSelectedTranscript(null);
    } else {
      setSelectedCallId(callId);
      setSelectedTranscript(null);
      if (transcriptFilePath) {
        fetchTranscript(transcriptFilePath);
      }
    }
  }, [selectedCallId, fetchTranscript]);

  const handleStartCall = async () => {
    setSelectedCallId(null);
    setSelectedTranscript(null);
    if (!hasAssistantId) {
      console.error('No assistant ID found for this agent');
      return;
    }

    const handleCallStart = async (resolve: (callId: string) => void) => {
      try {
        console.log('Creating test call log...');
        const testCallLog = await createTestCallLog({
          agent_id: agentData?.id || '',
          project_id: agentData?.project_id || '',
          assistant_id: agentData?.assistant_id || '',
          call_started_at: new Date().toISOString(),
        });
        console.log('Test call log created:', testCallLog.id);
        setCurrentTestCallId(testCallLog.id);
        resolve(testCallLog.id);
      } catch (error) {
        console.error('Error creating test call log:', error);
        resolve(`fallback-${Date.now()}`);
      }
    };

    const handleCallEnd = async (callId: string, duration: number) => {
      console.log('handleCallEnd called with:', { callId, duration, currentTestCallId });
      
      // Use the passed callId if it matches our current test call ID, otherwise use currentTestCallId
      const testCallIdToUpdate = callId === currentTestCallId ? callId : currentTestCallId;
      
      if (testCallIdToUpdate) {
        try {
          console.log('Updating test call log:', testCallIdToUpdate);
          const result = await updateTestCallLog({
            id: testCallIdToUpdate,
            call_ended_at: new Date().toISOString(),
            duration_seconds: duration,
          });
          console.log('Test call log updated successfully:', result);
        } catch (error) {
          console.error('Error updating test call log:', error);
        } finally {
          setCurrentTestCallId(null);
        }
      } else {
        console.warn('No test call ID to update');
      }
    };

    const handleVapiCallStart = async (vapiCallId: string, testCallId: string) => {
      console.log('Updating test call log with Vapi call ID:', { vapiCallId, testCallId });
      try {
        await updateTestCallLog({
          id: testCallId,
          vapi_call_id: vapiCallId,
        });
        console.log('Test call log updated with Vapi call ID successfully');
      } catch (error) {
        console.error('Error updating test call log with Vapi call ID:', error);
      }
    };

    const config = {
      assistantId: agentData.assistant_id,
      onCallStart: handleCallStart,
      onCallEnd: handleCallEnd,
      onVapiCallStart: handleVapiCallStart,
    };
    
    console.log('Using Assistant ID:', config.assistantId);
    await startCall(config);
  };

  const formatTestCallDuration = (durationSeconds: number | null) => {
    if (!durationSeconds) return '0s';
    const minutes = Math.floor(durationSeconds / 60);
    const seconds = durationSeconds % 60;
    return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const callTime = new Date(timestamp);
    const diffMs = now.getTime() - callTime.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} mins ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days ago`;
  };

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column - Test Conversation & Live Transcript */}
        <div className="lg:col-span-3 space-y-6">
          {/* Test Conversation Section */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 h-full">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-black mb-1">Test Conversation</h2>
                <p className="text-sm text-gray-600">Start a test call to begin conversation</p>
              </div>
              {!isCallActive ? (
                <button
                  onClick={handleStartCall}
                  disabled={isConnecting || !hasAssistantId}
                  className="flex items-center gap-2.5 px-4 py-2 bg-black hover:bg-gray-800 disabled:bg-gray-400 text-white rounded-xl transition-colors"
                >
                  {isConnecting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Connecting...
                    </>
                  ) : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path
                          d="M15.7421 10.705C15.4475 11.8242 14.0555 12.615 11.2714 14.1968C8.57996 15.7258 7.23429 16.4903 6.14982 16.183C5.70146 16.0559 5.29295 15.8147 4.96349 15.4822C4.16663 14.6782 4.16663 13.1188 4.16663 10C4.16663 6.88117 4.16663 5.32175 4.96349 4.51777C5.29295 4.18538 5.70146 3.94407 6.14982 3.81702C7.23429 3.50971 8.57996 4.27423 11.2714 5.80328C14.0555 7.38498 15.4475 8.17583 15.7421 9.295C15.8637 9.757 15.8637 10.243 15.7421 10.705Z"
                          stroke="white"
                          strokeWidth="1.5"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span className="text-white text-base">Start Test Call</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={async () => {
                    // Handle the call end with immediate update
                    if (currentTestCallId && callMetrics?.startTime) {
                      const endTime = new Date();
                      const durationSeconds = Math.floor((endTime.getTime() - callMetrics.startTime.getTime()) / 1000);
                      
                      try {
                        await updateTestCallLog({
                          id: currentTestCallId,
                          call_ended_at: endTime.toISOString(),
                          duration_seconds: durationSeconds,
                        });
                        // Refetch to ensure UI updates immediately
                        refetchTestCallLogs();
                      } catch (error) {
                        console.error('Error updating test call log:', error);
                      }
                      
                      setCurrentTestCallId(null);
                    }
                    endCall();
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm md:text-base lg:text-lg font-semibold transition-colors"
                >
                  <Square className="w-4 h-4" fill="white" />
                  End Call
                </button>
              )}
            </div>

            {/* Call Status */}
            {isCallActive && (
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-green-600 font-medium">
                    Call Active - {formatDuration(callMetrics.duration)}
                  </span>
                </div>
              </div>
            )}

            {/* Live Transcript or Previous Test Calls List */}
            {(isCallActive || isConnecting) && transcript ? (
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-black">Live Transcript</h3>
                <div className="bg-gray-50 rounded-lg p-4 max-h-[450px] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-gray-400">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">{transcript}</pre>
                </div>
              </div>
            ) : !isCallActive && !isConnecting && (
              <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2.5 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-gray-400">
                {testCallLogsLoading ? (
                  <div className="text-sm text-gray-500 text-center py-4">Loading test calls...</div>
                ) : testCallLogs.length === 0 ? (
                  <div className="text-center py-12">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400 mb-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21L6.16 11.37a11.045 11.045 0 005.469 5.469l1.983-4.064a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 7V5z"
                      />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No test calls yet</h3>
                    <p className="text-gray-500">When you test your agent, calls will appear here.</p>
                  </div>
                ) : (
                  testCallLogs.map((call) => (
                    <div key={call.id} className="space-y-2">
                      <div
                        onClick={() => handleCallRecordClick(call.id, call.transcript_file_path)}
                        className={`flex items-center justify-between p-3 rounded-lg transition-colors cursor-pointer ${
                          selectedCallId === call.id 
                            ? 'bg-blue-50 border-2 border-blue-300' 
                            : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                            <Phone className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">Test Call {call.id.slice(0, 8)}</p>
                            <p className="text-sm text-gray-500">{formatTimeAgo(call.created_at)}</p>
                          </div>
                        </div>
                        <span className="text-sm text-gray-600">
                          {formatTestCallDuration(call.duration_seconds)}
                        </span>
                      </div>

                      {selectedCallId === call.id && call.transcript_file_path && (
                        <div className="ml-4 space-y-2">
                          {transcriptLoading ? (
                            <div className="flex items-center gap-2 text-sm text-gray-500 p-3">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Loading transcript...
                            </div>
                          ) : selectedTranscript ? (
                            <div className="bg-gray-50 rounded-lg p-4 max-h-[300px] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-gray-400">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-semibold text-gray-900">Transcript</h4>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedCallId(null);
                                    setSelectedTranscript(null);
                                  }}
                                  className="text-xs text-gray-500 hover:text-gray-700 font-medium"
                                >
                                  Hide
                                </button>
                              </div>
                              <pre className="text-sm text-gray-700 whitespace-pre-wrap">{selectedTranscript}</pre>
                            </div>
                          ) : null}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Call Controls & Test Scenarios */}
        <div className="lg:col-span-2 space-y-6">
          {/* Call Controls Section */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
            <h2 className="text-xl font-semibold text-black">Call Controls</h2>
            <div className="flex justify-center gap-6">
              <button
                onClick={toggleMute}
                disabled={!isCallActive}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                  !isCallActive 
                    ? 'bg-gray-300 cursor-not-allowed text-gray-500' 
                    : isMuted 
                      ? 'bg-red-500 hover:bg-red-600 text-white' 
                      : 'bg-black hover:bg-gray-800 text-white'
                }`}
              >
                {isMuted ? (
                  <MicOff className="w-5 h-5" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </button>
              <button
                onClick={toggleVolume}
                disabled={!isCallActive}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                  !isCallActive 
                    ? 'bg-gray-300 cursor-not-allowed text-gray-500' 
                    : isVolumeOff 
                      ? 'bg-red-500 hover:bg-red-600 text-white' 
                      : 'bg-black hover:bg-gray-800 text-white'
                }`}
              >
                {isVolumeOff ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Test Scenarios Section */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-black mb-1">Test Scenarios</h2>
              <p className="text-sm text-gray-600">Try asking these common customer scenarios</p>
            </div>
            <div className="space-y-3">
              {testScenarios.map((scenario, index) => (
                <div
                  key={index}
                  className="p-3 border border-gray-200 rounded-lg bg-white text-sm text-gray-700"
                >
                  {scenario}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};