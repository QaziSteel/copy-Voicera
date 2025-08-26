import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const AgentManagement: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

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
              <button
                onClick={() => navigate("/profile")}
                className="w-12 h-12 bg-muted rounded-full flex items-center justify-center hover:bg-accent transition-colors"
                title="Profile"
              >
                <span className="text-lg font-semibold text-foreground">
                  {user?.email?.[0]?.toUpperCase() || "U"}
                </span>
              </button>
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
          <div className="text-center mb-8">
            <h2 className="text-3xl font-semibold text-foreground mb-2">
              Agent Management
            </h2>
            <p className="text-xl text-muted-foreground">
              Monitor and control your AI agent
            </p>
          </div>

          <div className="bg-card rounded-2xl p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <div>
                  <h3 className="text-2xl font-semibold text-foreground">Agent Status: Live</h3>
                  <p className="text-muted-foreground">Your AI agent is currently active and taking calls</p>
                </div>
              </div>
              
              <button className="bg-destructive text-destructive-foreground px-6 py-3 rounded-lg font-semibold hover:bg-destructive/90 transition-colors">
                Stop Agent
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-muted rounded-xl p-6 text-center">
                <h4 className="text-lg font-semibold text-foreground mb-2">Calls Today</h4>
                <p className="text-3xl font-bold text-foreground">8</p>
              </div>
              
              <div className="bg-muted rounded-xl p-6 text-center">
                <h4 className="text-lg font-semibold text-foreground mb-2">Success Rate</h4>
                <p className="text-3xl font-bold text-green-500">75%</p>
              </div>
              
              <div className="bg-muted rounded-xl p-6 text-center">
                <h4 className="text-lg font-semibold text-foreground mb-2">Avg Response</h4>
                <p className="text-3xl font-bold text-foreground">1.2s</p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-xl font-semibold text-foreground">Quick Actions</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button className="bg-foreground text-primary-foreground p-4 rounded-xl text-left hover:bg-foreground/90 transition-colors">
                  <h5 className="font-semibold mb-2">Test Agent</h5>
                  <p className="text-sm opacity-90">Make a test call to verify agent responses</p>
                </button>
                
                <button className="bg-accent text-accent-foreground p-4 rounded-xl text-left hover:bg-accent/80 transition-colors">
                  <h5 className="font-semibold mb-2">Update Training</h5>
                  <p className="text-sm opacity-90">Modify agent knowledge and responses</p>
                </button>
                
                <button className="bg-secondary text-secondary-foreground p-4 rounded-xl text-left hover:bg-secondary/80 transition-colors">
                  <h5 className="font-semibold mb-2">View Analytics</h5>
                  <p className="text-sm opacity-90">Detailed performance metrics and insights</p>
                </button>
                
                <button className="bg-muted text-foreground p-4 rounded-xl text-left hover:bg-muted/80 transition-colors">
                  <h5 className="font-semibold mb-2">Agent Settings</h5>
                  <p className="text-sm opacity-90">Configure voice, personality, and behavior</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AgentManagement;