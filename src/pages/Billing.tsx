import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/shared/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface SubscriptionData {
  id: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  created_at: string;
  stripe_subscription_id: string;
}

interface PaymentHistoryItem {
  date: Date;
  status: "paid" | "upcoming";
  label: string;
}

export default function Billing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryItem[]>([]);
  const [openingPortal, setOpeningPortal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSubscription();
    }
  }, [user]);

  const fetchSubscription = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data) {
        setSubscription(data);
        calculatePaymentHistory(data);
      }
    } catch (error) {
      console.error("Error fetching subscription:", error);
      toast({
        title: "Error",
        description: "Failed to load subscription data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculatePaymentHistory = (sub: SubscriptionData) => {
    const history: PaymentHistoryItem[] = [];
    const now = new Date();
    
    // Get subscription start date
    const startDate = new Date(sub.created_at);
    const currentPeriodEnd = new Date(sub.current_period_end);
    
    // Calculate past payments (monthly intervals from start)
    let paymentDate = new Date(startDate);
    paymentDate.setMonth(paymentDate.getMonth() + 1); // First payment is 1 month after start
    
    while (paymentDate < now && paymentDate <= currentPeriodEnd) {
      history.push({
        date: new Date(paymentDate),
        status: "paid",
        label: formatDate(paymentDate),
      });
      paymentDate.setMonth(paymentDate.getMonth() + 1);
    }
    
    // Add current/upcoming payment
    if (currentPeriodEnd > now) {
      history.push({
        date: currentPeriodEnd,
        status: "upcoming",
        label: formatDate(currentPeriodEnd),
      });
    }
    
    // Sort by date (newest first)
    history.sort((a, b) => b.date.getTime() - a.date.getTime());
    
    setPaymentHistory(history);
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "long",
    }).format(date);
  };

  const handlePaymentMethod = async () => {
    if (!user) return;

    setOpeningPortal(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("No active session");
      }

      const response = await supabase.functions.invoke("create-portal-session", {
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
        throw new Error("No portal URL returned");
      }
    } catch (error: any) {
      console.error("Error opening payment portal:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to open payment portal. Please try again.",
        variant: "destructive",
      });
      setOpeningPortal(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!user || !subscription) return;

    // For now, redirect to Stripe Portal for cancellation
    // This is the recommended approach as it handles all edge cases
    await handlePaymentMethod();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-[72px]">
        <Header currentPage="profile" />
        <div className="flex items-center justify-center min-h-[calc(100vh-72px)]">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-[72px]">
      <Header currentPage="profile" />
      
      <main className="px-3 md:px-6 lg:px-12 py-6">
        {/* Header Section */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Billing</h1>
          <p className="text-muted-foreground">View your subscription for the app here</p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 mb-6">
          <Button
            variant="destructive"
            onClick={handleCancelSubscription}
            disabled={cancelling || !subscription || subscription.status !== "active"}
            className="bg-red-600 hover:bg-red-700"
          >
            {cancelling ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              "Cancel Subscription"
            )}
          </Button>
          <Button
            onClick={handlePaymentMethod}
            disabled={openingPortal || !subscription}
            className="bg-foreground text-background hover:bg-foreground/90"
          >
            {openingPortal ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Opening...
              </>
            ) : (
              "Payment Method"
            )}
          </Button>
        </div>

        {/* Subscription History */}
        {subscription ? (
          <div className="space-y-3">
            {paymentHistory.length > 0 ? (
              paymentHistory.map((item, index) => (
                <Card key={index} className="bg-card border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-medium">
                        {item.label}
                      </span>
                      <Badge
                        className={
                          item.status === "paid"
                            ? "bg-green-100 text-green-800 border-green-200"
                            : "bg-gray-100 text-gray-800 border-gray-200"
                        }
                      >
                        {item.status === "paid" ? "Paid" : "Upcoming"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="bg-card border">
                <CardContent className="p-4">
                  <p className="text-muted-foreground">No payment history available</p>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <Card className="bg-card border">
            <CardContent className="p-4">
              <p className="text-muted-foreground">No active subscription found</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

