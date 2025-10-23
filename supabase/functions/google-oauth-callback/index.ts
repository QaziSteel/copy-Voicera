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
    const state = url.searchParams.get('state'); // This contains identifier|flow|origin
    const error = url.searchParams.get('error');

    console.log('OAuth callback received:', { code: !!code, state, error });

    // Parse state parameter to extract identifier, flow, and origin
    const stateParts = state?.split('|') || [];
    const identifier = stateParts[0];
    const flow = stateParts[1] || 'onboarding';
    const appOrigin = stateParts[2] ? decodeURIComponent(stateParts[2]) : null;

    const isOnboardingFlow = flow === 'onboarding';
    
    // For onboarding flow, identifier contains "projectId:userId"
    // For agent flow, identifier is just the agentId
    let projectId = null;
    let userId = null;
    let agentId = null;

    if (isOnboardingFlow) {
      // Split identifier on ':' to extract projectId and userId
      const identifierParts = identifier?.split(':') || [];
      projectId = identifierParts[0] || null;
      userId = identifierParts[1] || null;
    } else {
      agentId = identifier;
    }

    // Fallback origin if not provided
    const redirectOrigin = appOrigin || 'https://lovable.dev';

    console.log('Parsed state:', { identifier, flow, isOnboardingFlow, projectId, userId, agentId });

    // Handle OAuth errors from Google
    if (error) {
      console.error('OAuth error from Google:', error);
      const errorRedirect = `${redirectOrigin}/oauth-bridge#type=OAUTH_ERROR&error=${encodeURIComponent(error)}&flow=${flow}`;
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': errorRedirect
        }
      });
    }

    // Validate required parameters
    if (!code) {
      const errorRedirect = `${redirectOrigin}/oauth-bridge#type=OAUTH_ERROR&error=${encodeURIComponent('Missing authorization code')}&flow=${flow}`;
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': errorRedirect
        }
      });
    }

    if ((!agentId && !projectId) || (isOnboardingFlow && !userId)) {
      console.error('Missing required parameters:', { agentId: !!agentId, projectId: !!projectId, userId: !!userId });
      const errorRedirect = `${redirectOrigin}/oauth-bridge#type=OAUTH_ERROR&error=${encodeURIComponent('Missing required parameters')}&flow=${flow}`;
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': errorRedirect
        }
      });
    }

    // Get Google OAuth credentials from Supabase secrets
    const googleClientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const googleClientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!googleClientId || !googleClientSecret) {
      console.error('Missing Google OAuth credentials');
      const errorRedirect = `${redirectOrigin}/oauth-bridge#type=OAUTH_ERROR&error=${encodeURIComponent('Server configuration error')}&flow=${flow}`;
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': errorRedirect
        }
      });
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
      const errorRedirect = `${redirectOrigin}/oauth-bridge#type=OAUTH_ERROR&error=${encodeURIComponent('Token exchange failed')}&flow=${flow}`;
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': errorRedirect
        }
      });
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
      console.error('Failed to fetch user info');
      const errorRedirect = `${redirectOrigin}/oauth-bridge#type=OAUTH_ERROR&error=${encodeURIComponent('Failed to retrieve user info')}&flow=${flow}`;
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': errorRedirect
        }
      });
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
      
      // Deactivate previous orphaned integrations
      const { error: deactivateError } = await supabase
        .from('google_integrations')
        .update({ is_active: false })
        .eq('user_id', finalUserId)
        .eq('project_id', finalProjectId)
        .is('agent_id', null)
        .eq('is_active', true);
      
      if (deactivateError) {
        console.error('Error deactivating previous orphans:', deactivateError);
      }
      
    } else {
      // For agent management flow: validate agent exists and get project_id
      if (!agentId) {
        console.error('Agent ID is required for agent-management flow');
        const errorRedirect = `${redirectOrigin}/oauth-bridge#type=OAUTH_ERROR&error=${encodeURIComponent('Missing agent ID')}&flow=${flow}`;
        return new Response(null, {
          status: 302,
          headers: {
            ...corsHeaders,
            'Location': errorRedirect
          }
        });
      }

      const { data: agent, error: agentError } = await supabase
        .from('onboarding_responses')
        .select('project_id, user_id')
        .eq('id', agentId)
        .single();

      if (agentError) {
        console.error('Error fetching agent:', agentError);
        const errorRedirect = `${redirectOrigin}/oauth-bridge#type=OAUTH_ERROR&error=${encodeURIComponent('Agent not found')}&flow=${flow}`;
        return new Response(null, {
          status: 302,
          headers: {
            ...corsHeaders,
            'Location': errorRedirect
          }
        });
      }

      if (!agent) {
        console.error('Agent not found:', agentId);
        const errorRedirect = `${redirectOrigin}/oauth-bridge#type=OAUTH_ERROR&error=${encodeURIComponent('Agent does not exist')}&flow=${flow}`;
        return new Response(null, {
          status: 302,
          headers: {
            ...corsHeaders,
            'Location': errorRedirect
          }
        });
      }
      
      finalProjectId = agent.project_id;
      finalUserId = agent.user_id;
      finalAgentId = agentId;
    }

    // Check for existing integration to potentially reuse refresh token
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
            _requesting_user_id: existingIntegration.user_id,
            _encryption_key: supabaseServiceKey
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

    // Prepare integration metadata (without tokens)
    const integrationData: any = {
      user_id: finalUserId,
      project_id: finalProjectId,
      agent_id: finalAgentId,
      token_expires_at: expiresAt.toISOString(),
      scopes: tokenData.scope?.split(' ') || [],
      user_email: userInfo.email,
      is_active: true,
    };

    // For onboarding flow, add created_without_agent timestamp
    if (isOnboardingFlow) {
      integrationData.created_without_agent = new Date().toISOString();
    }

    // Check if we should update or insert
    if (!isOnboardingFlow && finalAgentId) {
      // For agent-management flow, try to update first
      const { data: existingAgentIntegration } = await supabase
        .from('google_integrations')
        .select('id')
        .eq('agent_id', finalAgentId)
        .maybeSingle();

      if (existingAgentIntegration) {
        // Update existing integration
        const { error: updateError } = await supabase
          .from('google_integrations')
          .update(integrationData)
          .eq('id', existingAgentIntegration.id);

        if (updateError) {
          console.error('Error updating Google integration:', updateError);
          const errorRedirect = `${redirectOrigin}/oauth-bridge#type=OAUTH_ERROR&error=${encodeURIComponent('Failed to update integration')}&flow=${flow}`;
          return new Response(null, {
            status: 302,
            headers: {
              ...corsHeaders,
              'Location': errorRedirect
            }
          });
        }

        // Store encrypted tokens
        const { error: tokenStoreError } = await supabase
          .rpc('store_google_tokens', {
            _integration_id: existingAgentIntegration.id,
            _access_token: tokenData.access_token,
            _refresh_token: refreshTokenToUse,
            _expires_at: expiresAt.toISOString(),
            _requesting_user_id: finalUserId,
            _encryption_key: supabaseServiceKey
          });

        if (tokenStoreError) {
          console.error('Error storing encrypted tokens:', tokenStoreError);
          const errorRedirect = `${redirectOrigin}/oauth-bridge#type=OAUTH_ERROR&error=${encodeURIComponent('Failed to store tokens')}&flow=${flow}`;
          return new Response(null, {
            status: 302,
            headers: {
              ...corsHeaders,
              'Location': errorRedirect
            }
          });
        }

        console.log('Google integration updated successfully for project:', finalProjectId);
        
        // Redirect to OAuth bridge page
        const successRedirect = `${redirectOrigin}/oauth-bridge#type=OAUTH_SUCCESS&email=${encodeURIComponent(userInfo.email)}&agentId=${finalAgentId}&flow=agent-management`;
        return new Response(null, {
          status: 302,
          headers: {
            ...corsHeaders,
            'Location': successRedirect
          }
        });
      }
    }

    // Insert new integration
    const { data: upsertedIntegration, error: insertError } = await supabase
      .from('google_integrations')
      .insert(integrationData)
      .select('id')
      .single();

    if (insertError) {
      console.error('Error storing Google integration:', insertError);
      const errorRedirect = `${redirectOrigin}/oauth-bridge#type=OAUTH_ERROR&error=${encodeURIComponent('Failed to store integration')}&flow=${flow}`;
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': errorRedirect
        }
      });
    }

    // Store encrypted tokens using the secure function
    const { error: tokenStoreError } = await supabase
      .rpc('store_google_tokens', {
        _integration_id: upsertedIntegration.id,
        _access_token: tokenData.access_token,
        _refresh_token: refreshTokenToUse,
        _expires_at: expiresAt.toISOString(),
        _requesting_user_id: finalUserId,
        _encryption_key: supabaseServiceKey
      });

    if (tokenStoreError) {
      console.error('Error storing encrypted tokens:', tokenStoreError);
      const errorRedirect = `${redirectOrigin}/oauth-bridge#type=OAUTH_ERROR&error=${encodeURIComponent('Failed to store tokens')}&flow=${flow}`;
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': errorRedirect
        }
      });
    }

    console.log('Google integration stored successfully for project:', finalProjectId);
    
    // Redirect to OAuth bridge page
    if (isOnboardingFlow) {
      const successRedirect = `${redirectOrigin}/oauth-bridge#type=OAUTH_SUCCESS&email=${encodeURIComponent(userInfo.email)}&flow=onboarding`;
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': successRedirect
        }
      });
    } else {
      const successRedirect = `${redirectOrigin}/oauth-bridge#type=OAUTH_SUCCESS&email=${encodeURIComponent(userInfo.email)}&agentId=${finalAgentId}&flow=agent-management`;
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': successRedirect
        }
      });
    }

  } catch (error) {
    console.error('Unexpected error in OAuth callback:', error);
    const url = new URL(req.url);
    const state = url.searchParams.get('state');
    const stateParts = state?.split('|') || [];
    const appOrigin = stateParts[2] ? decodeURIComponent(stateParts[2]) : 'https://lovable.dev';
    const flow = stateParts[1] || 'unknown';
    
    const errorRedirect = `${appOrigin}/oauth-bridge#type=OAUTH_ERROR&error=${encodeURIComponent('Unexpected error occurred')}&flow=${flow}`;
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': errorRedirect
      }
    });
  }
});
