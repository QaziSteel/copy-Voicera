import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useVapiCall } from '@/hooks/useVapiCall';
import { Mic, MicOff, Phone, PhoneOff, Volume2, VolumeX } from 'lucide-react';

interface VoiceCallInterfaceProps {
  agentData?: any;
  workflowId?: string;
  assistantId?: string;
  testScenarios: string[];
}

export const VoiceCallInterface: React.FC<VoiceCallInterfaceProps> = ({
  agentData,
  workflowId,
  assistantId,
  testScenarios
}) => {
  const [customWorkflowId, setCustomWorkflowId] = useState(workflowId || '');
  const [customAssistantId, setCustomAssistantId] = useState(assistantId || '');
  const [useCustomIds, setUseCustomIds] = useState(!!workflowId || !!assistantId);
  
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
      // Ensure only one ID type is used - prioritize Assistant ID
      if (customAssistantId && customAssistantId.trim()) {
        config.assistantId = customAssistantId.trim();
        console.log('Using Assistant (string):', config.assistantId);
      } else if (customWorkflowId && customWorkflowId.trim()) {
        config.workflowId = customWorkflowId.trim();
        console.log('Using Workflow (string):', config.workflowId);
      } else {
        console.error('No valid ID provided');
        return;
      }
    } else {
      config.agentData = agentData;
      console.log('Using agent data configuration');
    }
    
    console.log('Final call config:', config);
    await startCall(config);
  };

  return (
    <div className="space-y-4">
      {/* Configuration Panel */}
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
              Use custom Workflow/Assistant ID
            </label>
          </div>
          
          {useCustomIds && (
            <div className="space-y-3">
              <div>
                <label htmlFor="workflowId" className="block text-sm font-medium text-gray-700 mb-1">
                  Workflow ID (Legacy)
                </label>
                <Input
                  id="workflowId"
                  value={customWorkflowId}
                  onChange={(e) => setCustomWorkflowId(e.target.value)}
                  placeholder="Enter your Vapi Workflow ID"
                  className="w-full"
                />
              </div>
              <div className="text-center text-sm text-gray-500">OR</div>
              <div>
                <label htmlFor="assistantId" className="block text-sm font-medium text-gray-700 mb-1">
                  Assistant ID (Recommended)
                </label>
                <Input
                  id="assistantId"
                  value={customAssistantId}
                  onChange={(e) => setCustomAssistantId(e.target.value)}
                  placeholder="Enter your Vapi Assistant ID"
                  className="w-full"
                />
              </div>
            </div>
          )}
          
          {!useCustomIds && agentData && (
            <div className="text-sm text-gray-600">
              Using agent configuration: <strong>{agentData.ai_assistant_name || agentData.business_name || 'Default Agent'}</strong>
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

      {/* Call Interface */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path
                d="M5.0823 15.8335C3.99888 15.7269 3.18725 15.4015 2.64293 14.8572C1.66663 13.8809 1.66663 12.3095 1.66663 9.16683V8.75016C1.66663 5.60746 1.66663 4.03612 2.64293 3.0598C3.61925 2.0835 5.19059 2.0835 8.33329 2.0835H11.6666C14.8093 2.0835 16.3807 2.0835 17.357 3.0598C18.3333 4.03612 18.3333 5.60746 18.3333 8.75016V9.16683C18.3333 12.3095 18.3333 13.8809 17.357 14.8572C16.3807 15.8335 14.8093 15.8335 11.6666 15.8335C11.1995 15.8439 10.8275 15.8794 10.4621 15.9627C9.46346 16.1926 8.53871 16.7036 7.62485 17.1492C6.32270 17.7842 5.67163 18.1017 5.26303 17.8044C4.48137 17.2222 5.24541 15.4184 5.41663 14.5835"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <h3 className="text-lg font-semibold text-black">Voice Test Call</h3>
            {isCallActive && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-600 font-medium">
                  {formatDuration(callMetrics.duration)}
                </span>
              </div>
            )}
          </div>

          {/* Main Call Button */}
          {!isCallActive ? (
            <Button
              onClick={handleStartCall}
              disabled={isConnecting || (useCustomIds && !customWorkflowId && !customAssistantId)}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg disabled:opacity-50"
            >
              {isConnecting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Connecting...
                </>
              ) : (
                <>
                  <Phone className="w-4 h-4 mr-2" />
                  Start Voice Call
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={endCall}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg"
            >
              <PhoneOff className="w-4 h-4 mr-2" />
              End Call
            </Button>
          )}
        </div>

        {/* Call Status */}
        <div className="mb-6">
          {isConnecting && (
            <p className="text-sm text-gray-600">
              <span className="inline-block animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600 mr-2"></span>
              Connecting to voice agent...
            </p>
          )}
          {!isCallActive && !isConnecting && (
            <p className="text-sm text-gray-600">Click "Start Voice Call" to begin testing your agent</p>
          )}
        </div>

        {/* Call Controls */}
        {isCallActive && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Call Controls</h4>
            <div className="flex justify-center gap-4">
              <Button
                onClick={toggleMute}
                variant="outline"
                size="sm"
                className={`w-12 h-12 rounded-full ${isMuted ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}
              >
                {isMuted ? (
                  <MicOff className="w-5 h-5 text-red-600" />
                ) : (
                  <Mic className="w-5 h-5 text-gray-600" />
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Audio Visualization */}
        {isCallActive && (
          <div className="mb-6">
            <div className="flex justify-center items-end gap-1 h-12">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="w-2 bg-blue-500 rounded-full pulse-bar"
                  style={{ height: `${Math.random() * 40 + 10}px` }}
                ></div>
              ))}
            </div>
          </div>
        )}

        {/* Live Transcript */}
        {transcript && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Live Transcript</h4>
            <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap">{transcript}</pre>
            </div>
          </div>
        )}

        {/* Test Scenarios (only when not in call) */}
        {!isCallActive && !isConnecting && testScenarios.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Suggested Test Scenarios</h4>
            <div className="grid grid-cols-1 gap-2">
              {testScenarios.map((scenario, index) => (
                <div
                  key={index}
                  className="p-3 border border-gray-200 rounded-lg text-sm text-gray-700 bg-gray-50"
                >
                  "{scenario}"
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Start a voice call and try asking these questions to test your agent's responses.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};