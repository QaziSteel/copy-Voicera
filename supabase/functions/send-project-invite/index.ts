import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'npm:resend@2.0.0'

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

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
    
    // Normalize email
    const normalizedEmail = email?.toLowerCase().trim();
    
    if (!normalizedEmail || !projectId || !inviterId) {
      console.error('Missing required fields');
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email, projectId, and inviterId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      console.error('Invalid email format:', normalizedEmail);
      return new Response(
        JSON.stringify({ error: 'Invalid email address format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate email length
    if (normalizedEmail.length > 255) {
      console.error('Email too long:', normalizedEmail.length);
      return new Response(
        JSON.stringify({ error: 'Email address too long (max 255 characters)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate role
    const validRoles = ['member', 'admin'];
    if (!validRoles.includes(role)) {
      console.error('Invalid role:', role);
      return new Response(
        JSON.stringify({ error: 'Invalid role. Must be "member" or "admin"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing invitation request:', { 
      email: normalizedEmail, 
      projectId, 
      role,
      timestamp: new Date().toISOString()
    });

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

    // Check if the invited email already belongs to a registered user
    const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    if (usersError) {
      console.error('Error fetching users:', usersError);
      return new Response(
        JSON.stringify({ error: 'Failed to validate invitation' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const existingUser = users.find(u => u.email?.toLowerCase().trim() === normalizedEmail);

    // If user exists, check if they're already in ANY project
    if (existingUser) {
      const { data: existingMembership, error: memberError } = await supabaseAdmin
        .from('project_members')
        .select('id, role, projects(name)')
        .eq('user_id', existingUser.id)
        .maybeSingle();

      if (existingMembership && !memberError) {
        const projectName = existingMembership.projects?.name || 'another project';
        const userRole = existingMembership.role;
        console.log('User already belongs to a project:', normalizedEmail, existingMembership);
        
        return new Response(
          JSON.stringify({ 
            error: `This user is already a ${userRole} of "${projectName}". Each user can only belong to one project.`,
            code: 'USER_ALREADY_IN_PROJECT'
          }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Check for existing pending invitation
    const { data: existingInvite } = await supabaseAdmin
      .from('project_invitations')
      .select('id, status')
      .eq('project_id', projectId)
      .eq('email', normalizedEmail)
      .eq('status', 'pending')
      .single();

    if (existingInvite) {
      console.log('Pending invitation already exists for:', normalizedEmail);
      return new Response(
        JSON.stringify({ error: 'An invitation for this email is already pending for this project' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate unique invitation token
    const invitationToken = crypto.randomUUID() + '-' + Date.now();

    // Create invitation record with token and expiration
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    const { data: invitation, error: inviteError } = await supabaseAdmin
      .from('project_invitations')
      .insert({
        project_id: projectId,
        inviter_id: inviterId,
        email: normalizedEmail,
        role,
        status: 'pending',
        token: invitationToken,
        expires_at: expiresAt.toISOString()
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

    console.log('Invitation record created with token:', invitation.id);

    // Get project and inviter details for email content
    const { data: project } = await supabaseAdmin
      .from('projects')
      .select('name, description')
      .eq('id', projectId)
      .single();

    const { data: inviter } = await supabaseAdmin
      .from('profiles')
      .select('full_name, email')
      .eq('id', inviterId)
      .single();

    const projectName = project?.name || 'VoiceRA Project';
    const projectDescription = project?.description || 'AI Voice Assistant Platform';
    const inviterName = inviter?.full_name || inviter?.email || 'Team Member';
    const inviterEmail = inviter?.email || '';

    // Construct invitation URL with token (use environment variable or fallback)
    const baseUrl = Deno.env.get('APP_BASE_URL') ?? 'https://nhhdxwgrmcdsapbuvelx.lovable.app';
    const invitationUrl = `${baseUrl}/invite?token=${invitationToken}`;

    console.log('Sending invitation email with token-based URL:', invitationUrl);

    // Create professional HTML email template
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Project Invitation</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">You're Invited!</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Join ${projectName} on VoiceRA</p>
          </div>
          
          <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e1e5e9; border-top: none; border-radius: 0 0 10px 10px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea;">
                <p style="margin: 0; font-size: 16px;"><strong>${inviterName}</strong> has invited you to join <strong>${projectName}</strong> as a <span style="color: #667eea; font-weight: 600;">${role}</span>.</p>
                ${projectDescription ? `<p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">${projectDescription}</p>` : ''}
              </div>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${invitationUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4); transition: transform 0.2s;">
                Join Project →
              </a>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 30px 0;">
              <h3 style="margin: 0 0 15px 0; color: #333; font-size: 16px;">What happens next?</h3>
              <ul style="margin: 0; padding-left: 20px; color: #666;">
                <li style="margin-bottom: 8px;">Click the "Join Project" button above</li>
                <li style="margin-bottom: 8px;">If you have an account, you'll join immediately</li>
                <li style="margin-bottom: 8px;">If you're new, create your account and join automatically</li>
                <li>Start collaborating with the team right away!</li>
              </ul>
            </div>
            
            <div style="border-top: 1px solid #e1e5e9; padding-top: 20px; margin-top: 30px;">
              <p style="color: #666; font-size: 14px; margin: 0;">
                This invitation was sent by <strong>${inviterName}</strong> ${inviterEmail ? `(${inviterEmail})` : ''} and will expire in 7 days.
              </p>
              <p style="color: #999; font-size: 12px; margin: 15px 0 0 0;">
                If you didn't expect this invitation, you can safely ignore this email. If you have questions, please contact the person who invited you.
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>Powered by VoiceRA - AI Voice Assistant Platform</p>
          </div>
        </body>
      </html>
    `;

    // Send invitation email using Resend
    const emailResponse = await resend.emails.send({
      from: 'VoiceRA <invitations@resend.dev>',
      to: [normalizedEmail],
      subject: `You're invited to join ${projectName}!`,
      html: htmlContent,
    });

    if (!emailResponse || emailResponse.error) {
      console.error('Error sending invitation email via Resend:', emailResponse?.error);

      // Do NOT delete the invitation; return a success payload with a copyable link
      return new Response(
        JSON.stringify({
          success: true,
          invitationId: invitation.id,
          token: invitationToken,
          invitationUrl,
          emailSent: false,
          message: 'Invitation created, but email could not be sent. Share the link directly.',
          expiresAt: expiresAt.toISOString()
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Invitation sent successfully via Resend to:', normalizedEmail, 'Email ID:', emailResponse.data?.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        invitationId: invitation.id,
        token: invitationToken,
        invitationUrl,
        emailSent: true,
        emailId: emailResponse.data?.id,
        message: `Invitation sent to ${normalizedEmail}`,
        expiresAt: expiresAt.toISOString()
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error in send-project-invite:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});