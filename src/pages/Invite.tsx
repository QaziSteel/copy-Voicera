import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Users, Mail } from 'lucide-react';

export const Invite: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, signUp, signIn } = useAuth();
  
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

  const projectId = searchParams.get('project');
  const invitationId = searchParams.get('invitation');

  useEffect(() => {
    if (!projectId || !invitationId) {
      toast.error('Invalid invitation link');
      navigate('/');
      return;
    }

    loadInvitationData();
  }, [projectId, invitationId]);

  const loadInvitationData = async () => {
    try {
      setLoading(true);

      // Load invitation details
      const { data: invitationData, error: inviteError } = await supabase
        .from('project_invitations')
        .select('*')
        .eq('id', invitationId)
        .eq('project_id', projectId)
        .eq('status', 'pending')
        .single();

      if (inviteError || !invitationData) {
        toast.error('Invitation not found or has expired');
        navigate('/');
        return;
      }

      setInvitation(invitationData);

      // Load project details
      const { data: projectData } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      setProject(projectData);

      // Load inviter details
      const { data: inviterData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', invitationData.inviter_id)
        .single();

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
    if (!user || !invitation) return;

    setJoining(true);
    try {
      // Add user to project
      const { error: memberError } = await supabase
        .from('project_members')
        .insert({
          project_id: invitation.project_id,
          user_id: user.id,
          role: invitation.role
        });

      if (memberError) {
        if (memberError.code === '23505') {
          toast.error('You are already a member of this project');
        } else {
          throw memberError;
        }
      }

      // Mark invitation as accepted
      await supabase
        .from('project_invitations')
        .update({ status: 'accepted' })
        .eq('id', invitation.id);

      toast.success(`Successfully joined ${project?.name}!`);
      navigate('/dashboard');

    } catch (error) {
      console.error('Error joining project:', error);
      toast.error('Failed to join project');
    } finally {
      setJoining(false);
    }
  };

  const handleSignUp = async () => {
    if (!invitation) return;

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
      const { error } = await signUp(invitation.email, password, fullName);
      
      if (error) {
        toast.error(error.message || 'Failed to create account');
        return;
      }

      // After successful signup, join the project
      await joinProject();

    } catch (error) {
      console.error('Error signing up:', error);
      toast.error('Failed to create account');
    } finally {
      setSigningUp(false);
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
              This invitation link is invalid or has expired.
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