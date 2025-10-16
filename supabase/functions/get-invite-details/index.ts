import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InviteDetailsRequest {
  token: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token }: InviteDetailsRequest = await req.json();

    if (!token) {
      console.error('Missing token in request');
      return new Response(
        JSON.stringify({ error: 'Token is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetching invite details for token:', token.substring(0, 10) + '...');

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Look up invitation by token
    const { data: invitation, error: inviteError } = await supabaseAdmin
      .from('project_invitations')
      .select('email, role, expires_at, project_id, inviter_id, status')
      .eq('token', token)
      .eq('status', 'pending')
      .single();

    if (inviteError || !invitation) {
      console.error('Invitation lookup error:', inviteError);
      return new Response(
        JSON.stringify({ error: 'Invitation not found or has already been used' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if invitation has expired
    const now = new Date();
    const expiresAt = new Date(invitation.expires_at);
    
    if (now > expiresAt) {
      console.log('Invitation expired:', { now, expiresAt });
      return new Response(
        JSON.stringify({ error: 'This invitation has expired' }),
        { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Load project details
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('name, description')
      .eq('id', invitation.project_id)
      .single();

    if (projectError) {
      console.error('Error loading project:', projectError);
      return new Response(
        JSON.stringify({ error: 'Failed to load project details' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Load inviter details
    const { data: inviter, error: inviterError } = await supabaseAdmin
      .from('profiles')
      .select('full_name, email')
      .eq('id', invitation.inviter_id)
      .single();

    if (inviterError) {
      console.error('Error loading inviter:', inviterError);
    }

    // Return sanitized data
    const response = {
      success: true,
      invitation: {
        email: invitation.email,
        role: invitation.role,
        expires_at: invitation.expires_at,
        project_id: invitation.project_id
      },
      project: {
        name: project.name,
        description: project.description
      },
      inviter: {
        name: inviter?.full_name || inviter?.email || 'Someone'
      }
    };

    console.log('Successfully fetched invite details');
    
    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in get-invite-details function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);
