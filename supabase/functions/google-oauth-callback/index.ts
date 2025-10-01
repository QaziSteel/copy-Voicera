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

    // Parse state to get identifier and flow
    const [identifier, flow] = state?.split('|') || [state, 'agent-management'];
    const isOnboardingFlow = flow === 'onboarding';
    
    // For onboarding flow, identifier contains "projectId:userId"
    // For agent flow, identifier is agent_id
    let projectId, userId, agentId;
    
    if (isOnboardingFlow) {
      const [extractedProjectId, extractedUserId] = identifier?.split(':') || [];
      projectId = extractedProjectId;
      userId = extractedUserId;
      agentId = null;
    } else {
      projectId = null;
      userId = null;
      agentId = identifier;
    }

    console.log('Parsed state:', { identifier, flow, isOnboardingFlow, projectId, userId, agentId });

    // Handle OAuth errors
    if (error) {
      console.error('OAuth error:', error);
      if (isOnboardingFlow) {
        const htmlResponse = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>OAuth Error</title>
</head>
<body>
    <p>❌ OAuth Error: ${error}</p>
    <p>You can close this window.</p>
    <script>
        try {
            window.opener?.postMessage({
                type: 'OAUTH_ERROR',
                error: '${error}'
            }, '*');
        } catch (e) {
            console.error('Failed to send message:', e);
        }
        setTimeout(() => {
            try {
                window.close();
            } catch (e) {
                console.log('Cannot auto-close window');
            }
        }, 1000);
    </script>
</body>
</html>`;
        
        return new Response(htmlResponse, {
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
      }
      const redirectUrl = `${req.headers.get('origin') || 'https://loving-scooter-37.lovableproject.com'}/agent-management?agentId=${agentId}&oauth=error&error=${encodeURIComponent(error)}`;
      return Response.redirect(redirectUrl, 302);
    }

    if (!code || (!agentId && !projectId) || (isOnboardingFlow && !userId)) {
      console.error('Missing required parameters:', { code: !!code, agentId: !!agentId, projectId: !!projectId, userId: !!userId });
      if (isOnboardingFlow) {
        const htmlResponse = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>OAuth Error</title>
</head>
<body>
    <p>❌ Missing required parameters</p>
    <p>You can close this window.</p>
    <script>
        try {
            window.opener?.postMessage({
                type: 'OAUTH_ERROR',
                error: 'Missing required parameters'
            }, '*');
        } catch (e) {
            console.error('Failed to send message:', e);
        }
        setTimeout(() => {
            try {
                window.close();
            } catch (e) {
                console.log('Cannot auto-close window');
            }
        }, 1000);
    </script>
</body>
</html>`;
        
        return new Response(htmlResponse, {
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
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

    let finalProjectId, finalUserId, finalAgentId;
    
    if (isOnboardingFlow) {
      // For onboarding flow: use project_id and user_id from state
      finalProjectId = projectId;
      finalUserId = userId;
      finalAgentId = null; // Create orphaned record
      
    } else {
      // For agent management flow: get project_id and user_id from agent record
      const { data: agentData, error: agentError } = await supabase
        .from('onboarding_responses')
        .select('project_id, user_id')
        .eq('id', agentId)
        .single();

      if (agentError || !agentData) {
        console.error('Error fetching agent data:', agentError);
        const redirectUrl = `${req.headers.get('origin') || 'https://loving-scooter-37.lovableproject.com'}/agent-management?agentId=${agentId}&oauth=error&error=agent_not_found`;
        return Response.redirect(redirectUrl, 302);
      }

      if (!agentData.project_id || !agentData.user_id) {
        console.error('Missing project_id or user_id for agent:', agentId);
        const redirectUrl = `${req.headers.get('origin') || 'https://loving-scooter-37.lovableproject.com'}/agent-management?agentId=${agentId}&oauth=error&error=project_not_found`;
        return Response.redirect(redirectUrl, 302);
      }
      
      finalProjectId = agentData.project_id;
      finalUserId = agentData.user_id;
      finalAgentId = agentId;
    }

    // Check for existing integration to potentially reuse refresh token
    // We need the integration ID to get decrypted tokens via RPC
    const { data: existingIntegration } = await supabase
      .from('google_integrations')
      .select('id, user_id')
      .eq('user_id', finalUserId)
      .eq('user_email', userInfo.email)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    let refreshTokenToUse = tokenData.refresh_token;
    let isTokenReused = false;

    // If we have an existing integration, try to reuse its refresh token
    if (existingIntegration) {
      try {
        const { data: existingTokens } = await supabase
          .rpc('get_google_integration_tokens', {
            _integration_id: existingIntegration.id,
            _requesting_user_id: existingIntegration.user_id
          })
          .single();
        
        if (existingTokens?.refresh_token) {
          refreshTokenToUse = existingTokens.refresh_token;
          isTokenReused = true;
        }
      } catch (e) {
        console.log('Could not reuse refresh token, using new one:', e);
      }
    }

    console.log('Token reuse status:', { 
      isTokenReused, 
      email: userInfo.email, 
      hasExisting: !!existingIntegration 
    });

    // Prepare integration data
    const integrationData = {
      user_id: finalUserId,
      project_id: finalProjectId,
      agent_id: finalAgentId,
      access_token: tokenData.access_token,
      refresh_token: refreshTokenToUse,
      token_expires_at: expiresAt.toISOString(),
      scopes: tokenData.scope?.split(' ') || [],
      user_email: userInfo.email,
      is_active: true,
    };

    // For onboarding flow, add created_without_agent timestamp
    if (isOnboardingFlow) {
      integrationData.created_without_agent = new Date().toISOString();
    }

    // Store or update the Google integration
    const { error: integrationError } = await supabase
      .from('google_integrations')
      .upsert(integrationData, {
        onConflict: finalAgentId ? 'agent_id' : undefined // Only use conflict resolution if we have agent_id
      });

    if (integrationError) {
      console.error('Error storing Google integration:', integrationError);
      if (isOnboardingFlow) {
        const htmlResponse = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>OAuth Error</title>
</head>
<body>
    <p>❌ Failed to store integration</p>
    <p>You can close this window.</p>
    <script>
        try {
            window.opener?.postMessage({
                type: 'OAUTH_ERROR',
                error: 'Failed to store integration'
            }, '*');
        } catch (e) {
            console.error('Failed to send message:', e);
        }
        setTimeout(() => {
            try {
                window.close();
            } catch (e) {
                console.log('Cannot auto-close window');
            }
        }, 1000);
    </script>
</body>
</html>`;
        
        return new Response(htmlResponse, {
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
      }
      const redirectUrl = `${req.headers.get('origin') || 'https://loving-scooter-37.lovableproject.com'}/agent-management?agentId=${agentId}&oauth=error&error=storage_failed`;
      return Response.redirect(redirectUrl, 302);
    }

    console.log('Google integration stored successfully for project:', finalProjectId);

    // Handle response based on flow type
    if (isOnboardingFlow) {
      // For onboarding flow, return simple HTML with postMessage
      const htmlResponse = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Google Calendar Connected</title>
</head>
<body>
    <p>✓ Google Calendar Connected Successfully</p>
    <p>You can close this window.</p>
    <script>
        try {
            window.opener?.postMessage({
                type: 'OAUTH_SUCCESS',
                email: '${userInfo.email}',
                ${finalAgentId ? `agentId: '${finalAgentId}'` : `projectId: '${finalProjectId}'`}
            }, '*');
        } catch (e) {
            console.error('Failed to send message:', e);
        }
        setTimeout(() => {
            try {
                window.close();
            } catch (e) {
                console.log('Cannot auto-close window');
            }
        }, 1000);
    </script>
</body>
</html>`;
      
      return new Response(htmlResponse, {
        headers: { 
          'Content-Type': 'text/html; charset=utf-8'
        }
      });
    } else {
      // For agent management flow, redirect as before
      const redirectUrl = `${req.headers.get('origin') || 'https://loving-scooter-37.lovableproject.com'}/agent-management?agentId=${finalAgentId}&oauth=success&email=${encodeURIComponent(userInfo.email)}&popup=true`;
      return Response.redirect(redirectUrl, 302);
    }

  } catch (error) {
    console.error('Unexpected error in OAuth callback:', error);
    const url = new URL(req.url);
    const state = url.searchParams.get('state');
    const [agentId, flow] = state?.split('|') || [state, 'agent-management'];
    const isOnboardingFlow = flow === 'onboarding';
    
    if (isOnboardingFlow) {
      const htmlResponse = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>OAuth Error</title>
</head>
<body>
    <p>❌ Unexpected error occurred</p>
    <p>You can close this window.</p>
    <script>
        try {
            window.opener?.postMessage({
                type: 'OAUTH_ERROR',
                error: 'Unexpected error occurred'
            }, '*');
        } catch (e) {
            console.error('Failed to send message:', e);
        }
        setTimeout(() => {
            try {
                window.close();
            } catch (e) {
                console.log('Cannot auto-close window');
            }
        }, 1000);
    </script>
</body>
</html>`;
      
      return new Response(htmlResponse, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }
    
    const redirectUrl = `${req.headers.get('origin') || 'https://loving-scooter-37.lovableproject.com'}/agent-management?agentId=${finalAgentId || 'unknown'}&oauth=error&error=unexpected_error`;
    return Response.redirect(redirectUrl, 302);
  }
});