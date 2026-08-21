import { NextResponse } from "next/server";
import type Stripe from "stripe";
import {
  recordGiftFromCheckoutSession,
  recordGiftFromInvoice,
} from "@/lib/giving-checkout-server";
import { getStripe, getStripeWebhookSecret } from "@/lib/stripe-server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const webhookSecret = getStripeWebhookSecret();
  if (!webhookSecret) {
    return NextResponse.json({ error: "Stripe webhook is not configured." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid webhook signature." },
      { status: 400 },
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const fullSession = await getStripe().checkout.sessions.retrieve(session.id);
        const record = await recordGiftFromCheckoutSession(fullSession);
        if (!record) {
          console.warn("Stripe checkout completed but gift was not recorded.", {
            sessionId: session.id,
            mode: fullSession.mode,
            paymentStatus: fullSession.payment_status,
          });
        }
        break;
      }
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        let extraMetadata: Record<string, string> = {};

        const subscriptionRef = invoice.parent?.subscription_details?.subscription;
        const subscriptionId = typeof subscriptionRef === "string" ? subscriptionRef : undefined;

        if (subscriptionId) {
          const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
          extraMetadata = subscription.metadata ?? {};
        }

        await recordGiftFromInvoice(invoice, extraMetadata);
        break;
      }
      default:
        break;
    }
  } catch (error) {
    console.error("Stripe giving webhook failed:", error);
    return NextResponse.json({ error: "Webhook handler failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
