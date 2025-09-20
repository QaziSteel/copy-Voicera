import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { AgentToggle } from "@/components/ui/agent-toggle";
import { Header } from "@/components/shared/Header";
import { VoiceCallInterface } from "@/components/VoiceCallInterface";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const TestAgent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  
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


  const getAgentDisplayName = () => {
    if (!agentData) return 'Test Agent';
    return agentData.ai_assistant_name || agentData.business_name || 'Test Agent';
  };

  const renderTestMode = () => (
    <div className="space-y-6">
      {/* Voice Call Interface */}
      <VoiceCallInterface 
        agentData={agentData}
        testScenarios={testScenarios}
      />
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


    </div>
  );
};

export default TestAgent;