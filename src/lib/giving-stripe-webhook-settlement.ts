import type Stripe from "stripe";
import type { TrustedStripeWebhookSettlement } from "@/lib/giving-stripe-checkout-paid-at";

const SYNC_CARD_COMPLETED = "checkout.session.completed";

export function paymentIntentIdFromCheckoutSession(
  session: Pick<Stripe.Checkout.Session, "payment_intent">,
): string | null {
  const ref = session.payment_intent;
  if (typeof ref === "string") return ref;
  return ref?.id ?? null;
}

export function isAchPaymentIntent(
  pi: Pick<Stripe.PaymentIntent, "payment_method_types"> | null | undefined,
) {
  return Boolean(pi?.payment_method_types?.includes("us_bank_account"));
}

export function isVerifiedCardPaymentIntent(
  pi: Pick<Stripe.PaymentIntent, "payment_method_types" | "status"> | null | undefined,
) {
  if (!pi || pi.status !== "succeeded") return false;
  if (isAchPaymentIntent(pi)) return false;
  return Boolean(pi.payment_method_types?.includes("card"));
}

/**
 * Only payment-success webhooks with object IDs matching the Checkout session may set givenOn
 * when Events.list is unavailable. Rejects delayed `checkout.session.completed` replays for ACH.
 */
export function trustedWebhookQualifiesForPaidAt(
  trusted: TrustedStripeWebhookSettlement,
  session: Pick<Stripe.Checkout.Session, "id" | "payment_intent" | "payment_status">,
  paymentIntent?: Pick<Stripe.PaymentIntent, "id" | "payment_method_types" | "status"> | null,
): boolean {
  if (!trusted.paidAtUnix || trusted.paidAtUnix <= 0) return false;

  const sessionPiId = paymentIntentIdFromCheckoutSession(session);

  if (trusted.eventType === "checkout.session.async_payment_succeeded") {
    if (!trusted.checkoutSessionId || trusted.checkoutSessionId !== session.id) return false;
    return session.payment_status === "paid";
  }

  if (trusted.eventType === "payment_intent.succeeded") {
    if (!trusted.paymentIntentId || !sessionPiId) return false;
    if (trusted.paymentIntentId !== sessionPiId) return false;
    if (!paymentIntent || paymentIntent.status !== "succeeded") return false;
    return true;
  }

  if (trusted.eventType === SYNC_CARD_COMPLETED) {
    if (session.payment_status !== "paid") return false;
    if (!trusted.checkoutSessionId || trusted.checkoutSessionId !== session.id) return false;
    if (!paymentIntent) return false;
    return isVerifiedCardPaymentIntent(paymentIntent);
  }

  return false;
}
