import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('decline-project-invite called');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token } = await req.json();

    if (!token) {
      console.error('No token provided');
      return new Response(JSON.stringify({ error: 'Token is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false, autoRefreshToken: false } }
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

    const { data: invitation, error: inviteError } = await supabase
      .from('project_invitations')
      .select('*')
      .eq('token', token)
      .eq('status', 'pending')
      .maybeSingle();

    if (inviteError || !invitation) {
      console.error('Invitation not found or already processed:', inviteError);
      return new Response(JSON.stringify({ error: 'Invalid or expired invitation' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const invitedEmail = (invitation.email || '').toLowerCase().trim();
    const userEmail = (user.email || '').toLowerCase().trim();
    if (!userEmail || invitedEmail !== userEmail) {
      console.error('User email does not match invitation email', { invitedEmail, userEmail });
      return new Response(JSON.stringify({ error: 'This invitation was sent to a different email address.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { error: updateError } = await supabase
      .from('project_invitations')
      .update({ status: 'declined' })
      .eq('id', invitation.id);

    if (updateError) {
      console.error('Error updating invitation status to declined:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to decline invitation' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Invitation declined:', invitation.id);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Unexpected error in decline-project-invite:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});