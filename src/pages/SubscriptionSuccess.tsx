import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export default function SubscriptionSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    if (sessionId && user) {
      // Wait a moment for webhook to process, then check subscription
      setTimeout(() => {
        checkSubscriptionAndRedirect();
      }, 2000);
    } else {
      navigate("/subscription");
    }
  }, [sessionId, user]);

  const checkSubscriptionAndRedirect = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from("subscriptions")
        .select("status")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data?.status === "active") {
        navigate("/onboarding/business-intro");
      } else {
        // If subscription not active yet, wait a bit more
        setTimeout(() => {
          navigate("/onboarding/business-intro");
        }, 3000);
      }
    } catch (error) {
      console.error("Error checking subscription:", error);
      navigate("/onboarding/business-intro");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
        <p>Processing your subscription...</p>
      </div>
    </div>
  );
}

