import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key for token access
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { projectId, action, eventData } = await req.json();

    // Get the user from the JWT token
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch the Google integration with tokens (using service role)
    const { data: integration, error: integrationError } = await supabase
      .from('google_integrations')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (integrationError || !integration) {
      return new Response(JSON.stringify({ error: 'Google integration not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Decrypt tokens if they are encrypted
    const decryptToken = async (encryptedToken: string): Promise<string> => {
      try {
        const encryptionKey = 'oauth_tokens_encryption_key';
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();
        const keyData = encoder.encode(encryptionKey);
        const key = await crypto.subtle.importKey('raw', keyData, { name: 'AES-GCM' }, false, ['decrypt']);
        
        const encryptedData = atob(encryptedToken);
        const iv = new Uint8Array(encryptedData.slice(0, 12).split('').map(c => c.charCodeAt(0)));
        const encrypted = new Uint8Array(encryptedData.slice(12).split('').map(c => c.charCodeAt(0)));
        
        const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encrypted);
        return decoder.decode(decrypted);
      } catch (error) {
        console.error('Token decryption failed:', error);
        throw new Error('Failed to decrypt token');
      }
    };

    // Check if token needs refresh
    const tokenExpiry = new Date(integration.token_expires_at);
    const now = new Date();
    let accessToken = integration.tokens_encrypted 
      ? await decryptToken(integration.access_token)
      : integration.access_token;

    if (tokenExpiry <= now) {
      // Refresh the token
      console.log('Refreshing Google access token...');
      
      const refreshToken = integration.tokens_encrypted 
        ? await decryptToken(integration.refresh_token)
        : integration.refresh_token;

      const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: Deno.env.get('GOOGLE_CLIENT_ID') ?? '',
          client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET') ?? '',
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (!refreshResponse.ok) {
        console.error('Failed to refresh token:', await refreshResponse.text());
        return new Response(JSON.stringify({ error: 'Failed to refresh Google token' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const refreshData = await refreshResponse.json();
      accessToken = refreshData.access_token;

      // Encrypt new access token before storing
      const encryptionKey = 'oauth_tokens_encryption_key';
      const encoder = new TextEncoder();
      const keyData = encoder.encode(encryptionKey);
      const key = await crypto.subtle.importKey('raw', keyData, { name: 'AES-GCM' }, false, ['encrypt']);
      
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const tokenData = encoder.encode(accessToken);
      const encryptedToken = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, tokenData);
      const encryptedTokenStr = btoa(String.fromCharCode(...new Uint8Array(iv), ...new Uint8Array(encryptedToken)));

      // Update the token in the database
      const newExpiry = new Date(Date.now() + refreshData.expires_in * 1000);
      await supabase
        .from('google_integrations')
        .update({
          access_token: encryptedTokenStr,
          token_expires_at: newExpiry.toISOString(),
          updated_at: new Date().toISOString(),
          tokens_encrypted: true,
        })
        .eq('id', integration.id);
    }

    // Handle different calendar actions
    switch (action) {
      case 'list_events':
        return await listCalendarEvents(accessToken);
      case 'create_event':
        return await createCalendarEvent(accessToken, eventData);
      case 'list_calendars':
        return await listCalendars(accessToken);
      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

  } catch (error) {
    console.error('Error in google-calendar-api function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function listCalendarEvents(accessToken: string) {
  const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=10&orderBy=startTime&singleEvents=true&timeMin=${new Date().toISOString()}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch calendar events: ${response.statusText}`);
  }

  const data = await response.json();
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function createCalendarEvent(accessToken: string, eventData: any) {
  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(eventData),
  });

  if (!response.ok) {
    throw new Error(`Failed to create calendar event: ${response.statusText}`);
  }

  const data = await response.json();
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function listCalendars(accessToken: string) {
  const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch calendars: ${response.statusText}`);
  }

  const data = await response.json();
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}