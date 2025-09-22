import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  const [customAssistantId, setCustomAssistantId] = useState(assistantId || '');
  const [useCustomIds, setUseCustomIds] = useState(!!assistantId);
  
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
    const config: any = {};
    
    if (useCustomIds) {
      if (customAssistantId && customAssistantId.trim()) {
        config.assistantId = customAssistantId.trim();
        console.log('Using Assistant ID:', config.assistantId);
      } else {
        console.error('No assistant ID provided');
        return;
      }
    } else {
      config.agentData = agentData;
      console.log('Using agent data configuration');
    }
    
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
    <div className="space-y-8">
      {/* Configuration Panel - Hidden when call is active */}
      {!isCallActive && !isConnecting && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="useCustomIds"
              checked={useCustomIds}
              onChange={(e) => setUseCustomIds(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="useCustomIds" className="text-sm font-medium">
              Use custom Assistant ID
            </label>
          </div>
          
          {useCustomIds && (
            <div>
              <label htmlFor="assistantId" className="block text-sm font-medium text-gray-700 mb-1">
                Assistant ID
              </label>
              <Input
                id="assistantId"
                value={customAssistantId}
                onChange={(e) => setCustomAssistantId(e.target.value)}
                placeholder="Enter your Vapi Assistant ID"
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Find your Assistant ID in the Vapi Dashboard under Assistants
              </p>
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Test Conversation Section */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-black mb-1">Test Conversation</h2>
          <p className="text-sm text-gray-600">Start a test call to begin conversation</p>
        </div>

        {/* Main Call Button */}
        <div className="flex justify-center">
          {!isCallActive ? (
            <button
              onClick={handleStartCall}
              disabled={isConnecting || (useCustomIds && !customAssistantId)}
              className="w-16 h-16 bg-black hover:bg-gray-800 disabled:bg-gray-400 text-white rounded-full flex items-center justify-center transition-colors"
            >
              {isConnecting ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              ) : (
                <Play className="w-6 h-6 ml-1" fill="white" />
              )}
            </button>
          ) : (
            <button
              onClick={endCall}
              className="w-16 h-16 bg-black hover:bg-gray-800 text-white rounded-full flex items-center justify-center transition-colors"
            >
              <Square className="w-6 h-6" fill="white" />
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

      {/* Call Controls Section */}
      <div className="space-y-4">
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

      {/* Live Transcript */}
      {transcript && (
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-black">Live Transcript</h3>
          <div className="bg-gray-50 rounded-lg p-4 max-h-32 overflow-y-auto">
            <pre className="text-sm text-gray-700 whitespace-pre-wrap">{transcript}</pre>
          </div>
        </div>
      )}

      {/* Test Scenarios Section */}
      <div className="space-y-4">
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
  );
};