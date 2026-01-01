import React, { useState, useEffect } from 'react';
import { LoginForm } from '@/components/LoginForm';
import { SignUpForm } from '@/components/auth/SignUpForm';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { hasCompletedOnboarding } from '@/lib/onboarding';
import { supabase } from '@/integrations/supabase/client';

const UserRedirect = () => {
  const { user } = useAuth();
  const [subscriptionActive, setSubscriptionActive] = useState<boolean | null>(null);
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);
  const [isOwner, setIsOwner] = useState<boolean | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      if (!user) return;

      try {
        // First check if user is a project owner (check if they have owner role in any project)
        const { data: projectMembers, error: roleError } = await supabase
          .from("project_members")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "owner")
          .limit(1);

        const userIsOwner = projectMembers && projectMembers.length > 0;
        setIsOwner(userIsOwner);

        // Only check subscription if user is owner
        if (userIsOwner) {
          console.log('UserRedirect: User is owner, checking subscription status...');
          const { data: subscription } = await supabase
            .from("subscriptions")
            .select("status, current_period_end")
            .eq("user_id", user.id)
            .maybeSingle();

          const hasActiveSubscription = subscription?.status === "active" && 
            subscription.status !== "unpaid" &&
            subscription.status !== "past_due" &&
            subscription.status !== "incomplete_expired" &&
            (!subscription.current_period_end || new Date(subscription.current_period_end) > new Date());
          
          console.log('UserRedirect: Subscription active:', hasActiveSubscription);
          setSubscriptionActive(hasActiveSubscription);

          // Only check onboarding if subscription is active
          if (hasActiveSubscription) {
            console.log('UserRedirect: Checking onboarding status...');
            const completed = await hasCompletedOnboarding();
            console.log('UserRedirect: Onboarding completed:', completed);
            setOnboardingComplete(completed);
          } else {
            setOnboardingComplete(null);
          }
        } else {
          // Not an owner, skip subscription check and go to onboarding/dashboard
          console.log('UserRedirect: User is not owner, skipping subscription check');
          setSubscriptionActive(true); // Treat as "active" to skip paywall
          const completed = await hasCompletedOnboarding();
          setOnboardingComplete(completed);
        }
      } catch (error) {
        console.error('UserRedirect: Error checking status:', error);
        setIsOwner(false);
        setSubscriptionActive(false);
      }
    };

    checkStatus();
  }, [user]);

  if (isOwner === null || (isOwner && subscriptionActive === null)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Checking status...</p>
        </div>
      </div>
    );
  }

  // If owner and no active subscription, redirect to paywall
  if (isOwner && subscriptionActive === false) {
    console.log('UserRedirect: Owner with no subscription, redirecting to subscription');
    return <Navigate to="/subscription" replace />;
  }

  // If subscription active (or not owner), check onboarding
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
    console.log('UserRedirect: Redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  } else {
    console.log('UserRedirect: Redirecting to onboarding');
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
    return <SignUpForm onSuccess={() => setShowSignUp(false)} onLoginClick={() => setShowSignUp(false)} />;
  }

  return <LoginForm onSignUpClick={() => setShowSignUp(true)} />;
};

export default Auth;