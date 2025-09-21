import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, projectId, inviterId, role = 'member' } = await req.json();

    if (!email || !projectId || !inviterId) {
      console.error('Missing required fields:', { email: !!email, projectId: !!projectId, inviterId: !!inviterId });
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email, projectId, inviterId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing invitation request:', { email, projectId, role });

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

    // Create invitation record first
    const { data: invitation, error: inviteError } = await supabaseAdmin
      .from('project_invitations')
      .insert({
        project_id: projectId,
        inviter_id: inviterId,
        email,
        role,
        status: 'pending'
      })
      .select()
      .single();

    if (inviteError) {
      console.error('Error creating invitation record:', inviteError);
      return new Response(
        JSON.stringify({ error: 'Failed to create invitation record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Invitation record created:', invitation.id);

    // Get project and inviter details for email content
    const { data: project } = await supabaseAdmin
      .from('projects')
      .select('name')
      .eq('id', projectId)
      .single();

    const { data: inviter } = await supabaseAdmin
      .from('profiles')
      .select('full_name, email')
      .eq('id', inviterId)
      .single();

    const projectName = project?.name || 'VoiceRA Project';
    const inviterName = inviter?.full_name || inviter?.email || 'Team Member';

    // Construct custom redirect URL with invitation details
    const redirectUrl = `${Deno.env.get('SUPABASE_URL')?.replace('supabase.co', 'lovable.app')}/invite?project=${projectId}&invitation=${invitation.id}`;

    console.log('Sending invitation email with redirect:', redirectUrl);

    // Send invitation email using Supabase Auth
    const { data: inviteData, error: emailError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        redirectTo: redirectUrl,
        data: {
          project_name: projectName,
          inviter_name: inviterName,
          role: role,
          invitation_id: invitation.id
        }
      }
    );

    if (emailError) {
      console.error('Error sending invitation email:', emailError);
      
      // Clean up invitation record if email failed
      await supabaseAdmin
        .from('project_invitations')
        .delete()
        .eq('id', invitation.id);

      return new Response(
        JSON.stringify({ error: 'Failed to send invitation email', details: emailError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Invitation sent successfully to:', email);

    return new Response(
      JSON.stringify({ 
        success: true, 
        invitationId: invitation.id,
        message: `Invitation sent to ${email}` 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error in send-project-invite:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});