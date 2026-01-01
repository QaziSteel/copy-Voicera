import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";

// Helper function to safely convert Stripe timestamp to ISO string
function stripeTimestampToISO(timestamp: number | null | undefined): string | null {
  if (timestamp == null) {
    return null;
  }
  const date = new Date(timestamp * 1000);
  if (isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
}

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return new Response("No signature", { status: 400 });
  }

  try {
    const body = await req.text();

    // Verify webhook signature - USE ASYNC VERSION FOR DENO
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret
    );

    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get("SUP_URL") ?? Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUP_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    
    const supabaseClient = createClient(
      supabaseUrl,
      supabaseServiceKey
    );

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;

        console.log("Processing checkout.session.completed", {
          userId,
          subscriptionId: session.subscription,
          customerId: session.customer,
        });

        if (userId && session.subscription) {
          // Fetch full subscription details
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );

          console.log("Retrieved subscription from Stripe:", {
            subscriptionId: subscription.id,
            status: subscription.status,
            priceId: subscription.items.data[0]?.price.id,
            periodStart: subscription.current_period_start,
            periodEnd: subscription.current_period_end,
          });

          // Update or insert subscription record
          const { data, error } = await supabaseClient
            .from("subscriptions")
            .upsert(
              {
                user_id: userId,
                stripe_customer_id: session.customer as string,
                stripe_subscription_id: subscription.id,
                stripe_price_id: subscription.items.data[0]?.price.id,
                status: subscription.status,
                current_period_start: stripeTimestampToISO(subscription.current_period_start),
                current_period_end: stripeTimestampToISO(subscription.current_period_end),
                cancel_at_period_end: subscription.cancel_at_period_end,
              },
              {
                onConflict: "user_id",
              }
            )
            .select();

          if (error) {
            console.error("Error upserting subscription:", error);
            throw error;
          }

          console.log("Successfully upserted subscription:", data);
        } else {
          console.warn("Missing userId or subscription in session:", {
            userId,
            hasSubscription: !!session.subscription,
          });
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        console.log("Processing subscription update/deleted:", {
          subscriptionId: subscription.id,
          customerId,
          status: subscription.status,
          periodStart: subscription.current_period_start,
          periodEnd: subscription.current_period_end,
        });

        // Find user by customer ID
        const { data: existingSub, error: findError } = await supabaseClient
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();

        if (findError) {
          console.error("Error finding subscription by customer ID:", findError);
          throw findError;
        }

        if (existingSub) {
          const { data, error: upsertError } = await supabaseClient
            .from("subscriptions")
            .upsert(
              {
                user_id: existingSub.user_id,
                stripe_customer_id: customerId,
                stripe_subscription_id: subscription.id,
                stripe_price_id: subscription.items.data[0]?.price.id,
                status: subscription.status,
                current_period_start: stripeTimestampToISO(subscription.current_period_start),
                current_period_end: stripeTimestampToISO(subscription.current_period_end),
                cancel_at_period_end: subscription.cancel_at_period_end,
              },
              {
                onConflict: "user_id",
              }
            )
            .select();

          if (upsertError) {
            console.error("Error upserting subscription:", upsertError);
            throw upsertError;
          }

          console.log("Successfully updated subscription:", data);
        } else {
          console.warn("No existing subscription found for customer:", customerId);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Webhook processing failed",
      }),
      { status: 400 }
    );
  }
});

