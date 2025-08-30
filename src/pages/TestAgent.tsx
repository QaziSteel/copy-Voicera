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
    "I'd like to book a haircut for tomorrow",
    "What are your business hours?",
    "How much does a beard trim cost?",
    "Can I reschedule my appointment?",
    "Do you offer hair washing services?",
    "I'm running late for my appointment"
  ]);

  const handleStartTestCall = () => {
    setShowTestCallModal(true);
  };

  const renderTestMode = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      {/* Left Column - Conversation Area */}
      <div className="space-y-4">
        {/* Live Conversation */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 h-80">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-black">Live Conversation</h3>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-600 font-medium">Active Call</span>
            </div>
          </div>
          
          <div className="space-y-3 h-64 overflow-y-auto">
            <div className="bg-blue-50 rounded-lg p-3 max-w-xs">
              <p className="text-sm text-gray-800">Hello! Thanks for calling The Gents' Chair. How can I help you today?</p>
              <span className="text-xs text-gray-500 mt-1">Agent • 2:34 PM</span>
            </div>
            <div className="bg-gray-100 rounded-lg p-3 max-w-xs ml-auto">
              <p className="text-sm text-gray-800">Hi, I'd like to book a haircut for tomorrow if possible.</p>
              <span className="text-xs text-gray-500 mt-1">Customer • 2:35 PM</span>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 max-w-xs">
              <p className="text-sm text-gray-800">Of course! What time works best for you? We have availability at 10 AM, 2 PM, and 4 PM tomorrow.</p>
              <span className="text-xs text-gray-500 mt-1">Agent • 2:35 PM</span>
            </div>
          </div>
        </div>

        {/* Call History */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-black mb-3">Recent Test Calls</h3>
          <div className="space-y-2">
            {testCalls.map((call, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                <div>
                  <p className="font-medium text-gray-900">{call.name}</p>
                  <p className="text-sm text-gray-500">{call.phone}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{call.duration}</p>
                  <p className="text-xs text-gray-500">{call.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column - Controls */}
      <div className="space-y-4">
        {/* Call Controls */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-black mb-3">Call Controls</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-4">
                <div className="w-3 h-8 bg-green-500 rounded-sm pulse-bar"></div>
                <div className="w-3 h-12 bg-green-500 rounded-sm pulse-bar"></div>
                <div className="w-3 h-6 bg-green-500 rounded-sm pulse-bar"></div>
                <div className="w-3 h-10 bg-green-500 rounded-sm pulse-bar"></div>
                <div className="w-3 h-4 bg-green-500 rounded-sm pulse-bar"></div>
              </div>
            </div>
            
            <div className="flex justify-center gap-4">
              <button className="w-14 h-14 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-colors">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M16 2H8C7.45 2 7 2.45 7 3V21C7 21.55 7.45 22 8 22H16C16.55 22 17 21.55 17 21V3C17 2.45 16.55 2 16 2Z" fill="currentColor"/>
                </svg>
              </button>
              <button className="w-14 h-14 bg-gray-500 hover:bg-gray-600 rounded-full flex items-center justify-center text-white transition-colors">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3Z" fill="currentColor"/>
                </svg>
              </button>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Call Duration: <span className="font-medium">2m 34s</span></p>
              <Button onClick={handleStartTestCall} className="w-full">
                Start New Test Call
              </Button>
            </div>
          </div>
        </div>

        {/* Test Scenarios */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-black mb-3">Test Scenarios</h3>
          <div className="space-y-2">
            {testScenarios.map((scenario, index) => (
              <button
                key={index}
                className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors text-sm"
              >
                {scenario}
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