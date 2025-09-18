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
    const state = url.searchParams.get('state'); // This contains agentId|flow
    const error = url.searchParams.get('error');

    console.log('OAuth callback received:', { code: !!code, state, error });

    // Parse state to get agentId and flow
    const [agentId, flow] = state?.split('|') || [state, 'agent-management'];
    const isOnboardingFlow = flow === 'onboarding';

    console.log('Parsed state:', { agentId, flow, isOnboardingFlow });

    // Handle OAuth errors
    if (error) {
      console.error('OAuth error:', error);
      if (isOnboardingFlow) {
        return new Response(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <title>OAuth Error</title>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; text-align: center; padding: 20px; }
                .error { color: #ef4444; margin-bottom: 20px; }
                .status { color: #6b7280; font-size: 14px; }
              </style>
            </head>
            <body>
              <div class="error">OAuth Error: ${encodeURIComponent(error)}</div>
              <div class="status" id="status">Closing window...</div>
              <script>
                console.log('OAuth callback - sending error message');
                try {
                  window.opener?.postMessage({
                    type: 'OAUTH_ERROR',
                    error: '${encodeURIComponent(error)}'
                  }, '*');
                  console.log('Error message sent successfully');
                } catch (e) {
                  console.error('Failed to send error message:', e);
                }
                
                // Try to close window with fallback
                setTimeout(() => {
                  try {
                    window.close();
                  } catch (e) {
                    console.log('Auto-close failed, showing manual close option');
                    document.getElementById('status').innerHTML = 'Please close this window manually';
                  }
                }, 1000);
              </script>
            </body>
          </html>
        `, {
          headers: { 'Content-Type': 'text/html' }
        });
      }
      const redirectUrl = `${req.headers.get('origin') || 'https://loving-scooter-37.lovableproject.com'}/agent-management?agentId=${agentId}&oauth=error&error=${encodeURIComponent(error)}`;
      return Response.redirect(redirectUrl, 302);
    }

    if (!code || !agentId) {
      console.error('Missing required parameters:', { code: !!code, agentId: !!agentId });
      if (isOnboardingFlow) {
        return new Response(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <title>OAuth Error</title>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; text-align: center; padding: 20px; }
                .error { color: #ef4444; margin-bottom: 20px; }
                .status { color: #6b7280; font-size: 14px; }
              </style>
            </head>
            <body>
              <div class="error">Missing required parameters</div>
              <div class="status" id="status">Closing window...</div>
              <script>
                console.log('OAuth callback - missing parameters error');
                try {
                  window.opener?.postMessage({
                    type: 'OAUTH_ERROR',
                    error: 'Missing required parameters'
                  }, '*');
                  console.log('Error message sent successfully');
                } catch (e) {
                  console.error('Failed to send error message:', e);
                }
                
                setTimeout(() => {
                  try {
                    window.close();
                  } catch (e) {
                    document.getElementById('status').innerHTML = 'Please close this window manually';
                  }
                }, 1000);
              </script>
            </body>
          </html>
        `, {
          headers: { 'Content-Type': 'text/html' }
        });
      }
      const redirectUrl = `${req.headers.get('origin') || 'https://loving-scooter-37.lovableproject.com'}/agent-management?agentId=${agentId || 'unknown'}&oauth=error&error=missing_parameters`;
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

    // Find the project_id and user_id for this agent
    const { data: agentData, error: agentError } = await supabase
      .from('onboarding_responses')
      .select('project_id, user_id')
      .eq('id', agentId)
      .single();

    if (agentError || !agentData) {
      console.error('Error fetching agent data:', agentError);
      if (isOnboardingFlow) {
        return new Response(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <title>OAuth Error</title>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; text-align: center; padding: 20px; }
                .error { color: #ef4444; margin-bottom: 20px; }
                .status { color: #6b7280; font-size: 14px; }
              </style>
            </head>
            <body>
              <div class="error">Agent not found</div>
              <div class="status" id="status">Closing window...</div>
              <script>
                console.log('OAuth callback - agent not found error');
                try {
                  window.opener?.postMessage({
                    type: 'OAUTH_ERROR',
                    error: 'Agent not found'
                  }, '*');
                  console.log('Error message sent successfully');
                } catch (e) {
                  console.error('Failed to send error message:', e);
                }
                
                setTimeout(() => {
                  try {
                    window.close();
                  } catch (e) {
                    document.getElementById('status').innerHTML = 'Please close this window manually';
                  }
                }, 1000);
              </script>
            </body>
          </html>
        `, {
          headers: { 'Content-Type': 'text/html' }
        });
      }
      const redirectUrl = `${req.headers.get('origin') || 'https://loving-scooter-37.lovableproject.com'}/agent-management?agentId=${agentId}&oauth=error&error=agent_not_found`;
      return Response.redirect(redirectUrl, 302);
    }

    if (!agentData.project_id || !agentData.user_id) {
      console.error('Missing project_id or user_id for agent:', agentId);
      if (isOnboardingFlow) {
        return new Response(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <title>OAuth Error</title>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; text-align: center; padding: 20px; }
                .error { color: #ef4444; margin-bottom: 20px; }
                .status { color: #6b7280; font-size: 14px; }
              </style>
            </head>
            <body>
              <div class="error">Project or user not found</div>
              <div class="status" id="status">Closing window...</div>
              <script>
                console.log('OAuth callback - project/user not found error');
                try {
                  window.opener?.postMessage({
                    type: 'OAUTH_ERROR',
                    error: 'Project or user not found'
                  }, '*');
                  console.log('Error message sent successfully');
                } catch (e) {
                  console.error('Failed to send error message:', e);
                }
                
                setTimeout(() => {
                  try {
                    window.close();
                  } catch (e) {
                    document.getElementById('status').innerHTML = 'Please close this window manually';
                  }
                }, 1000);
              </script>
            </body>
          </html>
        `, {
          headers: { 'Content-Type': 'text/html' }
        });
      }
      const redirectUrl = `${req.headers.get('origin') || 'https://loving-scooter-37.lovableproject.com'}/agent-management?agentId=${agentId}&oauth=error&error=project_not_found`;
      return Response.redirect(redirectUrl, 302);
    }

    // Check for existing integration with same user_id and user_email to reuse refresh token
    const { data: existingIntegration } = await supabase
      .from('google_integrations')
      .select('refresh_token')
      .eq('user_id', agentData.user_id)
      .eq('user_email', userInfo.email)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    // Use existing refresh token if available, otherwise use new one
    const refreshTokenToUse = existingIntegration?.refresh_token || tokenData.refresh_token;
    const isTokenReused = !!existingIntegration?.refresh_token;

    console.log('Token reuse status:', { 
      isTokenReused, 
      email: userInfo.email, 
      hasExisting: !!existingIntegration 
    });

    // Store or update the Google integration
    const { error: integrationError } = await supabase
      .from('google_integrations')
      .upsert({
        user_id: agentData.user_id,
        project_id: agentData.project_id,
        agent_id: agentId,
        access_token: tokenData.access_token,
        refresh_token: refreshTokenToUse,
        token_expires_at: expiresAt.toISOString(),
        scopes: tokenData.scope?.split(' ') || [],
        user_email: userInfo.email,
        is_active: true,
      }, {
        onConflict: 'agent_id'
      });

    if (integrationError) {
      console.error('Error storing Google integration:', integrationError);
      if (isOnboardingFlow) {
        return new Response(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <title>OAuth Error</title>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; text-align: center; padding: 20px; }
                .error { color: #ef4444; margin-bottom: 20px; }
                .status { color: #6b7280; font-size: 14px; }
              </style>
            </head>
            <body>
              <div class="error">Failed to store integration</div>
              <div class="status" id="status">Closing window...</div>
              <script>
                console.log('OAuth callback - storage failed error');
                try {
                  window.opener?.postMessage({
                    type: 'OAUTH_ERROR',
                    error: 'Failed to store integration'
                  }, '*');
                  console.log('Error message sent successfully');
                } catch (e) {
                  console.error('Failed to send error message:', e);
                }
                
                setTimeout(() => {
                  try {
                    window.close();
                  } catch (e) {
                    document.getElementById('status').innerHTML = 'Please close this window manually';
                  }
                }, 1000);
              </script>
            </body>
          </html>
        `, {
          headers: { 'Content-Type': 'text/html' }
        });
      }
      const redirectUrl = `${req.headers.get('origin') || 'https://loving-scooter-37.lovableproject.com'}/agent-management?agentId=${agentId}&oauth=error&error=storage_failed`;
      return Response.redirect(redirectUrl, 302);
    }

    console.log('Google integration stored successfully for project:', agentData.project_id);

    // Handle response based on flow type
    if (isOnboardingFlow) {
      // For onboarding flow, return HTML with postMessage
      return new Response(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Google Calendar Connected</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; text-align: center; padding: 20px; }
              .success { color: #22c55e; margin-bottom: 20px; }
              .status { color: #6b7280; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="success">✓ Google Calendar Connected Successfully</div>
            <div class="status" id="status">Closing window...</div>
            <script>
              console.log('OAuth callback - sending success message');
              try {
                window.opener?.postMessage({
                  type: 'OAUTH_SUCCESS',
                  email: '${userInfo.email}',
                  agentId: '${agentId}'
                }, '*');
                console.log('Success message sent successfully');
              } catch (e) {
                console.error('Failed to send success message:', e);
              }
              
              // Try to close window with fallback
              setTimeout(() => {
                try {
                  window.close();
                } catch (e) {
                  console.log('Auto-close failed, showing manual close option');
                  document.getElementById('status').innerHTML = 'Please close this window manually';
                }
              }, 1000);
            </script>
          </body>
        </html>
      `, {
        headers: { ...corsHeaders, 'Content-Type': 'text/html' }
      });
    } else {
      // For agent management flow, redirect as before
      const redirectUrl = `${req.headers.get('origin') || 'https://loving-scooter-37.lovableproject.com'}/agent-management?agentId=${agentId}&oauth=success&email=${encodeURIComponent(userInfo.email)}&popup=true`;
      return Response.redirect(redirectUrl, 302);
    }

  } catch (error) {
    console.error('Unexpected error in OAuth callback:', error);
    const url = new URL(req.url);
    const state = url.searchParams.get('state');
    const [agentId, flow] = state?.split('|') || [state, 'agent-management'];
    const isOnboardingFlow = flow === 'onboarding';
    
    if (isOnboardingFlow) {
      return new Response(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>OAuth Error</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; text-align: center; padding: 20px; }
              .error { color: #ef4444; margin-bottom: 20px; }
              .status { color: #6b7280; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="error">Unexpected error occurred</div>
            <div class="status" id="status">Closing window...</div>
            <script>
              console.error('OAuth callback - unexpected error');
              try {
                window.opener?.postMessage({
                  type: 'OAUTH_ERROR',
                  error: 'Unexpected error occurred'
                }, '*');
                console.log('Error message sent successfully');
              } catch (e) {
                console.error('Failed to send error message:', e);
              }
              
              setTimeout(() => {
                try {
                  window.close();
                } catch (e) {
                  document.getElementById('status').innerHTML = 'Please close this window manually';
                }
              }, 1000);
            </script>
          </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' }
      });
    }
    
    const redirectUrl = `${req.headers.get('origin') || 'https://loving-scooter-37.lovableproject.com'}/agent-management?agentId=${agentId || 'unknown'}&oauth=error&error=unexpected_error`;
    return Response.redirect(redirectUrl, 302);
  }
});