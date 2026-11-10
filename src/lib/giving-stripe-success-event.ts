import type Stripe from "stripe";
import type { MemberReconcileEventScope } from "@/lib/giving-stripe-reconcile-event-scope";

export const EVENT_SEARCH_MAX_PAGES_PER_TYPE = 3;

export type StripeSuccessEventContext = {
  chargeId?: string;
  paymentIntentId?: string;
  sessionId?: string;
  /** Discovery hint only — must not skip Event.list solely because this is old. */
  chargeCreatedAtUnix?: number | null;
};

export type StripeSuccessEventMatch = {
  paidAtUnix: number;
  eventType:
    | "charge.succeeded"
    | "payment_intent.succeeded"
    | "checkout.session.async_payment_succeeded";
};

export type StripeSuccessEventLookupResult =
  | { outcome: "found"; match: StripeSuccessEventMatch }
  | { outcome: "not_found" }
  | { outcome: "budget_exhausted" }
  | { outcome: "pagination_limited" };

export type StripeEventSuccessLookup = (
  stripe: Stripe,
  context: StripeSuccessEventContext,
  scope: MemberReconcileEventScope,
) => Promise<StripeSuccessEventLookupResult>;

function eventObjectId(event: Stripe.Event) {
  const obj = event.data.object as { id?: string };
  return obj.id?.trim() || null;
}

export function stripeSuccessEventMatchesContext(
  event: Stripe.Event,
  context: StripeSuccessEventContext,
): boolean {
  const objectId = eventObjectId(event);
  if (!objectId) return false;
  switch (event.type) {
    case "charge.succeeded":
      return Boolean(context.chargeId && objectId === context.chargeId);
    case "payment_intent.succeeded":
      return Boolean(context.paymentIntentId && objectId === context.paymentIntentId);
    case "checkout.session.async_payment_succeeded":
      return Boolean(context.sessionId && objectId === context.sessionId);
    default:
      return false;
  }
}
