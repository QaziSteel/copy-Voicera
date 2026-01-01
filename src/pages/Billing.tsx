import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/shared/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface SubscriptionData {
  id: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  created_at: string;
  stripe_subscription_id: string;
}

interface Invoice {
  id: string;
  stripe_invoice_id: string;
  amount: number;
  currency: string;
  status: string;
  paid_at: string | null;
  invoice_pdf_url: string | null;
  hosted_invoice_url: string | null;
  period_start: string | null;
  period_end: string | null;
  created_at: string;
}

export default function Billing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [openingPortal, setOpeningPortal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSubscription();
      fetchInvoices();
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

  const fetchInvoices = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("user_id", user.id)
        .order("paid_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      setInvoices(data || []);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      toast({
        title: "Error",
        description: "Failed to load payment history",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number, currency: string = "gbp"): string => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return "N/A";
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(dateString));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            Paid
          </Badge>
        );
      case "open":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            Pending
          </Badge>
        );
      case "void":
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200">
            Void
          </Badge>
        );
      case "uncollectible":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            Failed
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200">
            {status}
          </Badge>
        );
    }
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
          <p className="text-muted-foreground">View your subscription and payment history</p>
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

        {/* Payment History */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Payment History</h2>
          {invoices.length > 0 ? (
            <div className="space-y-3">
              {invoices.map((invoice) => (
                <Card key={invoice.id} className="bg-card border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-lg font-semibold">
                            {formatCurrency(invoice.amount, invoice.currency)}
                          </span>
                          {getStatusBadge(invoice.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {invoice.paid_at ? formatDate(invoice.paid_at) : formatDate(invoice.created_at)}
                        </p>
                        {invoice.period_start && invoice.period_end && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Period: {formatDate(invoice.period_start)} - {formatDate(invoice.period_end)}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {invoice.hosted_invoice_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(invoice.hosted_invoice_url!, "_blank")}
                            className="flex items-center gap-2"
                          >
                            <ExternalLink className="w-4 h-4" />
                            View Invoice
                          </Button>
                        )}
                        {invoice.invoice_pdf_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(invoice.invoice_pdf_url!, "_blank")}
                            className="flex items-center gap-2"
                          >
                            <ExternalLink className="w-4 h-4" />
                            PDF
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-card border">
              <CardContent className="p-4">
                <p className="text-muted-foreground">No payment history available</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}

