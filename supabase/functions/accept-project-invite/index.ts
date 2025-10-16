import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('Accept project invite function called');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token } = await req.json();
    
    if (!token) {
      console.error('No token provided');
      return new Response(
        JSON.stringify({ error: 'Token is required' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Processing invitation token:', token);

    // Create Supabase admin client with service role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    // Get user from request auth
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('No auth header found');
      return new Response(
        JSON.stringify({ error: 'Authentication required' }), 
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const userToken = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(userToken);
    
    if (userError || !user) {
      console.error('Invalid user token:', userError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }), 
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('User authenticated:', user.id);

    // Find the invitation
    const { data: invitation, error: inviteError } = await supabase
      .from('project_invitations')
      .select('*')
      .eq('token', token)
      .eq('status', 'pending')
      .single();

    if (inviteError || !invitation) {
      console.error('Invitation not found or expired:', inviteError);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired invitation' }), 
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check if invitation is expired
    if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
      console.error('Invitation expired');
      return new Response(
        JSON.stringify({ error: 'Invitation has expired' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Found valid invitation:', invitation.id, 'for email:', invitation.email);

    // Verify the invitation email matches the authenticated user
    const invitedEmail = (invitation.email || '').toLowerCase().trim();
    const userEmail = (user.email || '').toLowerCase().trim();
    if (!userEmail || invitedEmail !== userEmail) {
      console.error('Authenticated user email does not match invitation email', { invitedEmail, userEmail });
      return new Response(
        JSON.stringify({ error: 'This invitation was sent to a different email address. Please sign in with the invited email.' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Email verified for invitation token:', token);

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('project_members')
      .select('id')
      .eq('project_id', invitation.project_id)
      .eq('user_id', user.id)
      .single();

    if (existingMember) {
      console.log('User is already a member, updating invitation status');
      
      // Update invitation status to accepted
      const { error: updateError } = await supabase
        .from('project_invitations')
        .update({ status: 'accepted' })
        .eq('id', invitation.id);

      if (updateError) {
        console.error('Error updating invitation status:', updateError);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'You are already a member of this project',
          projectId: invitation.project_id
        }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Adding user to project members...');

    // Double-check: ensure user doesn't belong to any other project
    const { data: anyMembership, error: checkError } = await supabase
      .from('project_members')
      .select('id, project_id, role, projects(name)')
      .eq('user_id', user.id)
      .maybeSingle();

    if (anyMembership && !checkError) {
      const projectName = anyMembership.projects?.name || 'another project';
      console.error('User already belongs to another project:', user.id, anyMembership.project_id);
      
      // Update invitation status to rejected
      await supabase
        .from('project_invitations')
        .update({ status: 'rejected' })
        .eq('id', invitation.id);
      
      return new Response(
        JSON.stringify({ 
          error: `You are already a ${anyMembership.role} of "${projectName}". Each user can only belong to one project. Please contact support if you need to switch projects.`,
          code: 'USER_ALREADY_IN_PROJECT'
        }), 
        { 
          status: 409, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Add user to project members using service role (bypasses RLS)
    try {
      const { error: memberError } = await supabase
        .from('project_members')
        .insert({
          project_id: invitation.project_id,
          user_id: user.id,
          role: invitation.role
        });

      if (memberError) {
        // Check if it's the unique constraint violation
        if (memberError.message?.includes('idx_one_user_one_project')) {
          console.error('Database constraint: User already in another project');
          return new Response(
            JSON.stringify({ 
              error: 'You are already a member of another project. Each user can only belong to one project.',
              code: 'USER_ALREADY_IN_PROJECT'
            }), 
            { 
              status: 409, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
        
        throw memberError;
      }
    } catch (error) {
      console.error('Error adding user to project:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to add user to project' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Successfully added user to project members');

    // Update invitation status to accepted
    const { error: updateError } = await supabase
      .from('project_invitations')
      .update({ status: 'accepted' })
      .eq('id', invitation.id);

    if (updateError) {
      console.error('Error updating invitation status:', updateError);
      // Don't fail the request if status update fails, member was added successfully
    }

    console.log('Successfully processed invitation acceptance');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Successfully joined project',
        projectId: invitation.project_id
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error in accept-project-invite:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});