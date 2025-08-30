import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { AgentToggle } from "@/components/ui/agent-toggle";
import { useNotifications } from "@/hooks/useNotifications";
import NotificationPopup from "@/components/NotificationPopup";

const TestAgent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { notifications, showNotifications, openNotifications, closeNotifications, notificationCount } = useNotifications();
  
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
      {/* Left Column - Conversation Area */}
      <div className="space-y-6">
        {/* Live Conversation */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 h-96">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-black">Live Conversation</h3>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-600 font-medium">Active Call</span>
            </div>
          </div>
          
          <div className="space-y-4 h-80 overflow-y-auto">
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
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-black mb-4">Recent Test Calls</h3>
          <div className="space-y-3">
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
      <div className="space-y-6">
        {/* Call Controls */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-black mb-4">Call Controls</h3>
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
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-black mb-4">Test Scenarios</h3>
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
      <header className="bg-white border-b border-gray-200">
        {/* Top Header */}
        <div className="px-4 md:px-8 lg:px-16 py-4">
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
              <button onClick={openNotifications} className="relative">
                <svg width="29" height="33" viewBox="0 0 29 33" fill="none">
                  <path d="M15.5 27C15.5 28.933 13.933 30.5 12 30.5C10.067 30.5 8.5 28.933 8.5 27" stroke="#141B34" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M19.2311 27H4.76887C3.79195 27 3 26.208 3 25.2311C3 24.762 3.18636 24.3121 3.51809 23.9803L4.12132 23.3771C4.68393 22.8145 5 22.0514 5 21.2558V18.5C5 14.634 8.13401 11.5 12 11.5C15.866 11.5 19 14.634 19 18.5V21.2558C19 22.0514 19.3161 22.8145 19.8787 23.3771L20.4819 23.9803C20.8136 24.3121 21 24.762 21 25.2311C21 26.208 20.208 27 19.2311 27Z" stroke="#141B34" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  {notificationCount > 0 && <circle cx="24.5" cy="4" r="4" fill="#EF4444"/>}
                </svg>
              </button>

              {/* User Controls */}
              <div className="flex items-center gap-5">
                <button onClick={() => navigate("/profile")} className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors" title="Profile">
                  <span className="text-lg font-semibold text-gray-800">{user?.email?.[0]?.toUpperCase() || "U"}</span>
                </button>
                <button onClick={signOut} className="hover:opacity-70">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M18 9.00005C18 9.00005 13.5811 15 12 15C10.4188 15 6 9 6 9" stroke="#141B34" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 md:px-8 lg:px-16 py-8">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-semibold text-black mb-1">Test Agent</h1>
          <p className="text-xl font-semibold text-gray-500">Test your AI agent with real-time scenarios</p>
        </div>

        {/* Agent Status Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl font-semibold text-gray-500">Agent status:</span>
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 ${isAgentLive ? 'bg-green-500' : 'bg-red-500'} rounded-full`}></div>
                <span className={`text-xl font-semibold ${isAgentLive ? 'text-green-600' : 'text-red-600'}`}>
                  {isAgentLive ? 'Live' : 'Offline'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsAgentLive(!isAgentLive)}
                className={`px-4 py-3 ${isAgentLive ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white rounded-lg text-lg font-semibold transition-colors`}
              >
                {isAgentLive ? 'Go Offline' : 'Go Live'}
              </button>
              <AgentToggle />
            </div>
          </div>
        </div>

        {/* Test Agent Content */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 min-h-[600px]">
          {renderTestMode()}
        </div>
      </main>

      {/* Notifications */}
      {showNotifications && (
        <NotificationPopup
          notifications={notifications}
          onClose={closeNotifications}
          isVisible={showNotifications}
          notificationCount={notificationCount}
        />
      )}

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