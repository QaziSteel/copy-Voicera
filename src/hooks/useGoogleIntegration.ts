import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface GoogleIntegration {
  id: string;
  project_id: string;
  agent_id: string | null;
  token_expires_at: string;
  scopes: string[];
  user_email: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useGoogleIntegration = (agentId: string | null, onboardingMode: boolean = false) => {
  const [integration, setIntegration] = useState<GoogleIntegration | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchIntegration = async () => {
    setLoading(true);
    try {
      let data = null;
      let error = null;

      // Use the secure RPC function to fetch integration status
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setIntegration(null);
        return;
      }

      if (onboardingMode) {
        // For onboarding mode, look for integrations without agent_id
        const { data: integrations, error: rpcError } = await supabase
          .rpc('get_user_integration_status', {
            _user_id: userData.user.id,
            _project_id: null,
            _agent_id: null
          });
        
        // Filter for integrations without agent_id (orphaned records)
        if (integrations && integrations.length > 0) {
          data = integrations.find(i => i.agent_id === null) || null;
        }
        error = rpcError;
      } else if (agentId) {
        // For regular mode, look for agent-specific records
        const { data: integrations, error: rpcError } = await supabase
          .rpc('get_user_integration_status', {
            _user_id: userData.user.id,
            _project_id: null,
            _agent_id: agentId
          });
        
        data = integrations && integrations.length > 0 ? integrations[0] : null;
        error = rpcError;
      }

      if (error) {
        console.error('Error fetching Google integration:', error);
        toast({
          title: "Error",
          description: "Failed to fetch Google Calendar integration status",
          variant: "destructive",
        });
        return;
      }

      setIntegration(data);
    } catch (error) {
      console.error('Unexpected error fetching Google integration:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const disconnectIntegration = async () => {
    if (!agentId || !integration) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('google_integrations')
        .update({ is_active: false })
        .eq('agent_id', agentId);

      if (error) {
        console.error('Error disconnecting Google integration:', error);
        toast({
          title: "Error",
          description: "Failed to disconnect Google Calendar",
          variant: "destructive",
        });
        return;
      }

      setIntegration(null);
      toast({
        title: "Success",
        description: "Google Calendar disconnected successfully",
      });
    } catch (error) {
      console.error('Unexpected error disconnecting Google integration:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const initiateOAuth = (identifierAndFlow: string) => {
    const googleClientId = '211468873375-357bkis7o9nhsun3i1jtcp79hg29m2f2.apps.googleusercontent.com';
    const redirectUri = 'https://xefbqgucxzgkhxgctqxn.supabase.co/functions/v1/google-oauth-callback';
    const scopes = [
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/calendar'
    ].join(' ');

    // Include origin in state for redirect back to app
    const appOrigin = window.location.origin;
    const stateWithOrigin = `${identifierAndFlow}|${encodeURIComponent(appOrigin)}`;

    const oauthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    oauthUrl.searchParams.set('client_id', googleClientId);
    oauthUrl.searchParams.set('redirect_uri', redirectUri);
    oauthUrl.searchParams.set('response_type', 'code');
    oauthUrl.searchParams.set('scope', scopes);
    oauthUrl.searchParams.set('access_type', 'offline');
    oauthUrl.searchParams.set('prompt', 'consent');
    oauthUrl.searchParams.set('state', stateWithOrigin);

    // Open OAuth URL in a new window (not popup to avoid popup blockers)
    const oauthWindow = window.open(
      oauthUrl.toString(),
      'google-oauth',
      'width=500,height=600,scrollbars=yes,resizable=yes'
    );

    if (!oauthWindow) {
      toast({
        title: "Popup Blocked",
        description: "Please allow popups for this site and try again",
        variant: "destructive",
      });
      return;
    }

    // Start polling for integration status as backup
    let pollCount = 0;
    const maxPolls = 30; // 30 * 2s = 60s max
    const pollInterval = setInterval(() => {
      pollCount++;
      fetchIntegration();
      if (pollCount >= maxPolls) {
        clearInterval(pollInterval);
      }
    }, 2000);

    // Listen for postMessage from the OAuth bridge page
    const handleMessage = (event: MessageEvent) => {
      // Only accept messages from our own domain
      if (event.origin !== window.location.origin) return;
      
      if (event.data.type === 'OAUTH_SUCCESS') {
        clearInterval(pollInterval);
        window.removeEventListener('message', handleMessage);
        try {
          oauthWindow.close();
        } catch (e) {
          // Window might already be closed
        }
        fetchIntegration();
        toast({
          title: "Success",
          description: `Google Calendar connected for ${event.data.email}`,
        });
      } else if (event.data.type === 'OAUTH_ERROR') {
        clearInterval(pollInterval);
        window.removeEventListener('message', handleMessage);
        try {
          oauthWindow.close();
        } catch (e) {
          // Window might already be closed
        }
        toast({
          title: "OAuth Error",
          description: event.data.error || "Failed to connect Google Calendar",
          variant: "destructive",
        });
      }
    };

    window.addEventListener('message', handleMessage);

    // Monitor window closure to clean up
    const checkClosed = setInterval(() => {
      if (oauthWindow.closed) {
        clearInterval(checkClosed);
        clearInterval(pollInterval);
        window.removeEventListener('message', handleMessage);
      }
    }, 1000);
  };

  useEffect(() => {
    // Always fetch integration status on mount, regardless of mode
    fetchIntegration();
  }, [agentId, onboardingMode]);

  return {
    integration,
    loading,
    initiateOAuth,
    disconnectIntegration,
    refetch: fetchIntegration,
  };
};