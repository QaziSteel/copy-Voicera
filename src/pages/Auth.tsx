import React, { useState } from 'react';
import { LoginForm } from '@/components/LoginForm';
import { SignUpForm } from '@/components/auth/SignUpForm';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

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

  if (user) {
    return <Navigate to="/" replace />;
  }

  if (showSignUp) {
    return <SignUpForm onSuccess={() => setShowSignUp(false)} />;
  }

  return <LoginForm onSignUpClick={() => setShowSignUp(true)} />;
};

export default Auth;