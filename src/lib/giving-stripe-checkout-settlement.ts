import type Stripe from "stripe";
import {
  lookupStripeSuccessEventCreated,
  type MemberReconcileEventScope,
} from "@/lib/giving-stripe-reconcile-event-scope";
import type { StripeSuccessEventLookupResult } from "@/lib/giving-stripe-success-event";

export type StripeSettlementDateUnknownReason =
  | "no_matching_stripe_success_event"
  | "event_lookup_budget_exhausted"
  | "event_lookup_pagination_limited";

export type StripeSettlementResolution =
  | {
      status: "verified";
      paidAtUnix: number;
      source: "stripe_success_event";
      eventType: string;
      paymentSucceededVerified: true;
      successAtVerified: true;
      chargeCreatedAtUnix: number | null;
      financeManualDateReviewRecommended: false;
    }
  | {
      status: "success_date_unknown";
      reason: StripeSettlementDateUnknownReason;
      paymentSucceededVerified: true;
      successAtVerified: false;
      chargeCreatedAtUnix: number | null;
      financeManualDateReviewRecommended: true;
    }
  | {
      status: "not_paid";
      reason: string;
      paymentSucceededVerified: false;
      successAtVerified: false;
      chargeCreatedAtUnix: number | null;
      financeManualDateReviewRecommended: false;
    }
  | {
      status: "unknown";
      reason: string;
      paymentSucceededVerified: false;
      successAtVerified: false;
      chargeCreatedAtUnix: number | null;
      financeManualDateReviewRecommended: false;
    };

function chargeFromLatest(latest: string | Stripe.Charge | null | undefined) {
  if (!latest || typeof latest === "string") return null;
  return latest;
}

function chargeCreatedUnix(charge: Pick<Stripe.Charge, "created"> | null) {
  return charge?.created ?? null;
}

function mapEventLookupToReason(
  outcome: StripeSuccessEventLookupResult["outcome"],
): StripeSettlementDateUnknownReason {
  switch (outcome) {
    case "budget_exhausted":
      return "event_lookup_budget_exhausted";
    case "pagination_limited":
      return "event_lookup_pagination_limited";
    default:
      return "no_matching_stripe_success_event";
  }
}

export async function resolvePaymentIntentSettlement(
  stripe: Stripe,
  pi: Pick<Stripe.PaymentIntent, "id" | "status" | "latest_charge" | "created">,
  eventScope: MemberReconcileEventScope,
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
      financeManualDateReviewRecommended: false,
    };
  }
  if (charge?.status !== "succeeded") {
    return {
      status: "unknown",
      reason: "charge_not_succeeded",
      paymentSucceededVerified: false,
      successAtVerified: false,
      chargeCreatedAtUnix,
      financeManualDateReviewRecommended: false,
    };
  }

  const chargeId = charge.id;
  const eventLookup = await lookupStripeSuccessEventCreated(
    stripe,
    {
      chargeId,
      paymentIntentId: pi.id,
      sessionId: extraContext?.sessionId,
      chargeCreatedAtUnix,
    },
    eventScope,
  );

  if (eventLookup.outcome === "found") {
    return {
      status: "verified",
      paidAtUnix: eventLookup.match.paidAtUnix,
      source: "stripe_success_event",
      eventType: eventLookup.match.eventType,
      paymentSucceededVerified: true,
      successAtVerified: true,
      chargeCreatedAtUnix,
      financeManualDateReviewRecommended: false,
    };
  }

  return {
    status: "success_date_unknown",
    reason: mapEventLookupToReason(eventLookup.outcome),
    paymentSucceededVerified: true,
    successAtVerified: false,
    chargeCreatedAtUnix,
    financeManualDateReviewRecommended: true,
  };
}

export async function resolveCheckoutSessionSettlement(
  stripe: Stripe,
  session: Pick<Stripe.Checkout.Session, "id" | "mode" | "payment_status" | "payment_intent">,
  eventScope: MemberReconcileEventScope,
): Promise<StripeSettlementResolution> {
  if (session.mode !== "payment" || session.payment_status !== "paid") {
    return {
      status: "not_paid",
      reason: "checkout_not_paid",
      paymentSucceededVerified: false,
      successAtVerified: false,
      chargeCreatedAtUnix: null,
      financeManualDateReviewRecommended: false,
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
      financeManualDateReviewRecommended: false,
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
      eventScope,
      { sessionId: session.id },
    );
  } catch {
    return {
      status: "unknown",
      reason: "payment_intent_retrieve_failed",
      paymentSucceededVerified: false,
      successAtVerified: false,
      chargeCreatedAtUnix: null,
      financeManualDateReviewRecommended: false,
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

export function settlementUnknownMapsToSkipReason(
  reason: StripeSettlementDateUnknownReason,
): string {
  switch (reason) {
    case "event_lookup_budget_exhausted":
    case "event_lookup_pagination_limited":
      return "success_date_lookup_inconclusive";
    case "no_matching_stripe_success_event":
      return "success_date_not_in_listable_events";
    default:
      return "paid_at_unknown";
  }
}
