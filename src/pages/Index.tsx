import { useAuth } from "@/contexts/AuthContext";
import { LoginForm } from "@/components/LoginForm";
import { Navigate } from "react-router-dom";
import { hasCompletedOnboarding } from "@/lib/onboarding";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const { user, loading } = useAuth();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (user && !redirecting) {
      setRedirecting(true);
    }
  }, [user, redirecting]);

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
    <>
      {user ? <UserRedirect /> : <LoginForm />}
    </>
  );
};

const UserRedirect = () => {
  const { user } = useAuth();
  const [subscriptionActive, setSubscriptionActive] = useState<boolean | null>(null);
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      if (!user) return;

      try {
        // First check subscription
        const { data: subscription } = await supabase
          .from("subscriptions")
          .select("status, current_period_end")
          .eq("user_id", user.id)
          .maybeSingle();

        const hasActiveSubscription = subscription?.status === "active" && 
          (!subscription.current_period_end || new Date(subscription.current_period_end) > new Date());
        
        setSubscriptionActive(hasActiveSubscription);

        // Only check onboarding if subscription is active
        if (hasActiveSubscription) {
          const completed = await hasCompletedOnboarding();
          setOnboardingComplete(completed);
        }
      } catch (error) {
        console.error('Error checking status:', error);
        setSubscriptionActive(false);
      }
    };

    checkStatus();
  }, [user]);

  if (subscriptionActive === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Checking status...</p>
        </div>
      </div>
    );
  }

  // If no active subscription, redirect to paywall
  if (subscriptionActive === false) {
    return <Navigate to="/subscription" replace />;
  }

  // If subscription active, check onboarding
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

export default Index;
