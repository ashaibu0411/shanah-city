import type Stripe from "stripe";
import { lookupStripeSuccessEventCreated } from "@/lib/giving-stripe-success-event";

export type StripeSettlementResolution =
  | {
      status: "verified";
      paidAtUnix: number;
      source: "stripe_success_event";
      eventType: string;
      paymentSucceededVerified: true;
      successAtVerified: true;
      chargeCreatedAtUnix: number | null;
    }
  | {
      status: "success_date_unknown";
      reason: string;
      paymentSucceededVerified: true;
      successAtVerified: false;
      chargeCreatedAtUnix: number | null;
    }
  | {
      status: "not_paid";
      reason: string;
      paymentSucceededVerified: false;
      successAtVerified: false;
      chargeCreatedAtUnix: number | null;
    }
  | {
      status: "unknown";
      reason: string;
      paymentSucceededVerified: false;
      successAtVerified: false;
      chargeCreatedAtUnix: number | null;
    };

function chargeFromLatest(latest: string | Stripe.Charge | null | undefined) {
  if (!latest || typeof latest === "string") return null;
  return latest;
}

function chargeCreatedUnix(charge: Pick<Stripe.Charge, "created"> | null) {
  return charge?.created ?? null;
}

export async function resolvePaymentIntentSettlement(
  stripe: Stripe,
  pi: Pick<Stripe.PaymentIntent, "id" | "status" | "latest_charge" | "created">,
  extraContext?: { sessionId?: string },
): Promise<StripeSettlementResolution> {
  const charge = chargeFromLatest(pi.latest_charge);
  const chargeCreatedAtUnix = chargeCreatedUnix(charge);

  if (pi.status !== "succeeded") {
    return {
      status: "not_paid",
      reason: `payment_intent_${pi.status ?? "unknown"}`,
      paymentSucceededVerified: false,
      successAtVerified: false,
      chargeCreatedAtUnix,
    };
  }
  if (charge?.status !== "succeeded") {
    return {
      status: "unknown",
      reason: "charge_not_succeeded",
      paymentSucceededVerified: false,
      successAtVerified: false,
      chargeCreatedAtUnix,
    };
  }

  const chargeId = charge.id;
  const successEvent = await lookupStripeSuccessEventCreated(stripe, {
    chargeId,
    paymentIntentId: pi.id,
    sessionId: extraContext?.sessionId,
    chargeCreatedAtUnix,
  });

  if (!successEvent) {
    return {
      status: "success_date_unknown",
      reason: "no_matching_stripe_success_event",
      paymentSucceededVerified: true,
      successAtVerified: false,
      chargeCreatedAtUnix,
    };
  }

  return {
    status: "verified",
    paidAtUnix: successEvent.paidAtUnix,
    source: "stripe_success_event",
    eventType: successEvent.eventType,
    paymentSucceededVerified: true,
    successAtVerified: true,
    chargeCreatedAtUnix,
  };
}

export async function resolveCheckoutSessionSettlement(
  stripe: Stripe,
  session: Pick<Stripe.Checkout.Session, "id" | "mode" | "payment_status" | "payment_intent">,
): Promise<StripeSettlementResolution> {
  if (session.mode !== "payment" || session.payment_status !== "paid") {
    return {
      status: "not_paid",
      reason: "checkout_not_paid",
      paymentSucceededVerified: false,
      successAtVerified: false,
      chargeCreatedAtUnix: null,
    };
  }
  const piRef = session.payment_intent;
  if (!piRef) {
    return {
      status: "unknown",
      reason: "checkout_missing_payment_intent",
      paymentSucceededVerified: false,
      successAtVerified: false,
      chargeCreatedAtUnix: null,
    };
  }
  try {
    const piId = typeof piRef === "string" ? piRef : piRef.id;
    const pi =
      typeof piRef === "object"
        ? piRef
        : await stripe.paymentIntents.retrieve(piRef, { expand: ["latest_charge"] });
    return resolvePaymentIntentSettlement(
      stripe,
      { ...pi, id: pi.id ?? piId ?? "unknown_pi" },
      { sessionId: session.id },
    );
  } catch {
    return {
      status: "unknown",
      reason: "payment_intent_retrieve_failed",
      paymentSucceededVerified: false,
      successAtVerified: false,
      chargeCreatedAtUnix: null,
    };
  }
}

/** Verified settlement instant only — never Charge.created. */
export function checkoutSettlementPaidAtUnix(resolution: StripeSettlementResolution) {
  return resolution.status === "verified" && resolution.successAtVerified ? resolution.paidAtUnix : null;
}

export function stripeSettlementPaymentSucceeded(resolution: StripeSettlementResolution) {
  return (
    (resolution.status === "verified" || resolution.status === "success_date_unknown") &&
    resolution.paymentSucceededVerified
  );
}
