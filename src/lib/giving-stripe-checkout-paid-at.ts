import type Stripe from "stripe";
import {
  checkoutSettlementPaidAtUnix,
  resolveCheckoutSessionSettlement,
  stripeSettlementPaymentSucceeded,
} from "@/lib/giving-stripe-checkout-settlement";
import type { MemberReconcileEventScope } from "@/lib/giving-stripe-reconcile-event-scope";

export type TrustedStripeWebhookSettlement = {
  paidAtUnix: number;
  eventType: string;
  eventId: string;
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
  const settlementStatus = settlement.status;
  if (
    trusted?.paidAtUnix &&
    (stripeSettlementPaymentSucceeded(settlement) ||
      settlementStatus === "success_date_unknown" ||
      settlementStatus === "unknown")
  ) {
    return trusted.paidAtUnix;
  }

  return null;
}
