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

    // Try to get email from JWT if provided (optional, for existing users)
    let userEmail: string | null = null;
    const authHeader = req.headers.get('authorization');

    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const userToken = authHeader.replace('Bearer ', '');
        const payload = JSON.parse(atob(userToken.split('.')[1]));
        userEmail = payload.email || payload.sub;
        console.log('Extracted email from JWT:', userEmail);
      } catch (e) {
        console.log('Could not extract email from JWT (might be new signup):', e);
        // Continue anyway - we'll use the invitation email
      }
    }

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

    console.log('Found valid invitation for email:', invitation.email);

    // If JWT email provided, verify it matches invitation
    if (userEmail && userEmail.toLowerCase() !== invitation.email.toLowerCase()) {
      console.error('JWT email does not match invitation email');
      return new Response(
        JSON.stringify({ error: 'This invitation is for a different email address' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Look up user by querying profiles table directly - much faster than listUsers()
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', invitation.email.toLowerCase())
      .single();

    if (profileError || !profile) {
      console.error('User profile not found for invitation email:', invitation.email);
      return new Response(
        JSON.stringify({ 
          error: 'User account not found. Please ensure you have signed up with the invited email address.',
          code: 'USER_NOT_FOUND'
        }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const user = { id: profile.id, email: profile.email };

    console.log('Found user for invitation:', user.id);
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