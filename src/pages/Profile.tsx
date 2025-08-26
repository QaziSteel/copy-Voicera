import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="min-h-screen bg-muted">
      {/* Header */}
      <header className="bg-card border-b border-border px-16 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-foreground">Voicera AI</h1>
          
          <div className="flex items-center gap-8">
            <button
              onClick={() => navigate("/")}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back to Dashboard
            </button>
            
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                <span className="text-lg font-semibold text-foreground">
                  {user?.email?.[0]?.toUpperCase() || "U"}
                </span>
              </div>
              <button onClick={signOut} className="hover:text-muted-foreground transition-colors">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M18 9.00005C18 9.00005 13.5811 15 12 15C10.4188 15 6 9 6 9"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-16 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-semibold text-foreground mb-2">
              Profile Settings
            </h2>
            <p className="text-xl text-muted-foreground">
              Manage your account and preferences
            </p>
          </div>

          <div className="bg-card rounded-2xl overflow-hidden">
            {/* Tabs */}
            <div className="border-b border-border">
              <nav className="flex">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 ${
                    activeTab === 'profile'
                      ? 'border-foreground text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Profile
                </button>
                <button
                  onClick={() => setActiveTab('account')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 ${
                    activeTab === 'account'
                      ? 'border-foreground text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Account
                </button>
                <button
                  onClick={() => setActiveTab('notifications')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 ${
                    activeTab === 'notifications'
                      ? 'border-foreground text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Notifications
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-8">
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                        <input
                          type="email"
                          value={user?.email || ''}
                          disabled
                          className="w-full px-3 py-2 border border-border rounded-lg bg-muted text-muted-foreground"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Full Name</label>
                        <input
                          type="text"
                          placeholder="Enter your full name"
                          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:border-foreground focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Phone Number</label>
                        <input
                          type="tel"
                          placeholder="Enter your phone number"
                          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:border-foreground focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Company</label>
                        <input
                          type="text"
                          placeholder="Enter your company name"
                          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:border-foreground focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <button className="bg-foreground text-primary-foreground px-6 py-2 rounded-lg hover:bg-foreground/90 transition-colors">
                      Save Changes
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'account' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4">Account Settings</h3>
                    <div className="space-y-4">
                      <div className="border border-border rounded-lg p-4">
                        <h4 className="font-medium text-foreground mb-2">Change Password</h4>
                        <p className="text-muted-foreground text-sm mb-4">Update your password to keep your account secure</p>
                        <button className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg hover:bg-secondary/80 transition-colors">
                          Change Password
                        </button>
                      </div>
                      
                      <div className="border border-border rounded-lg p-4">
                        <h4 className="font-medium text-foreground mb-2">Two-Factor Authentication</h4>
                        <p className="text-muted-foreground text-sm mb-4">Add an extra layer of security to your account</p>
                        <button className="bg-foreground text-primary-foreground px-4 py-2 rounded-lg hover:bg-foreground/90 transition-colors">
                          Enable 2FA
                        </button>
                      </div>
                      
                      <div className="border border-destructive rounded-lg p-4">
                        <h4 className="font-medium text-destructive mb-2">Delete Account</h4>
                        <p className="text-muted-foreground text-sm mb-4">Permanently delete your account and all associated data</p>
                        <button className="bg-destructive text-destructive-foreground px-4 py-2 rounded-lg hover:bg-destructive/90 transition-colors">
                          Delete Account
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4">Notification Preferences</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div>
                          <h4 className="font-medium text-foreground">Email Notifications</h4>
                          <p className="text-muted-foreground text-sm">Receive notifications via email</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-foreground"></div>
                        </label>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div>
                          <h4 className="font-medium text-foreground">Call Alerts</h4>
                          <p className="text-muted-foreground text-sm">Get notified about incoming calls</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-foreground"></div>
                        </label>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div>
                          <h4 className="font-medium text-foreground">Daily Summaries</h4>
                          <p className="text-muted-foreground text-sm">Receive daily performance summaries</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" />
                          <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-foreground"></div>
                        </label>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div>
                          <h4 className="font-medium text-foreground">Marketing Updates</h4>
                          <p className="text-muted-foreground text-sm">Receive product updates and marketing emails</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" />
                          <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-foreground"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <button className="bg-foreground text-primary-foreground px-6 py-2 rounded-lg hover:bg-foreground/90 transition-colors">
                      Save Preferences
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;