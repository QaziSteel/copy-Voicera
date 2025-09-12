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
    // Validate service role authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Missing or invalid authorization header');
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const providedKey = authHeader.replace('Bearer ', '');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (providedKey !== serviceRoleKey) {
      console.log('Invalid service role key provided');
      return new Response(JSON.stringify({ error: 'Invalid service role key' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Initialize Supabase client with service role key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { projectId, userId } = await req.json();

    if (!projectId) {
      return new Response(JSON.stringify({ error: 'projectId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Retrieving Google tokens for project: ${projectId}, user: ${userId || 'any'}`);

    // Build query for Google integration
    let query = supabase
      .from('google_integrations')
      .select('*')
      .eq('project_id', projectId)
      .eq('is_active', true);

    // Add user filter if provided
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: integrations, error: integrationError } = await query;

    if (integrationError) {
      console.error('Database error fetching Google integration:', integrationError);
      return new Response(JSON.stringify({ error: 'Database error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!integrations || integrations.length === 0) {
      console.log(`No Google integration found for project: ${projectId}`);
      return new Response(JSON.stringify({ error: 'Google integration not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use the first active integration
    const integration = integrations[0];

    // Check if token needs refresh
    const tokenExpiry = new Date(integration.token_expires_at);
    const now = new Date();
    let accessToken = integration.access_token;
    let refreshToken = integration.refresh_token;

    let tokenExpiresAt = integration.token_expires_at;
    let isTokenRefreshed = false;

    if (tokenExpiry <= now) {
      // Refresh the token
      console.log('Refreshing Google access token...');

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
        const errorText = await refreshResponse.text();
        console.error('Failed to refresh token:', errorText);
        return new Response(JSON.stringify({ error: 'Failed to refresh Google token' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const refreshData = await refreshResponse.json();
      accessToken = refreshData.access_token;
      isTokenRefreshed = true;

      // Update the token in the database
      const newExpiry = new Date(Date.now() + refreshData.expires_in * 1000);
      tokenExpiresAt = newExpiry.toISOString();
      
      const { error: updateError } = await supabase
        .from('google_integrations')
        .update({
          access_token: accessToken,
          token_expires_at: tokenExpiresAt,
          updated_at: new Date().toISOString(),
        })
        .eq('id', integration.id);

      if (updateError) {
        console.error('Failed to update refreshed token:', updateError);
      } else {
        console.log('Successfully refreshed and updated token');
      }
    }

    // Return decrypted token information
    const response = {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_expires_at: tokenExpiresAt,
      user_email: integration.user_email,
      scopes: integration.scopes,
      is_active: integration.is_active,
      user_id: integration.user_id,
      project_id: integration.project_id,
      created_at: integration.created_at,
      updated_at: integration.updated_at,
      token_refreshed: isTokenRefreshed
    };

    console.log(`Successfully retrieved tokens for project: ${projectId}, user: ${integration.user_id}`);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in get-google-tokens function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});