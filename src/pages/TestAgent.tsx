import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { AgentToggle } from "@/components/ui/agent-toggle";
import { Header } from "@/components/shared/Header";

const TestAgent = () => {
  const navigate = useNavigate();
  
  const [showTestCallModal, setShowTestCallModal] = useState(false);
  const [isAgentLive, setIsAgentLive] = useState(true);
  const [testCalls] = useState([
    {
      name: "John Doe",
      phone: "+1 234 567 8901",
      duration: "2m 34s",
      timestamp: "2 mins ago"
    },
    {
      name: "Jane Smith", 
      phone: "+1 234 567 8902",
      duration: "1m 45s",
      timestamp: "5 mins ago"
    },
    {
      name: "Mike Johnson",
      phone: "+1 234 567 8903", 
      duration: "3m 12s",
      timestamp: "10 mins ago"
    }
  ]);
  const [testScenarios] = useState([
    "I'd like to book an appointment",
    "What are your business hours?",
    "How much does a consultation cost?",
    "Where are you located?",
    "I need to cancel my appointment",
    "What services do you offer?"
  ]);

  const handleStartTestCall = () => {
    setShowTestCallModal(true);
  };

  const renderTestMode = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      {/* Left Column - Test Conversation */}
      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6 h-full min-h-[400px] flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-4 h-4 border border-gray-400 rounded-sm"></div>
            <h3 className="text-lg font-semibold text-black">Test Conversation</h3>
          </div>
          <p className="text-sm text-gray-600 mb-8">Start a test call to begin conversation</p>
          
          {/* Conversation Area */}
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-16 h-16 border-2 border-gray-300 rounded-lg flex items-center justify-center mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <p className="text-sm text-gray-500 text-center mb-6">Start a test call to begin conversation</p>
            
            <Button onClick={handleStartTestCall} className="bg-black hover:bg-gray-800 text-white px-6 py-2 rounded-lg">
              ▶ Start Test Call
            </Button>
          </div>
        </div>
      </div>

      {/* Right Column - Controls and Scenarios */}
      <div className="space-y-4">
        {/* Call Controls */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-black mb-4">Call Controls</h3>
          <div className="flex justify-center gap-8">
            <button className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" x2="12" y1="19" y2="22"/>
                <line x1="8" x2="16" y1="22" y2="22"/>
              </svg>
            </button>
            <button className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
                <path d="M11 5a3 3 0 1 1 4 2.82V8a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2V7.82A3 3 0 0 1 11 5Z"/>
                <path d="M8 8v9a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V8"/>
                <path d="M16 8L14 10l-4-2 2-2"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Test Scenarios */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-black mb-2">Test Scenarios</h3>
          <p className="text-sm text-gray-600 mb-4">Try asking these common customer scenarios</p>
          <div className="space-y-2">
            {testScenarios.map((scenario, index) => (
              <button
                key={index}
                className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors text-sm text-gray-700"
              >
                "{scenario}"
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(1.5); }
        }
        .pulse-bar {
          animation: pulse 1s ease-in-out infinite;
        }
        .pulse-bar:nth-child(2) { animation-delay: 0.1s; }
        .pulse-bar:nth-child(3) { animation-delay: 0.2s; }
        .pulse-bar:nth-child(4) { animation-delay: 0.3s; }
        .pulse-bar:nth-child(5) { animation-delay: 0.4s; }
      `}</style>

      {/* Header */}
      <Header currentPage="test-agent" />

      {/* Main Content */}
      <main className="px-3 md:px-6 lg:px-12 py-6">
        {/* Page Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-semibold text-black mb-1">Test Agent</h1>
          <p className="text-lg font-semibold text-gray-500">Test your AI agent with real-time scenarios</p>
        </div>

        {/* Agent Status Section */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg font-semibold text-gray-500">Agent status:</span>
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 ${isAgentLive ? 'bg-green-500' : 'bg-red-500'} rounded-full`}></div>
                <span className={`text-lg font-semibold ${isAgentLive ? 'text-green-600' : 'text-red-600'}`}>
                  {isAgentLive ? 'Live' : 'Offline'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsAgentLive(!isAgentLive)}
                className={`px-3 py-2 ${isAgentLive ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white rounded-lg text-base font-semibold transition-colors`}
              >
                {isAgentLive ? 'Go Offline' : 'Go Live'}
              </button>
              <AgentToggle />
            </div>
          </div>
        </div>

        {/* Test Agent Content */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 min-h-[500px]">
          {renderTestMode()}
        </div>
      </main>


      {/* Test Call Modal */}
      {showTestCallModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">Start Test Call</h3>
            <p className="text-gray-600 mb-6">This will initiate a test call with your AI agent. You can use this to test different scenarios and responses.</p>
            <div className="flex gap-3">
              <Button onClick={() => setShowTestCallModal(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button onClick={() => setShowTestCallModal(false)} className="flex-1">
                Start Call
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestAgent;