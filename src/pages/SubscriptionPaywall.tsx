import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Rocket, ArrowRight } from "lucide-react";

export default function SubscriptionPaywall() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [checkingSubscription, setCheckingSubscription] = useState(true);

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  const checkSubscriptionStatus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("status, current_period_end")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data && data.status === "active") {
        // User has active subscription, redirect to onboarding
        navigate("/onboarding/business-intro");
        return;
      }
    } catch (error) {
      console.error("Error checking subscription:", error);
    } finally {
      setCheckingSubscription(false);
    }
  };

  const handleSubscribe = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "Please sign in to continue",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("No active session");
      }

      const response = await supabase.functions.invoke("create-checkout-session", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw response.error;
      }

      const { url } = response.data;
      
      if (url) {
        window.location.href = url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error: any) {
      console.error("Error creating checkout session:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to start checkout. Please try again.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  if (checkingSubscription) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted flex flex-col">
      {/* Header */}
      <div className="w-full flex justify-between items-center px-8 py-6">
        <div className="flex-1"></div>
        <div className="flex-1 flex justify-center">
          <h1 className="text-2xl font-bold">Voicera AI</h1>
        </div>
        <div className="flex-1 flex justify-end">
          <Button
            variant="outline"
            onClick={handleLogout}
            className="bg-muted text-muted-foreground rounded-xl flex items-center gap-2"
          >
            <ArrowRight className="w-4 h-4" />
            <span>Logout</span>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-8 pb-8">
        <Card className="w-full max-w-md bg-card border-2 border-border rounded-3xl p-8">
          <CardContent className="flex flex-col items-center space-y-6">
            {/* Rocket Icon */}
            <div className="w-16 h-16 rounded-full bg-muted border-2 border-border flex items-center justify-center">
              <Rocket className="w-8 h-8 text-foreground" />
            </div>

            {/* Price */}
            <div className="text-center">
              <p className="text-5xl font-bold">£149/month</p>
            </div>

            {/* Pay Now Button */}
            <Button
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full bg-foreground text-background hover:bg-foreground/90 rounded-xl h-12 text-base font-medium"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Pay now <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

