import type Stripe from "stripe";
import { recordGiftFromCheckoutSession } from "@/lib/giving-checkout-server";
import { checkoutSessionHasCorroboratedMemberIdentity } from "@/lib/giving-stripe-checkout-ownership";
import { isShanahGivingCheckoutSession } from "@/lib/giving-stripe-eligibility";
import { listCheckoutSessionsForPaymentIntent } from "@/lib/giving-stripe-checkout-session-lookup";
import { isPaidCheckoutSession } from "@/lib/giving-reconcile-server";
import type { TrustedStripeWebhookSettlement } from "@/lib/giving-stripe-checkout-paid-at";
import type { MemberReconcileEventScope } from "@/lib/giving-stripe-reconcile-event-scope";
import type { RecordGiftFromCheckoutSessionOptions } from "@/lib/giving-checkout-server";

/**
 * Checkout-mode one-time gifts: record via Session metadata (PI metadata is often empty).
 * Idempotent on stripeSessionId unique index. Requires corroborated member identity on Session.
 */
export async function recordGiftFromPaymentIntentSucceeded(
  stripe: Stripe,
  paymentIntent: Pick<Stripe.PaymentIntent, "id" | "status">,
  options?: RecordGiftFromCheckoutSessionOptions & {
    trustedWebhookSettlement?: TrustedStripeWebhookSettlement;
  },
) {
  if (paymentIntent.status !== "succeeded") return null;

  const sessions = await listCheckoutSessionsForPaymentIntent(stripe, paymentIntent.id);
  if (sessions.length === 0) return null;

  let recorded: Awaited<ReturnType<typeof recordGiftFromCheckoutSession>> = null;
  for (const row of sessions) {
    const session = await stripe.checkout.sessions.retrieve(row.id, {
      expand: ["line_items.data.price.product"],
    });
    if (!isPaidCheckoutSession(session)) continue;
    if (!isShanahGivingCheckoutSession(session)) continue;
    if (!checkoutSessionHasCorroboratedMemberIdentity(session)) continue;
    const gift = await recordGiftFromCheckoutSession(session, {
      ...options,
      trustedWebhookSettlement: options?.trustedWebhookSettlement,
    });
    if (gift) recorded = gift;
  }
  return recorded;
}
