import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface GoogleIntegration {
  id: string;
  project_id: string;
  access_token: string;
  refresh_token: string;
  token_expires_at: string;
  scopes: string[];
  user_email: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useGoogleIntegration = (projectId: string | null) => {
  const [integration, setIntegration] = useState<GoogleIntegration | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchIntegration = async () => {
    if (!projectId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('google_integrations')
        .select('*')
        .eq('project_id', projectId)
        .eq('is_active', true)
        .maybeSingle();

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
    if (!projectId || !integration) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('google_integrations')
        .update({ is_active: false })
        .eq('project_id', projectId);

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

  const initiateOAuth = (agentId: string) => {
    const googleClientId = '1009779018893-7tsg9pcs3f4j3ue7s9qm8qo1sda3ugo3.apps.googleusercontent.com'; // Your actual Google Client ID
    const redirectUri = 'https://nhhdxwgrmcdsapbuvelx.supabase.co/functions/v1/google-oauth-callback';
    const scopes = [
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/calendar'
    ].join(' ');

    const oauthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    oauthUrl.searchParams.set('client_id', googleClientId);
    oauthUrl.searchParams.set('redirect_uri', redirectUri);
    oauthUrl.searchParams.set('response_type', 'code');
    oauthUrl.searchParams.set('scope', scopes);
    oauthUrl.searchParams.set('access_type', 'offline');
    oauthUrl.searchParams.set('prompt', 'consent');
    oauthUrl.searchParams.set('state', agentId);

    // Open OAuth URL in the current window
    window.location.href = oauthUrl.toString();
  };

  useEffect(() => {
    fetchIntegration();
  }, [projectId]);

  return {
    integration,
    loading,
    initiateOAuth,
    disconnectIntegration,
    refetch: fetchIntegration,
  };
};