import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AgentStatusContextType {
  isAgentLive: boolean;
  isTogglingStatus: boolean;
  contactNumber: string | null;
  assistantId: string | null;
  externalId: string | null;
  handleStatusToggle: () => Promise<void>;
  loadAgentStatus: (agentId: string) => Promise<void>;
}

const AgentStatusContext = createContext<AgentStatusContextType | undefined>(undefined);

export const useAgentStatus = () => {
  const context = useContext(AgentStatusContext);
  if (context === undefined) {
    throw new Error('useAgentStatus must be used within an AgentStatusProvider');
  }
  return context;
};

interface AgentStatusProviderProps {
  children: React.ReactNode;
}

export const AgentStatusProvider: React.FC<AgentStatusProviderProps> = ({ children }) => {
  const [isAgentLive, setIsAgentLive] = useState(true);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [contactNumber, setContactNumber] = useState<string | null>(null);
  const [assistantId, setAssistantId] = useState<string | null>(null);
  const [externalId, setExternalId] = useState<string | null>(null);
  const { toast } = useToast();

  const callStatusWebhook = useCallback(async (newStatus: 'Live' | 'Offline') => {
    if (!contactNumber || !assistantId || !externalId) {
      toast({
        title: "Error",
        description: "Contact number, assistant ID, or external ID not found. Please save your agent settings first.",
        variant: "destructive",
      });
      return false;
    }

    try {
      const response = await fetch('https://teamhypergrowth.app.n8n.cloud/webhook/9053f9bc-bd58-44b6-b83e-17b2174446f6', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone_number: contactNumber,
          assistant_id: assistantId,
          status: newStatus,
          id: externalId
        })
      });

      if (!response.ok) {
        throw new Error(`Webhook failed with status: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('Error calling status webhook:', error);
      toast({
        title: "Error",
        description: "Failed to update agent status. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  }, [contactNumber, assistantId, externalId, toast]);

  const handleStatusToggle = useCallback(async () => {
    if (isTogglingStatus) return;

    const newStatus = isAgentLive ? 'Offline' : 'Live';
    setIsTogglingStatus(true);

    try {
      const success = await callStatusWebhook(newStatus);
      if (success) {
        setIsAgentLive(!isAgentLive);
        toast({
          title: "Success", 
          description: `Agent is now ${newStatus}`,
        });
      }
    } finally {
      setIsTogglingStatus(false);
    }
  }, [isAgentLive, isTogglingStatus, callStatusWebhook, toast]);

  const loadAgentStatus = useCallback(async (agentId: string) => {
    try {
      const { data, error } = await supabase
        .from('onboarding_responses')
        .select('contact_number, assistant_id, purchased_number_details')
        .eq('id', agentId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading agent status data:', error);
        return;
      }

      if (data) {
        setContactNumber(data.contact_number || null);
        setAssistantId(data.assistant_id || null);
        
        // Extract external ID from purchased number details
        if (data.purchased_number_details && typeof data.purchased_number_details === 'object') {
          const purchasedDetails = data.purchased_number_details as { id?: string };
          setExternalId(purchasedDetails.id || null);
        } else {
          setExternalId(null);
        }
      }
    } catch (error) {
      console.error('Error loading agent status data:', error);
    }
  }, []);

  const value = {
    isAgentLive,
    isTogglingStatus,
    contactNumber,
    assistantId,
    externalId,
    handleStatusToggle,
    loadAgentStatus,
  };

  return (
    <AgentStatusContext.Provider value={value}>
      {children}
    </AgentStatusContext.Provider>
  );
};