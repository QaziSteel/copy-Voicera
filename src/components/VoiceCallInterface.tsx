import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useVapiCall } from '@/hooks/useVapiCall';
import { Mic, MicOff, Phone, PhoneOff, Volume2, VolumeX, Play, Pause, Square } from 'lucide-react';

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
  // Check if assistant_id exists in agentData
  const hasAssistantId = agentData?.assistant_id;
  
  const {
    startCall,
    endCall,
    toggleMute,
    isConnecting,
    isCallActive,
    isMuted,
    error,
    transcript,
    callMetrics,
    formatDuration
  } = useVapiCall();

  const handleStartCall = async () => {
    if (!hasAssistantId) {
      console.error('No assistant ID found for this agent');
      return;
    }

    const config = {
      assistantId: agentData.assistant_id
    };
    
    console.log('Using Assistant ID:', config.assistantId);
    console.log('Final call config:', config);
    await startCall(config);
  };

  // Mock data for previous calls
  const mockPreviousCalls = [
    {
      id: 1,
      phone: "+1 (555) 987-6543",
      duration: "1:35",
      timestamp: "01/08/2025, 15:16:07"
    },
    {
      id: 2,
      phone: "+1 (555) 123-4567",
      duration: "2:12",
      timestamp: "01/08/2025, 14:45:22"
    },
    {
      id: 3,
      phone: "+1 (555) 456-7890",
      duration: "0:58",
      timestamp: "01/08/2025, 13:28:15"
    }
  ];

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
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
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
                  onClick={endCall}
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

            {/* Previous Calls List */}
            {!isCallActive && !isConnecting && (
              <div className="space-y-3">
                {mockPreviousCalls.map((call) => (
                  <div key={call.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <Phone className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{call.phone}</p>
                        <p className="text-sm text-gray-500">{call.timestamp}</p>
                      </div>
                      <span className="text-sm text-gray-600">{call.duration}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="text-xs">
                        Transcript
                      </Button>
                      <Button variant="outline" size="sm" className="text-xs">
                        Replay
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Live Transcript */}
          {transcript && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-2">
              <h3 className="text-lg font-medium text-black">Live Transcript</h3>
              <div className="bg-gray-50 rounded-lg p-4 max-h-32 overflow-y-auto">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap">{transcript}</pre>
              </div>
            </div>
          )}
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
                    ? 'bg-gray-300 cursor-not-allowed' 
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
                disabled={!isCallActive}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                  !isCallActive 
                    ? 'bg-gray-300 cursor-not-allowed text-gray-500' 
                    : 'bg-black hover:bg-gray-800 text-white'
                }`}
              >
                <Volume2 className="w-5 h-5" />
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