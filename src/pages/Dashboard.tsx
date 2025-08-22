import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export const Dashboard: React.FC = () => {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold">Voicera AI</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">
                {user?.email}
              </span>
              <Button onClick={signOut} variant="outline">
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">Welcome to Voicera AI!</h2>
          <p className="text-muted-foreground mb-8">
            You have successfully signed in to your account.
          </p>
          
          <Card className="p-8 max-w-md mx-auto">
            <h3 className="text-xl font-semibold mb-4">Getting Started</h3>
            <p className="text-muted-foreground">
              Your authentication system is now fully set up with Supabase. 
              You can start building your AI features here.
            </p>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;