import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProject } from '@/contexts/ProjectContext';
import { useProjectInvite } from '@/hooks/useProjectInvite';
import { useInvitations } from '@/hooks/useInvitations';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, X, UserPlus, Users, Mail, Crown, Shield, User, Trash2 } from 'lucide-react';
import { Header } from '@/components/shared/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function Profile() {
  const { user, verifyCurrentPassword, updatePassword, signOut } = useAuth();
  const { currentProject, projects, projectMembers, currentUserRole, switchProject, refreshProjectMembers, refreshProjects } = useProject();
  const { inviteUserToProject, removeUserFromProject, loading: inviteLoading } = useProjectInvite();
  const navigate = useNavigate();
  const { invites, loading: invitesLoading, acceptInvite, declineInvite, refresh: refreshInvites } = useInvitations();
  
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'member' | 'admin'>('member');
  const [countdown, setCountdown] = useState(0);
  const [generatedCode, setGeneratedCode] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showCurrentPasswordDisplay, setShowCurrentPasswordDisplay] = useState(false);
  const [currentPasswordVerified, setCurrentPasswordVerified] = useState(false);
  const [verifyingPassword, setVerifyingPassword] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [originalName, setOriginalName] = useState('');
  const [showNameSuccessModal, setShowNameSuccessModal] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const fetchProfileData = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching profile:', error);
        } else {
          setProfileData(data);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [user, navigate]);

  const handleInviteUser = async () => {
    if (!inviteEmail) return;
    
    const result = await inviteUserToProject(inviteEmail, inviteRole);
    if (result.success) {
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteRole('member');
      refreshProjectMembers();
    }
  };

  const handleRemoveUser = async (userId: string) => {
    const result = await removeUserFromProject(userId);
    if (result.success) {
      refreshProjectMembers();
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-primary text-primary-foreground';
      case 'admin': return 'bg-orange-100 text-orange-800';
      case 'member': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="w-4 h-4" />;
      case 'admin': return <Shield className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const formatExpiryDate = (expiresAt?: string | null) => {
    if (!expiresAt) return 'soon';
    const diffMs = new Date(expiresAt).getTime() - Date.now();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    if (hours <= 0) return 'soon';
    if (hours < 24) return `in ${hours}h`;
    const days = Math.floor(hours / 24);
    return `in ${days}d`;
  };

  // Password Management Functions
  const handleVerifyCurrentPassword = async () => {
    if (!currentPassword) {
      toast.error('Please enter your current password');
      return;
    }

    setVerifyingPassword(true);
    const { error } = await verifyCurrentPassword(currentPassword);
    
    if (error) {
      toast.error('Current password is incorrect');
      setVerifyingPassword(false);
      return;
    }
    
    setCurrentPasswordVerified(true);
    setVerifyingPassword(false);
    toast.success('Password verified! You can now enter a new password.');
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }

    if (!currentPasswordVerified) {
      toast.error('Please verify your current password first');
      return;
    }

    const { error } = await updatePassword(currentPassword, newPassword);

    if (error) {
      toast.error(`Failed to update password: ${error.message}`);
    } else {
      toast.success('Password updated successfully!');
      setShowChangePasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setCurrentPasswordVerified(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleSaveName = async () => {
    if (!editedName.trim()) {
      toast.error('Name cannot be empty');
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: editedName.trim() })
        .eq('id', user?.id);

      if (error) throw error;

      setProfileData({ ...profileData, full_name: editedName.trim() });
      setIsEditingName(false);
      setShowNameSuccessModal(true);
    } catch (error) {
      console.error('Error updating name:', error);
      toast.error('Failed to update name');
    }
  };

  const handleDiscardName = () => {
    setEditedName(originalName);
    setIsEditingName(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currentPage="profile" />

      <main className="px-3 md:px-6 lg:px-12 py-6">
        <div className="mb-4">
          <h1 className="text-2xl font-semibold text-black mb-1">Profile</h1>
          <p className="text-lg font-semibold text-gray-500">
            Manage your account information and team access.
          </p>
        </div>

        <div className="space-y-6">
          {/* Project Selection */}
          {projects.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Current Project</CardTitle>
              </CardHeader>
              <CardContent>
                <Select 
                  value={currentProject?.id || ''} 
                  onValueChange={switchProject}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          )}

          {/* Pending Invitations */}
          {invites && invites.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Pending Invitations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {invites.map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between border border-gray-200 rounded-lg p-3">
                      <div>
                        <div className="text-sm font-medium text-black">{inv.project_name || 'Project'}</div>
                        <div className="text-xs text-gray-500">Role: {inv.role} • Expires {formatExpiryDate(inv.expires_at)}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={async () => {
                          const res = await acceptInvite(inv.token);
                          if (res.success) {
                            toast.success('Joined project');
                            await refreshInvites();
                            await refreshProjects();
                            if (res.projectId) {
                              switchProject(res.projectId);
                            }
                          } else {
                            toast.error(res.error || 'Failed to accept');
                          }
                        }}>Accept</Button>
                        <Button size="sm" variant="outline" onClick={async () => {
                          const res = await declineInvite(inv.token);
                          if (res.success) {
                            toast.info('Invitation declined');
                            await refreshInvites();
                          } else {
                            toast.error(res.error || 'Failed to decline');
                          }
                        }}>Decline</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Account Information */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-black">Account Information</h2>
            <div className="bg-white rounded-3xl border border-gray-200 p-4 space-y-4">
              <div className="space-y-2">
                <label className="text-base font-semibold text-black">Full Name</label>
                <div className="bg-gray-100 rounded-xl px-4 py-3 flex justify-between items-center">
                  {isEditingName ? (
                    <>
                      <Input
                        type="text"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        className="flex-1 mr-2 bg-white"
                        placeholder="Enter your full name"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleDiscardName}
                          className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 text-sm font-medium transition-colors"
                        >
                          Discard
                        </button>
                        <button
                          onClick={handleSaveName}
                          className="flex items-center gap-2 px-3 py-2 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
                        >
                          Save
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="text-gray-500">
                        {profileData?.full_name || user?.user_metadata?.full_name || "Not provided"}
                      </span>
                      <button
                        onClick={() => {
                          const currentName = profileData?.full_name || user?.user_metadata?.full_name || '';
                          setOriginalName(currentName);
                          setEditedName(currentName);
                          setIsEditingName(true);
                        }}
                        className="bg-black text-white px-3 py-2 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
                      >
                        Change name
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-1 space-y-2">
                  <label className="text-base font-semibold text-black">Email Address</label>
                  <div className="bg-gray-100 rounded-xl px-4 py-3">
                    <span className="text-gray-500">{user?.email || "Not provided"}</span>
                  </div>
                </div>

                <div className="flex-1 space-y-2">
                  <label className="text-base font-semibold text-black">Current Password</label>
                  <div className="bg-gray-100 rounded-xl px-4 py-3 flex justify-between items-center">
                    <span className="text-gray-500 text-xl">••••••••••••</span>
                    <button
                      onClick={() => setShowChangePasswordModal(true)}
                      className="bg-black text-white px-3 py-2 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
                    >
                      Change Password
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Project Team Management */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-black flex items-center gap-2">
                <Users className="w-5 h-5" />
                Team Management
              </h2>
              <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
                <DialogTrigger asChild>
                  <Button className="bg-black text-white hover:bg-gray-800">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Send Invite
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invite Team Member</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Email Address</label>
                      <Input
                        type="email"
                        placeholder="Enter email address"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Role</label>
                      <Select value={inviteRole} onValueChange={(value: 'member' | 'admin') => setInviteRole(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleInviteUser} 
                        disabled={!inviteEmail || inviteLoading}
                        className="flex-1"
                      >
                        {inviteLoading ? 'Sending...' : 'Send Invite'}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setShowInviteModal(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="bg-gray-100 px-4 py-3 flex items-center gap-4 border-b border-gray-200">
                <div className="w-8 text-xs font-bold text-gray-600 uppercase">NO.</div>
                <div className="flex-1 text-xs font-bold text-gray-600 uppercase">Name</div>
                <div className="flex-1 text-xs font-bold text-gray-600 uppercase">Email</div>
                <div className="w-40 text-xs font-bold text-gray-600 uppercase">Role</div>
                <div className="w-32 text-xs font-bold text-gray-600 uppercase">Actions</div>
              </div>

              {projectMembers.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">No team members yet</p>
                  <p className="text-sm">Invite team members to collaborate on this project.</p>
                </div>
              ) : (
                projectMembers.map((member, index) => (
                  <div key={member.id} className="px-4 py-3 flex items-center gap-4 border-b border-gray-100 last:border-b-0">
                    <div className="w-8 text-sm font-medium text-gray-700">
                      {String(index + 1).padStart(2, '0')}
                    </div>
                    <div className="flex-1 text-sm font-medium text-gray-900">
                      {member.profiles?.full_name || 'Unknown User'}
                    </div>
                    <div className="flex-1 text-sm text-gray-600">
                      {member.profiles?.email || 'No email'}
                    </div>
                    <div className="w-40">
                      <Badge className={`${getRoleBadgeColor(member.role)} flex items-center gap-1`}>
                        {getRoleIcon(member.role)}
                        {member.role}
                      </Badge>
                    </div>
                    <div className="w-32">
                      {member.role !== 'owner' && member.user_id !== user?.id && currentUserRole === 'owner' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRemoveUser(member.user_id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Change Password Modal */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Change Password</h3>
              <button onClick={() => {
                setShowChangePasswordModal(false);
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setCurrentPasswordVerified(false);
                setShowCurrentPassword(false);
                setShowNewPassword(false);
                setShowConfirmPassword(false);
              }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <Input
                    type={showCurrentPassword ? "text" : "password"}
                    placeholder="Current Password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    disabled={currentPasswordVerified}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={currentPasswordVerified}
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {!currentPasswordVerified && (
                  <Button 
                    onClick={handleVerifyCurrentPassword}
                    disabled={!currentPassword || verifyingPassword}
                    className="w-full"
                    size="sm"
                  >
                    {verifyingPassword ? 'Verifying...' : 'Verify Current Password'}
                  </Button>
                )}
                {currentPasswordVerified && (
                  <div className="text-sm text-green-600 flex items-center gap-2">
                    ✓ Current password verified
                  </div>
                )}
              </div>
              
              <div className="relative">
                <Input
                  type={showNewPassword ? "text" : "password"}
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={!currentPasswordVerified}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={!currentPasswordVerified}
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={!currentPasswordVerified}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={!currentPasswordVerified}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleChangePassword}
                  disabled={!currentPasswordVerified || !newPassword || !confirmPassword}
                  className="flex-1"
                >
                  Update Password
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowChangePasswordModal(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setCurrentPasswordVerified(false);
                    setShowCurrentPassword(false);
                    setShowNewPassword(false);
                    setShowConfirmPassword(false);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Name Change Success Modal */}
      {showNameSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 w-full max-w-md text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-black mb-2">Success!</h3>
              <p className="text-gray-600">Name changed successfully</p>
            </div>
            <Button
              onClick={() => setShowNameSuccessModal(false)}
              className="w-full bg-black text-white hover:bg-gray-800"
            >
              Continue
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
