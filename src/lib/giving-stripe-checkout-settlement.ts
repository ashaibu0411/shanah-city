import type Stripe from "stripe";

export type StripeSettlementResolution =
  | { status: "verified"; paidAtUnix: number; source: "charge" }
  | { status: "unknown"; reason: string }
  | { status: "not_paid"; reason: string };

function chargeFromLatest(
  latest: string | Stripe.Charge | null | undefined,
): Pick<Stripe.Charge, "created" | "status"> | null {
  if (!latest || typeof latest === "string") return null;
  return latest;
}

/** Successful PaymentIntent settlement time from an expanded succeeded Charge (not PI.created). */
export function settlementFromSucceededPaymentIntent(
  pi: Pick<Stripe.PaymentIntent, "status" | "latest_charge">,
): StripeSettlementResolution {
  if (pi.status !== "succeeded") {
    return { status: "not_paid", reason: `payment_intent_${pi.status ?? "unknown"}` };
  }
  const charge = chargeFromLatest(pi.latest_charge);
  if (charge?.status === "succeeded" && charge.created) {
    return { status: "verified", paidAtUnix: charge.created, source: "charge" };
  }
  return { status: "unknown", reason: "no_verified_charge_timestamp" };
}

export async function resolveCheckoutSessionSettlement(
  stripe: Stripe,
  session: Pick<Stripe.Checkout.Session, "mode" | "payment_status" | "payment_intent">,
): Promise<StripeSettlementResolution> {
  if (session.mode !== "payment" || session.payment_status !== "paid") {
    return { status: "not_paid", reason: "checkout_not_paid" };
  }
  const piRef = session.payment_intent;
  if (!piRef) {
    return { status: "unknown", reason: "checkout_missing_payment_intent" };
  }
  if (typeof piRef === "object") {
    return settlementFromSucceededPaymentIntent(piRef);
  }
  try {
    const pi = await stripe.paymentIntents.retrieve(piRef, { expand: ["latest_charge"] });
    return settlementFromSucceededPaymentIntent(pi);
  } catch {
    return { status: "unknown", reason: "payment_intent_retrieve_failed" };
  }
}

export function checkoutSettlementPaidAtUnix(resolution: StripeSettlementResolution) {
  return resolution.status === "verified" ? resolution.paidAtUnix : null;
}
