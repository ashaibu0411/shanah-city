import { NextResponse } from "next/server";
import type Stripe from "stripe";
import {
  recordGiftFromCheckoutSession,
  recordGiftFromInvoice,
} from "@/lib/giving-checkout-server";
import { linkStripeCustomerFromCheckoutSession } from "@/lib/giving-billing-server";
import { resolveStripeInvoiceSubscriptionId } from "@/lib/giving-stripe-invoice";
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
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        const fullSession = await getStripe().checkout.sessions.retrieve(session.id);
        await linkStripeCustomerFromCheckoutSession(fullSession);
        const record = await recordGiftFromCheckoutSession(fullSession);
        if (!record) {
          console.warn("Stripe checkout completed but gift was not recorded.", {
            sessionId: session.id,
            mode: fullSession.mode,
            paymentStatus: fullSession.payment_status,
            eventType: event.type,
          });
        }
        break;
      }
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        let extraMetadata: Record<string, string> = { ...(invoice.metadata ?? {}) };

        const subscriptionId = resolveStripeInvoiceSubscriptionId(invoice);
        if (subscriptionId) {
          const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
          extraMetadata = { ...subscription.metadata, ...extraMetadata };
        }

        const record = await recordGiftFromInvoice(invoice, extraMetadata);
        if (!record) {
          console.warn("Stripe invoice paid but gift was not recorded.", {
            invoiceId: invoice.id,
            status: invoice.status,
            subscriptionId,
            billingReason: invoice.billing_reason,
          });
        }
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
