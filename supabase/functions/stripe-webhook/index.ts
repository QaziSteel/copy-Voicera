import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";
const OFFLINE_WEBHOOK_URL = "https://voiceraai.app.n8n.cloud/webhook/9053f9bc-bd58-44b6-b83e-17b2174446f6";

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

// Helper function to set all agents offline when subscription is cancelled
async function setAllAgentsOffline(userId: string, supabaseClient: any) {
  try {
    // Get all agents for this user (both project and personal agents)
    const { data: agents, error: agentsError } = await supabaseClient
      .from("onboarding_responses")
      .select("id, contact_number, assistant_id, purchased_number_details, current_status")
      .eq("user_id", userId)
      .eq("current_status", "live"); // Only get live agents

    if (agentsError) {
      console.error("Error fetching agents:", agentsError);
      return;
    }

    if (!agents || agents.length === 0) {
      console.log("No live agents found for user:", userId);
      return;
    }

    console.log(`Found ${agents.length} live agent(s) to set offline`);

    // Call offline webhook for each agent and update database
    const offlinePromises = agents.map(async (agent: any) => {
      // Extract external ID from purchased_number_details
      let externalId = null;
      if (agent.purchased_number_details && typeof agent.purchased_number_details === 'object') {
        externalId = agent.purchased_number_details.id || null;
      }

      if (!agent.contact_number || !agent.assistant_id || !externalId) {
        console.warn(`Skipping agent ${agent.id} - missing required fields`);
        return;
      }

      // Call offline webhook
      try {
        const webhookResponse = await fetch(OFFLINE_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phone_number: agent.contact_number,
            assistant_id: agent.assistant_id,
            status: 'Offline',
            id: externalId
          })
        });

        if (!webhookResponse.ok) {
          console.error(`Webhook failed for agent ${agent.id}:`, webhookResponse.status);
        } else {
          console.log(`Offline webhook called successfully for agent ${agent.id}`);
        }
      } catch (webhookError) {
        console.error(`Error calling offline webhook for agent ${agent.id}:`, webhookError);
      }

      // Update database status to offline
      const { error: updateError } = await supabaseClient
        .from("onboarding_responses")
        .update({ current_status: "offline" })
        .eq("id", agent.id);

      if (updateError) {
        console.error(`Error updating agent ${agent.id} status:`, updateError);
      } else {
        console.log(`Agent ${agent.id} status updated to offline`);
      }
    });

    await Promise.all(offlinePromises);
    console.log(`All agents set offline for user: ${userId}`);
  } catch (error) {
    console.error("Error setting agents offline:", error);
  }
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

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        console.log("Processing invoice.payment_succeeded", {
          invoiceId: invoice.id,
          customerId,
          subscriptionId: invoice.subscription,
          amount: invoice.amount_paid,
          status: invoice.status,
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
          // Upsert invoice record
          const { data, error: upsertError } = await supabaseClient
            .from("invoices")
            .upsert(
              {
                user_id: existingSub.user_id,
                stripe_invoice_id: invoice.id,
                stripe_subscription_id: invoice.subscription as string | null,
                stripe_customer_id: customerId,
                amount: invoice.amount_paid,
                currency: invoice.currency,
                status: invoice.status,
                paid_at: stripeTimestampToISO(invoice.status_transitions?.paid_at),
                invoice_pdf_url: invoice.invoice_pdf,
                hosted_invoice_url: invoice.hosted_invoice_url,
                period_start: stripeTimestampToISO(invoice.period_start),
                period_end: stripeTimestampToISO(invoice.period_end),
              },
              {
                onConflict: "stripe_invoice_id",
              }
            )
            .select();

          if (upsertError) {
            console.error("Error upserting invoice:", upsertError);
            throw upsertError;
          }

          console.log("Successfully upserted invoice:", data);
        } else {
          console.warn("No subscription found for customer:", customerId);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        console.log("Processing invoice.payment_failed", {
          invoiceId: invoice.id,
          customerId,
          subscriptionId: invoice.subscription,
        });

        // Find user by customer ID
        const { data: existingSub } = await supabaseClient
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();

        if (existingSub) {
          // Update invoice status to failed
          await supabaseClient
            .from("invoices")
            .upsert(
              {
                user_id: existingSub.user_id,
                stripe_invoice_id: invoice.id,
                stripe_subscription_id: invoice.subscription as string | null,
                stripe_customer_id: customerId,
                amount: invoice.amount_due,
                currency: invoice.currency,
                status: invoice.status,
                paid_at: null,
                invoice_pdf_url: invoice.invoice_pdf,
                hosted_invoice_url: invoice.hosted_invoice_url,
                period_start: stripeTimestampToISO(invoice.period_start),
                period_end: stripeTimestampToISO(invoice.period_end),
              },
              {
                onConflict: "stripe_invoice_id",
              }
            );
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
          itemsPeriodStart: subscription.items.data[0]?.current_period_start,
          itemsPeriodEnd: subscription.items.data[0]?.current_period_end,
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
          // Get period dates from subscription object or fallback to items
          const periodStart = subscription.current_period_start ?? 
                             subscription.items.data[0]?.current_period_start ?? 
                             null;
          const periodEnd = subscription.current_period_end ?? 
                           subscription.items.data[0]?.current_period_end ?? 
                           null;

          const { data, error: upsertError } = await supabaseClient
            .from("subscriptions")
            .upsert(
              {
                user_id: existingSub.user_id,
                stripe_customer_id: customerId,
                stripe_subscription_id: subscription.id,
                stripe_price_id: subscription.items.data[0]?.price.id,
                status: subscription.status,
                current_period_start: stripeTimestampToISO(periodStart),
                current_period_end: stripeTimestampToISO(periodEnd),
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

          // Check if subscription was actually cancelled (not just scheduled for cancellation)
          // When user cancels, cancel_at_period_end = true but status stays "active" until period ends
          // Stripe will send another webhook when period ends with status = "canceled"
          const isActuallyCancelled = subscription.status === "canceled" || 
                                     (event.type === "customer.subscription.deleted");
          
          // Check if payment failed (all retries exhausted)
          const isPaymentFailed = subscription.status === "unpaid" || 
                                 subscription.status === "incomplete_expired";
          
          // Set agents offline when subscription is cancelled OR payment failed
          // NOT when cancel_at_period_end = true (subscription still active until period ends)
          if (isActuallyCancelled || isPaymentFailed) {
            const reason = isActuallyCancelled ? "cancelled and period ended" : "payment failed";
            console.log(`Subscription ${reason} - setting all agents offline`);
            await setAllAgentsOffline(existingSub.user_id, supabaseClient);
          }
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

