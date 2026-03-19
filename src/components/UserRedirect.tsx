import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export const UserRedirect = () => {
  const { user } = useAuth();
  const [destination, setDestination] = useState<string | null>(null);

  useEffect(() => {
    const resolve = async () => {
      if (!user) return;

      try {
        const { data: memberships, error: memberErr } = await supabase
          .from("project_members")
          .select("id, role, project_id")
          .eq("user_id", user.id);

        if (memberErr) {
          console.error("[UserRedirect] project_members query error:", memberErr);
        }

        const hasMembership = memberships && memberships.length > 0;
        const isOwner = memberships?.some((m) => m.role === "owner") ?? false;

        if (isOwner) {
          const { data: subscription } = await supabase
            .from("subscriptions")
            .select("status, current_period_end")
            .eq("user_id", user.id)
            .maybeSingle();

          const hasActiveSub =
            (subscription?.status === "active" || subscription?.status === "trialing") &&
            (!subscription?.current_period_end ||
              new Date(subscription.current_period_end) > new Date());

          if (!hasActiveSub) {
            setDestination("/subscription");
            return;
          }
        }

        const { data: onboardingRow, error: onbErr } = await supabase
          .from("onboarding_responses")
          .select("id")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle();

        if (onbErr) {
          console.error("[UserRedirect] onboarding_responses query error:", onbErr);
        }

        if (!!onboardingRow || hasMembership) {
          setDestination("/dashboard");
        } else {
          setDestination("/onboarding/business-intro");
        }
      } catch (error) {
        console.error("[UserRedirect] Unexpected error, defaulting to dashboard:", error);
        setDestination("/dashboard");
      }
    };

    resolve();
  }, [user]);

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
