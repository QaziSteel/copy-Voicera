import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { AgentToggle } from "@/components/ui/agent-toggle";
import { Header } from "@/components/shared/Header";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const TestAgent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const [showTestCallModal, setShowTestCallModal] = useState(false);
  const [isAgentLive, setIsAgentLive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [userAgents, setUserAgents] = useState<any[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [agentData, setAgentData] = useState<any>(null);
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

  const loadUserAgents = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('onboarding_responses')
        .select('id, business_name, ai_assistant_name, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading user agents:', error);
        return;
      }

      if (data && data.length > 0) {
        setUserAgents(data);
        
        // Check for URL agentId first, then fall back to most recent
        const urlParams = new URLSearchParams(location.search);
        const urlAgentId = urlParams.get('agentId');
        
        let targetAgent;
        if (urlAgentId && data.find(agent => agent.id === urlAgentId)) {
          targetAgent = data.find(agent => agent.id === urlAgentId);
        } else {
          targetAgent = data[0]; // Most recent agent as fallback
        }
        
        setSelectedAgentId(targetAgent.id);
        await loadAgentSettings(targetAgent.id);
      } else {
        setUserAgents([]);
        setSelectedAgentId(null);
      }
    } catch (error) {
      console.error('Error loading user agents:', error);
    } finally {
      setLoading(false);
    }
  }, [user, location]);

  const loadAgentSettings = useCallback(async (agentId: string) => {
    try {
      const { data, error } = await supabase
        .from('onboarding_responses')
        .select('*')
        .eq('id', agentId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading agent settings:', error);
        return;
      }

      if (data) {
        setAgentData(data);
      }
    } catch (error) {
      console.error('Error loading agent settings:', error);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadUserAgents();
    }
  }, [user, loadUserAgents]);

  const handleStartTestCall = () => {
    setShowTestCallModal(true);
  };

  const getAgentDisplayName = () => {
    if (!agentData) return 'Test Agent';
    return agentData.ai_assistant_name || agentData.business_name || 'Test Agent';
  };

  const renderTestMode = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      {/* Left Column - Test Conversation */}
      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6 h-full min-h-[400px] flex flex-col">
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
              <h3 className="text-lg font-semibold text-black">Test Conversation</h3>
            </div>
            <Button onClick={handleStartTestCall} className="bg-black hover:bg-gray-800 text-white px-6 py-2 rounded-lg">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="mr-2">
                <path
                  d="M15.7421 10.705C15.4475 11.8242 14.0555 12.615 11.2714 14.1968C8.57996 15.7258 7.23429 16.4903 6.14982 16.183C5.70146 16.0559 5.29295 15.8147 4.96349 15.4822C4.16663 14.6782 4.16663 13.1188 4.16663 10C4.16663 6.88117 4.16663 5.32175 4.96349 4.51777C5.29295 4.18538 5.70146 3.94407 6.14982 3.81702C7.23429 3.50971 8.57996 4.27423 11.2714 5.80328C14.0555 7.38498 15.4475 8.17583 15.7421 9.295C15.8637 9.757 15.8637 10.243 15.7421 10.705Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
              Start Test Call
            </Button>
          </div>
          <p className="text-sm text-gray-600 mb-8">Start a test call to begin conversation</p>
          
          {/* Conversation Area */}
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-16 h-16 flex items-center justify-center mb-4">
              <svg width="32" height="32" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400">
                <path
                  d="M5.0823 15.8335C3.99888 15.7269 3.18725 15.4015 2.64293 14.8572C1.66663 13.8809 1.66663 12.3095 1.66663 9.16683V8.75016C1.66663 5.60746 1.66663 4.03612 2.64293 3.0598C3.61925 2.0835 5.19059 2.0835 8.33329 2.0835H11.6666C14.8093 2.0835 16.3807 2.0835 17.357 3.0598C18.3333 4.03612 18.3333 5.60746 18.3333 8.75016V9.16683C18.3333 12.3095 18.3333 13.8809 17.357 14.8572C16.3807 15.8335 14.8093 15.8335 11.6666 15.8335C11.1995 15.8439 10.8275 15.8794 10.4621 15.9627C9.46346 16.1926 8.53871 16.7036 7.62485 17.1492C6.32270 17.7842 5.67163 18.1017 5.26303 17.8044C4.48137 17.2222 5.24541 15.4184 5.41663 14.5835"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <p className="text-sm text-gray-500 text-center">Start a test call to begin conversation</p>
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
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
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
              <div
                key={index}
                className="w-full text-left p-3 border border-gray-200 rounded-lg text-sm text-gray-700"
              >
                "{scenario}"
              </div>
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
        <div className="mb-3 md:mb-4">
          <div className="flex items-center gap-3 mb-1">
            <Button 
              onClick={() => navigate('/agents')}
              variant="outline" 
              size="sm"
              className="bg-white border-gray-300 hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4 text-black" />
            </Button>
            <h1 className="text-xl md:text-2xl font-semibold text-black">
              {loading ? 'Loading...' : getAgentDisplayName()}
            </h1>
          </div>
          <p className="text-sm md:text-base lg:text-lg font-semibold text-gray-500">Test your AI agent with real-time scenarios</p>
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
                className={`px-4 py-2 ${isAgentLive ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white rounded-lg text-sm md:text-base lg:text-lg font-semibold transition-colors`}
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