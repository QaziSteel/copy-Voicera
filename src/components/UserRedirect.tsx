import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { hasCompletedOnboarding } from "@/lib/onboarding";
import { supabase } from "@/integrations/supabase/client";

export const UserRedirect = () => {
  const { user } = useAuth();
  const [subscriptionActive, setSubscriptionActive] = useState<boolean | null>(null);
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);
  const [isOwner, setIsOwner] = useState<boolean | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      if (!user) return;

      try {
        const { data: projectMembers } = await supabase
          .from("project_members")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "owner")
          .limit(1);

        const userIsOwner = projectMembers && projectMembers.length > 0;
        setIsOwner(userIsOwner);
        console.log("[UserRedirect] isOwner:", userIsOwner);

        if (userIsOwner) {
          const { data: subscription } = await supabase
            .from("subscriptions")
            .select("status, current_period_end")
            .eq("user_id", user.id)
            .maybeSingle();

          const hasActiveSubscription =
            subscription?.status === "active" &&
            subscription.status !== "unpaid" &&
            subscription.status !== "past_due" &&
            subscription.status !== "incomplete_expired" &&
            (!subscription.current_period_end ||
              new Date(subscription.current_period_end) > new Date());

          console.log("[UserRedirect] subscription active:", hasActiveSubscription);
          setSubscriptionActive(hasActiveSubscription);

          if (hasActiveSubscription) {
            const completed = await hasCompletedOnboarding(undefined, user.id);
            console.log("[UserRedirect] onboarding completed:", completed);
            setOnboardingComplete(completed);
          } else {
            setOnboardingComplete(null);
          }
        } else {
          console.log("[UserRedirect] Not owner, skipping subscription check");
          setSubscriptionActive(true);
          const completed = await hasCompletedOnboarding(undefined, user.id);
          console.log("[UserRedirect] onboarding completed:", completed);
          setOnboardingComplete(completed);
        }
      } catch (error) {
        console.error("[UserRedirect] Error checking status:", error);
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

  if (isOwner && subscriptionActive === false) {
    console.log("[UserRedirect] Owner without subscription → /subscription");
    return <Navigate to="/subscription" replace />;
  }

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
    console.log("[UserRedirect] → /dashboard");
    return <Navigate to="/dashboard" replace />;
  }

  console.log("[UserRedirect] → /onboarding/business-intro");
  return <Navigate to="/onboarding/business-intro" replace />;
};
