import type Stripe from "stripe";
import {
  checkoutSettlementPaidAtUnix,
  resolveCheckoutSessionSettlement,
  stripeSettlementPaymentSucceeded,
} from "@/lib/giving-stripe-checkout-settlement";
import type { MemberReconcileEventScope } from "@/lib/giving-stripe-reconcile-event-scope";
import {
  paymentIntentIdFromCheckoutSession,
  trustedWebhookQualifiesForPaidAt,
} from "@/lib/giving-stripe-webhook-settlement";

export type TrustedStripeWebhookSettlement = {
  paidAtUnix: number;
  eventType: string;
  eventId: string;
  checkoutSessionId?: string;
  paymentIntentId?: string;
};

export type CheckoutGiftPaidAtOptions = {
  trustedWebhookSettlement?: TrustedStripeWebhookSettlement;
  /** Finance recovery / historical tools — never fall back to webhook timestamps. */
  requireEventListSuccessDate?: boolean;
};

/**
 * Prefer Stripe Events.list success timestamp when listable; otherwise use the signed webhook
 * event time so live donations are not blocked by event retention or lookup limits.
 */
export async function resolveCheckoutGiftPaidAtUnix(
  stripe: Stripe,
  session: Pick<Stripe.Checkout.Session, "id" | "mode" | "payment_status" | "payment_intent">,
  eventScope: MemberReconcileEventScope,
  options?: CheckoutGiftPaidAtOptions,
): Promise<number | null> {
  if (session.mode !== "payment" || session.payment_status !== "paid") {
    return null;
  }

  const settlement = await resolveCheckoutSessionSettlement(stripe, session, eventScope);
  const fromEvents = checkoutSettlementPaidAtUnix(settlement);
  if (fromEvents) return fromEvents;

  if (options?.requireEventListSuccessDate) {
    return null;
  }

  const trusted = options?.trustedWebhookSettlement;
  if (!trusted?.paidAtUnix) return null;

  const settlementStatus = settlement.status;
  const paymentLooksSucceeded =
    stripeSettlementPaymentSucceeded(settlement) ||
    settlementStatus === "success_date_unknown" ||
    settlementStatus === "unknown";

  if (!paymentLooksSucceeded && session.payment_status !== "paid") {
    return null;
  }

  let paymentIntent: Stripe.PaymentIntent | null = null;
  const piId = paymentIntentIdFromCheckoutSession(session);
  if (piId) {
    try {
      paymentIntent = await stripe.paymentIntents.retrieve(piId);
    } catch {
      paymentIntent = null;
    }
  }

  if (!trustedWebhookQualifiesForPaidAt(trusted, session, paymentIntent)) {
    return null;
  }

  return trusted.paidAtUnix;
}
