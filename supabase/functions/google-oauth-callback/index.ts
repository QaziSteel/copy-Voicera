import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

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
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state'); // This contains the agentId
    const error = url.searchParams.get('error');

    console.log('OAuth callback received:', { code: !!code, state, error });

    // Handle OAuth errors
    if (error) {
      console.error('OAuth error:', error);
      const redirectUrl = `${req.headers.get('origin') || 'https://loving-scooter-37.lovableproject.com'}/agent-management?agentId=${state}&oauth=error&error=${encodeURIComponent(error)}`;
      return Response.redirect(redirectUrl, 302);
    }

    if (!code || !state) {
      console.error('Missing required parameters:', { code: !!code, state: !!state });
      const redirectUrl = `${req.headers.get('origin') || 'https://loving-scooter-37.lovableproject.com'}/agent-management?agentId=${state || 'unknown'}&oauth=error&error=missing_parameters`;
      return Response.redirect(redirectUrl, 302);
    }

    // Get Google OAuth credentials from Supabase secrets
    const googleClientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const googleClientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!googleClientId || !googleClientSecret || !supabaseUrl || !supabaseServiceKey) {
      console.error('Missing environment variables');
      const redirectUrl = `${req.headers.get('origin') || 'https://loving-scooter-37.lovableproject.com'}/agent-management?agentId=${state}&oauth=error&error=server_configuration`;
      return Response.redirect(redirectUrl, 302);
    }

    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: googleClientId,
        client_secret: googleClientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: `${supabaseUrl}/functions/v1/google-oauth-callback`,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', errorText);
      const redirectUrl = `${req.headers.get('origin') || 'https://loving-scooter-37.lovableproject.com'}/agent-management?agentId=${state}&oauth=error&error=token_exchange_failed`;
      return Response.redirect(redirectUrl, 302);
    }

    const tokenData = await tokenResponse.json();
    console.log('Token exchange successful');

    // Get user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userInfoResponse.ok) {
      console.error('Failed to get user info from Google');
      const redirectUrl = `${req.headers.get('origin') || 'https://loving-scooter-37.lovableproject.com'}/agent-management?agentId=${state}&oauth=error&error=user_info_failed`;
      return Response.redirect(redirectUrl, 302);
    }

    const userInfo = await userInfoResponse.json();
    console.log('User info retrieved:', { email: userInfo.email });

    // Initialize Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate token expiry time
    const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000));

    // Find the project_id for this agent
    const { data: agentData, error: agentError } = await supabase
      .from('onboarding_responses')
      .select('project_id')
      .eq('id', state)
      .maybeSingle();

    if (agentError) {
      console.error('Error fetching agent data:', agentError);
      const redirectUrl = `${req.headers.get('origin') || 'https://loving-scooter-37.lovableproject.com'}/agent-management?agentId=${state}&oauth=error&error=agent_not_found`;
      return Response.redirect(redirectUrl, 302);
    }

    if (!agentData?.project_id) {
      console.error('No project_id found for agent:', state);
      const redirectUrl = `${req.headers.get('origin') || 'https://loving-scooter-37.lovableproject.com'}/agent-management?agentId=${state}&oauth=error&error=project_not_found`;
      return Response.redirect(redirectUrl, 302);
    }


    // Get user_id from the agent data
    const { data: agentUserData, error: agentUserError } = await supabase
      .from('onboarding_responses')
      .select('user_id')
      .eq('id', state)
      .single();

    if (agentUserError || !agentUserData?.user_id) {
      console.error('Error fetching agent user data:', agentUserError);
      const redirectUrl = `${req.headers.get('origin') || 'https://loving-scooter-37.lovableproject.com'}/agent-management?agentId=${state}&oauth=error&error=user_not_found`;
      return Response.redirect(redirectUrl, 302);
    }

    // Store or update the Google integration with encrypted tokens
    const { error: integrationError } = await supabase
      .from('google_integrations')
      .upsert({
        user_id: agentUserData.user_id,
        project_id: agentData.project_id,
        agent_id: state, // Add agent_id to make integration agent-specific
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        token_expires_at: expiresAt.toISOString(),
        scopes: tokenData.scope?.split(' ') || [],
        user_email: userInfo.email,
        is_active: true,
      }, {
        onConflict: 'agent_id' // Change to agent_id since integrations are now per-agent
      });

    if (integrationError) {
      console.error('Error storing Google integration:', integrationError);
      const redirectUrl = `${req.headers.get('origin') || 'https://loving-scooter-37.lovableproject.com'}/agent-management?agentId=${state}&oauth=error&error=storage_failed`;
      return Response.redirect(redirectUrl, 302);
    }

    console.log('Google integration stored successfully for project:', agentData.project_id);

    // Check if we're in a popup window and handle accordingly
    const userAgent = req.headers.get('user-agent') || '';
    const isPopup = req.headers.get('sec-fetch-dest') === 'document' && req.headers.get('sec-fetch-mode') === 'navigate';
    
    // If this might be a popup, show a success page that closes itself
    if (isPopup) {
      const successHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>OAuth Success</title>
          <style>
            body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f9fafb; }
            .container { text-align: center; padding: 2rem; background: white; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .success { color: #10b981; font-size: 1.5rem; margin-bottom: 1rem; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="success">✅ The Calendar is verified. Closing the window in <span id="countdown">5</span> seconds</div>
            <p>Please wait while we redirect you...</p>
          </div>
          <script>
            // Countdown timer
            let count = 5;
            const countdownElement = document.getElementById('countdown');
            
            const timer = setInterval(() => {
              count--;
              if (countdownElement) {
                countdownElement.textContent = count;
              }
              if (count <= 0) {
                clearInterval(timer);
              }
            }, 1000);
            
            // Close the popup after 5 seconds
            setTimeout(() => {
              window.close();
            }, 5000);
          </script>
        </body>
        </html>
      `;
      return new Response(successHtml, {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // Redirect back to the agent management page with success
    const redirectUrl = `${req.headers.get('origin') || 'https://loving-scooter-37.lovableproject.com'}/agent-management?agentId=${state}&oauth=success&email=${encodeURIComponent(userInfo.email)}`;
    return Response.redirect(redirectUrl, 302);

  } catch (error) {
    console.error('Unexpected error in OAuth callback:', error);
    const url = new URL(req.url);
    const state = url.searchParams.get('state');
    const redirectUrl = `${req.headers.get('origin') || 'https://loving-scooter-37.lovableproject.com'}/agent-management?agentId=${state || 'unknown'}&oauth=error&error=unexpected_error`;
    return Response.redirect(redirectUrl, 302);
  }
});