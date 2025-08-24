import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user) return;

      try {
        console.log('Checking onboarding status for user:', user.id);
        const { data, error } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error checking onboarding status:', error);
          setOnboardingCompleted(false);
          return;
        }

        console.log('Onboarding status data:', data);
        const completed = data?.onboarding_completed || false;
        console.log('Setting onboardingCompleted to:', completed);
        setOnboardingCompleted(completed);
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        setOnboardingCompleted(false);
      }
    };

    if (user && !loading) {
      checkOnboardingStatus();
    }
  }, [user, loading]);

  if (loading || (user && onboardingCompleted === null)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // If user hasn't completed onboarding and is not already on an onboarding page
  if (!onboardingCompleted && !location.pathname.startsWith('/onboarding')) {
    console.log('Redirecting to onboarding - onboardingCompleted:', onboardingCompleted, 'pathname:', location.pathname);
    return <Navigate to="/onboarding/step1" replace />;
  }

  // If user has completed onboarding but is trying to access onboarding pages
  if (onboardingCompleted && location.pathname.startsWith('/onboarding')) {
    console.log('Redirecting to dashboard - onboardingCompleted:', onboardingCompleted, 'pathname:', location.pathname);
    return <Navigate to="/" replace />;
  }

  console.log('Rendering children - onboardingCompleted:', onboardingCompleted, 'pathname:', location.pathname);

  return <>{children}</>;
};