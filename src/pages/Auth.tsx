import React, { useState, useEffect } from 'react';
import { LoginForm } from '@/components/LoginForm';
import { SignUpForm } from '@/components/auth/SignUpForm';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { hasCompletedOnboarding } from '@/lib/onboarding';

const UserRedirect = () => {
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const completed = await hasCompletedOnboarding();
        setOnboardingComplete(completed);
      } catch (error) {
        console.error('Error checking onboarding:', error);
        setOnboardingComplete(false);
      }
    };

    checkOnboarding();
  }, []);

  if (onboardingComplete === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Checking status...</p>
        </div>
      </div>
    );
  }

  if (onboardingComplete) {
    return <Navigate to="/dashboard" replace />;
  } else {
    return <Navigate to="/onboarding/business-intro" replace />;
  }
};

export const Auth: React.FC = () => {
  const [showSignUp, setShowSignUp] = useState(false);
  const { user, loading } = useAuth();

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

  // If user is logged in, redirect them based on onboarding status
  if (user) {
    return <UserRedirect />;
  }

  if (showSignUp) {
    return <SignUpForm onSuccess={() => setShowSignUp(false)} />;
  }

  return <LoginForm onSignUpClick={() => setShowSignUp(true)} />;
};

export default Auth;