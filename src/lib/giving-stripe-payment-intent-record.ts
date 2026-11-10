import type Stripe from "stripe";
import { recordGiftFromCheckoutSession } from "@/lib/giving-checkout-server";
import { listCheckoutSessionsForPaymentIntent } from "@/lib/giving-stripe-checkout-session-lookup";
import type { MemberReconcileEventScope } from "@/lib/giving-stripe-reconcile-event-scope";

/**
 * Checkout-mode one-time gifts: record via Session metadata (PI metadata is often empty).
 * Idempotent on stripeSessionId unique index.
 */
export async function recordGiftFromPaymentIntentSucceeded(
  stripe: Stripe,
  paymentIntent: Pick<Stripe.PaymentIntent, "id" | "status">,
  options?: { eventScope?: MemberReconcileEventScope },
) {
  if (paymentIntent.status !== "succeeded") return null;

  const sessions = await listCheckoutSessionsForPaymentIntent(stripe, paymentIntent.id);
  if (sessions.length === 0) return null;

  let recorded: Awaited<ReturnType<typeof recordGiftFromCheckoutSession>> = null;
  for (const row of sessions) {
    const session = await stripe.checkout.sessions.retrieve(row.id);
    const gift = await recordGiftFromCheckoutSession(session, options);
    if (gift) recorded = gift;
  }
  return recorded;
}
