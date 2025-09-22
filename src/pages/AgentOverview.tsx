import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/shared/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus } from 'lucide-react';

interface Agent {
  id: string;
  business_name: string;
  ai_assistant_name: string;
  primary_location: string;
  contact_number: string;
  assistant_id: string;
  purchased_number_details: any;
  current_status: string;
  created_at: string;
}

const AgentOverview = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('onboarding_responses')
        .select('id, business_name, ai_assistant_name, primary_location, contact_number, assistant_id, purchased_number_details, current_status, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading agents:', error);
        toast({
          title: "Error",
          description: "Failed to load agents",
          variant: "destructive",
        });
        return;
      }

      setAgents(data || []);
    } catch (error) {
      console.error('Error loading agents:', error);
      toast({
        title: "Error",
        description: "Failed to load agents",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (agentId: string) => {
    navigate(`/agent-management?agentId=${agentId}`);
  };

  const handleCreateAgent = () => {
    navigate('/onboarding/business-intro');
  };

  const renderSkeletonCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="p-6">
          <CardContent className="p-0 space-y-4">
            <div className="flex justify-between items-start">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <Skeleton className="w-12 h-6 rounded-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderEmptyState = () => (
    <div className="text-center py-12">
      <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
          <path
            d="M19 16V14C19 11.1716 19 9.75736 18.1213 8.87868C17.2426 8 15.8284 8 13 8H11C8.17157 8 6.75736 8 5.87868 8.87868C5 9.75736 5 11.1716 5 14V16C5 18.8284 5 20.2426 5.87868 21.1213C6.75736 22 8.17157 22 11 22H13C15.8284 22 17.2426 22 18.1213 21.1213C19 20.2426 19 18.8284 19 16Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M13.5 3.5C13.5 4.32843 12.8284 5 12 5C11.1716 5 10.5 4.32843 10.5 3.5C10.5 2.67157 11.1716 2 12 2C12.8284 2 13.5 2.67157 13.5 3.5Z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path d="M12 5V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
      <h3 className="text-xl font-semibold text-black mb-2">No Agents Created Yet</h3>
      <p className="text-gray-500 mb-6">Create your first AI agent to get started with automated customer service.</p>
      <Button onClick={handleCreateAgent} className="bg-black text-white hover:bg-gray-800">
        <Plus className="w-4 h-4 mr-2" />
        Create Your First Agent
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currentPage="agent-management" />
      
      <main className="px-3 md:px-6 lg:px-12 py-8">
        {/* Header Section */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-black mb-2">Agent Management</h1>
            <p className="text-lg text-gray-600">Manage and monitor all your AI agents in one place</p>
          </div>
          {agents.length > 0 && (
            <Button onClick={handleCreateAgent} className="bg-black text-white hover:bg-gray-800">
              <Plus className="w-4 h-4 mr-2" />
              New Agent
            </Button>
          )}
        </div>

        {/* Content */}
        {loading ? (
          renderSkeletonCards()
        ) : agents.length === 0 ? (
          renderEmptyState()
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent) => (
              <Card key={agent.id} className="hover:shadow-lg transition-shadow duration-200">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-black mb-1">
                        {agent.ai_assistant_name || 'Unnamed Agent'}
                      </h3>
                      <p className="text-sm text-gray-500">{agent.business_name}</p>
                    </div>
                    {(() => {
                      const isConfigured = agent.contact_number && agent.assistant_id && agent.purchased_number_details?.id;
                      const status = isConfigured ? agent.current_status || 'offline' : 'setup_required';
                      
                      if (status === 'live') {
                        return (
                          <div className="flex items-center gap-2 bg-green-50 px-3 py-1 rounded-full">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm font-medium text-green-700">Live</span>
                          </div>
                        );
                      } else if (status === 'offline') {
                        return (
                          <div className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-full">
                            <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                            <span className="text-sm font-medium text-gray-700">Offline</span>
                          </div>
                        );
                      } else {
                        return (
                          <div className="flex items-center gap-2 bg-yellow-50 px-3 py-1 rounded-full">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                            <span className="text-sm font-medium text-yellow-700">Setup Required</span>
                          </div>
                        );
                      }
                    })()}
                  </div>

                  <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M12 2C16.418 2 20 5.582 20 10C20 16 12 22 12 22C12 22 4 16 4 10C4 5.582 7.582 2 12 2Z"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinejoin="round"
                        />
                        <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.5" />
                      </svg>
                      <span className="truncate">{agent.primary_location || 'No location set'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M22 12.36C22 17.56 17.52 22 12 22C10.65 22 9.34 21.7 8.15 21.15L2 22L3.17 16.37C2.5 15.17 2 13.82 2 12.36C2 7.15 6.48 2.7 12 2.7C17.52 2.7 22 7.15 22 12.36Z"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span>{agent.contact_number || 'No phone number'}</span>
                    </div>
                  </div>

                  <Button 
                    onClick={() => handleViewDetails(agent.id)}
                    className="w-full bg-gray-900 text-white hover:bg-black transition-colors"
                  >
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default AgentOverview;