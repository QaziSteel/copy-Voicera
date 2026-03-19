import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export const UserRedirect = () => {
  const { user } = useAuth();
  const [destination, setDestination] = useState<string | null>(null);

  useEffect(() => {
    const resolve = async () => {
      console.log("=== [UserRedirect] START ===");
      console.log("[UserRedirect] user from useAuth():", user ? { id: user.id, email: user.email } : null);

      if (!user) {
        console.log("[UserRedirect] No user, aborting");
        return;
      }

      try {
        // 1) Check Supabase session
        const { data: sessionData } = await supabase.auth.getSession();
        console.log("[UserRedirect] Supabase session:", sessionData?.session ? "EXISTS" : "NULL", "user_id:", sessionData?.session?.user?.id ?? "N/A");

        // 2) Query project_members
        const { data: memberships, error: memberErr } = await supabase
          .from("project_members")
          .select("id, role, project_id")
          .eq("user_id", user.id);

        console.log("[UserRedirect] project_members query result:", JSON.stringify({ data: memberships, error: memberErr }));

        const hasMembership = memberships && memberships.length > 0;
        const isOwner = memberships?.some((m) => m.role === "owner") ?? false;
        console.log("[UserRedirect] hasMembership:", hasMembership, "isOwner:", isOwner);

        // 3) Subscription check (owner only)
        if (isOwner) {
          const { data: subscription, error: subErr } = await supabase
            .from("subscriptions")
            .select("status, current_period_end")
            .eq("user_id", user.id)
            .maybeSingle();

          console.log("[UserRedirect] subscription query result:", JSON.stringify({ data: subscription, error: subErr }));

          const hasActiveSub =
            subscription?.status === "active" &&
            subscription.status !== "unpaid" &&
            subscription.status !== "past_due" &&
            subscription.status !== "incomplete_expired" &&
            (!subscription.current_period_end ||
              new Date(subscription.current_period_end) > new Date());

          console.log("[UserRedirect] hasActiveSub:", hasActiveSub);

          if (!hasActiveSub) {
            console.log("[UserRedirect] DECISION → /subscription (owner, no active sub)");
            setDestination("/subscription");
            return;
          }
        }

        // 4) Query onboarding_responses
        const { data: onboardingRow, error: onbErr } = await supabase
          .from("onboarding_responses")
          .select("id")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle();

        console.log("[UserRedirect] onboarding_responses query result:", JSON.stringify({ data: onboardingRow, error: onbErr }));

        const hasOnboarding = !!onboardingRow;

        // 5) Final decision
        if (hasOnboarding || hasMembership) {
          console.log("[UserRedirect] DECISION → /dashboard (hasOnboarding:", hasOnboarding, "hasMembership:", hasMembership, ")");
          setDestination("/dashboard");
        } else {
          console.log("[UserRedirect] DECISION → /onboarding/business-intro (hasOnboarding:", hasOnboarding, "hasMembership:", hasMembership, ")");
          setDestination("/onboarding/business-intro");
        }
      } catch (error) {
        console.error("[UserRedirect] CAUGHT ERROR, defaulting to /dashboard:", error);
        setDestination("/dashboard");
      }

      console.log("=== [UserRedirect] END ===");
    };

    resolve();
  }, [user]);

  console.log("[UserRedirect] render — destination:", destination);

  if (!destination) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Checking status...</p>
        </div>
      </div>
    );
  }

  return <Navigate to={destination} replace />;
};
