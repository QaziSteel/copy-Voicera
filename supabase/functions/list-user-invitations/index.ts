import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('list-user-invitations called');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: { persistSession: false, autoRefreshToken: false },
      }
    );

    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Missing or invalid Authorization header');
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userToken = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(userToken);

    if (userError || !user) {
      console.error('Invalid user token', userError);
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userEmail = (user.email || '').toLowerCase();
    if (!userEmail) {
      console.error('Authenticated user has no email');
      return new Response(JSON.stringify({ error: 'User email is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Fetching invitations for email:', userEmail);

    const { data: invites, error: invitesError } = await supabase
      .from('project_invitations')
      .select('id, project_id, role, expires_at, token, status, email, inviter_id')
      .eq('status', 'pending')
      .ilike('email', userEmail);

    if (invitesError) {
      console.error('Error fetching invitations:', invitesError);
      return new Response(JSON.stringify({ error: 'Failed to fetch invitations' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const projectIds = Array.from(new Set((invites || []).map(i => i.project_id)));
    const projectNameMap: Record<string, string> = {};

    if (projectIds.length > 0) {
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('id, name')
        .in('id', projectIds);

      if (projectsError) {
        console.error('Error fetching project names:', projectsError);
      } else {
        for (const p of projects || []) {
          projectNameMap[p.id] = p.name;
        }
      }
    }

    const result = (invites || []).map((i) => ({
      id: i.id,
      project_id: i.project_id,
      project_name: projectNameMap[i.project_id] || null,
      role: i.role,
      expires_at: i.expires_at,
      token: i.token,
      status: i.status,
      email: i.email,
      inviter_id: i.inviter_id,
    }));

    console.log(`Returning ${result.length} invitations`);

    return new Response(JSON.stringify({ invitations: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Unexpected error in list-user-invitations:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});