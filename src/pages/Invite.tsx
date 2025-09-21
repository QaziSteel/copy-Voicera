import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProject } from '@/contexts/ProjectContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Users, Mail, Clock } from 'lucide-react';

export const Invite: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, signUp, signIn } = useAuth();
  const { refreshProjects, switchProject } = useProject();
  
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [signingUp, setSigningUp] = useState(false);
  const [invitation, setInvitation] = useState<any>(null);
  const [project, setProject] = useState<any>(null);
  const [inviter, setInviter] = useState<any>(null);
  
  // Signup form state
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      toast.error('Invalid invitation link - missing token');
      navigate('/');
      return;
    }

    loadInvitationData();
  }, [token]);

  const loadInvitationData = async () => {
    try {
      setLoading(true);

      console.log('Loading invitation data for token:', token);

      // Load invitation details using token
      const { data: invitationData, error: inviteError } = await supabase
        .from('project_invitations')
        .select('*')
        .eq('token', token)
        .eq('status', 'pending')
        .single();

      if (inviteError || !invitationData) {
        console.error('Invitation lookup error:', inviteError);
        toast.error('Invitation not found, has expired, or has already been used');
        navigate('/');
        return;
      }

      // Check if invitation has expired
      const now = new Date();
      const expiresAt = new Date(invitationData.expires_at);
      
      if (now > expiresAt) {
        console.log('Invitation expired:', { now, expiresAt });
        toast.error('This invitation has expired');
        navigate('/');
        return;
      }

      setInvitation(invitationData);
      console.log('Invitation loaded:', invitationData);

      // Load project details
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', invitationData.project_id)
        .single();

      if (projectError) {
        console.error('Error loading project:', projectError);
      }
      setProject(projectData);

      // Load inviter details
      const { data: inviterData, error: inviterError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', invitationData.inviter_id)
        .single();

      if (inviterError) {
        console.error('Error loading inviter:', inviterError);
      }
      setInviter(inviterData);

    } catch (error) {
      console.error('Error loading invitation:', error);
      toast.error('Failed to load invitation details');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const joinProject = async () => {
    if (!user || !invitation) {
      console.error('Missing user or invitation for join:', { user: !!user, invitation: !!invitation });
      toast.error('Unable to join project - missing user or invitation data');
      return;
    }

    setJoining(true);
    try {
      console.log('Attempting to join project:', invitation.project_id, 'as role:', invitation.role);

      // Add user to project
      const { error: memberError } = await supabase
        .from('project_members')
        .insert({
          project_id: invitation.project_id,
          user_id: user.id,
          role: invitation.role
        });

      if (memberError) {
        console.error('Error adding user to project:', memberError);
        
        if (memberError.code === '23505') {
          toast.error('You are already a member of this project');
          return; // Return early - don't update invitation status
        } else {
          toast.error('Failed to join project - insufficient permissions or project not found');
          return; // Return early - don't update invitation status
        }
      }

      console.log('Successfully added user to project members');

      // Only mark invitation as accepted if member addition was successful
      const { error: updateError } = await supabase
        .from('project_invitations')
        .update({ status: 'accepted' })
        .eq('id', invitation.id);

      if (updateError) {
        console.error('Error updating invitation status:', updateError);
        toast.error('Joined project but failed to update invitation status');
      } else {
        console.log('Successfully updated invitation status to accepted');
      }

      // Refresh project context and set current project
      console.log('Refreshing project context...');
      await refreshProjects();
      
      // Switch to the newly joined project
      console.log('Switching to project ID:', invitation.project_id);
      switchProject(invitation.project_id);

      toast.success(`Successfully joined ${project?.name}!`);
      navigate('/dashboard');

    } catch (error) {
      console.error('Unexpected error joining project:', error);
      toast.error('Failed to join project - please try again');
    } finally {
      setJoining(false);
    }
  };

  const handleSignUp = async () => {
    if (!invitation) {
      console.error('No invitation available for signup');
      toast.error('Invalid invitation - please request a new one');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setSigningUp(true);
    try {
      console.log('Attempting signup for invitation email:', invitation.email);

      const { error } = await signUp(invitation.email, password, fullName);
      
      if (error) {
        console.error('Signup error:', error);
        toast.error(error.message || 'Failed to create account');
        return;
      }

      console.log('Signup successful, now joining project');
      
      // Small delay to ensure auth state is updated
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // After successful signup, join the project
      await joinProject();

    } catch (error) {
      console.error('Unexpected error during signup:', error);
      toast.error('Failed to create account - please try again');
    } finally {
      setSigningUp(false);
    }
  };

  // Format expiration date for display
  const formatExpiryDate = (expiresAt: string) => {
    const date = new Date(expiresAt);
    const now = new Date();
    const diffHours = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 1) {
      return `${diffDays} days`;
    } else if (diffHours > 1) {
      return `${diffHours} hours`;
    } else {
      return 'soon';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (!invitation || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-destructive">Invalid Invitation</CardTitle>
            <CardDescription>
              This invitation link is invalid, has expired, or has already been used.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')} className="w-full">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>You're Invited!</CardTitle>
          <CardDescription>
            {inviter?.full_name || inviter?.email} has invited you to join{' '}
            <strong>{project.name}</strong> as a {invitation.role}.
          </CardDescription>
          
          {/* Show expiration info */}
          <div className="flex items-center justify-center gap-2 mt-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Expires in {formatExpiryDate(invitation.expires_at)}</span>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {user ? (
            // User is already logged in
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="h-4 w-4" />
                  <span className="text-sm text-muted-foreground">Signed in as:</span>
                </div>
                <p className="font-medium">{user.email}</p>
              </div>
              
              <Button 
                onClick={joinProject} 
                disabled={joining}
                className="w-full"
              >
                {joining ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Joining Project...
                  </>
                ) : (
                  'Join Project'
                )}
              </Button>
            </div>
          ) : (
            // User needs to sign up
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Invitation for:</p>
                <p className="font-medium">{invitation.email}</p>
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Choose a secure password"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    required
                  />
                </div>

                <Button 
                  onClick={handleSignUp} 
                  disabled={signingUp || !fullName || !password || !confirmPassword}
                  className="w-full"
                >
                  {signingUp ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    'Sign Up & Join Project'
                  )}
                </Button>
              </div>

              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <Button
                    variant="link"
                    className="p-0 h-auto font-medium"
                    onClick={() => navigate('/auth')}
                  >
                    Sign in instead
                  </Button>
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};