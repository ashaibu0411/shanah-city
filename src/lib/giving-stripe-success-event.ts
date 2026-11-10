import type Stripe from "stripe";
import {
  recordMemberReconcileEventCacheHit,
  recordMemberReconcileEventFound,
  recordMemberReconcileEventNotFound,
  recordMemberReconcileEventPaginationLimited,
  recordMemberReconcileEventRetentionSkipped,
  tryConsumeMemberReconcileEventListCall,
} from "@/lib/giving-stripe-event-budget";

const SUCCESS_EVENT_TYPES = [
  "charge.succeeded",
  "payment_intent.succeeded",
  "checkout.session.async_payment_succeeded",
] as const satisfies readonly Stripe.Event.Type[];

/** Stripe Event.list only returns events from roughly the last 30 days (see Stripe docs). */
export const STRIPE_EVENT_API_RETENTION_SECONDS = 30 * 86_400;

export const EVENT_SEARCH_MAX_PAGES_PER_TYPE = 3;

export type StripeSuccessEventContext = {
  chargeId?: string;
  paymentIntentId?: string;
  sessionId?: string;
  chargeCreatedAtUnix?: number | null;
};

export type StripeSuccessEventMatch = {
  paidAtUnix: number;
  eventType: (typeof SUCCESS_EVENT_TYPES)[number];
};

export type StripeSuccessEventLookupResult =
  | { outcome: "found"; match: StripeSuccessEventMatch }
  | { outcome: "not_found" }
  | { outcome: "out_of_coverage" }
  | { outcome: "budget_exhausted" }
  | { outcome: "pagination_limited" };

export type StripeEventSuccessLookup = (
  stripe: Stripe,
  context: StripeSuccessEventContext,
) => Promise<StripeSuccessEventLookupResult>;

const EVENT_SEARCH_WINDOW_BEFORE_S = 86_400;
const EVENT_SEARCH_WINDOW_AFTER_S = 21 * 86_400;

let reconcileNowUnix: number | null = null;

export function setStripeReconcileNowUnixForTests(unix: number | null) {
  reconcileNowUnix = unix;
}

export function stripeReconcileNowUnix() {
  return reconcileNowUnix ?? Math.floor(Date.now() / 1000);
}

export function stripeEventListLikelyOutOfCoverage(paymentActivityUnix: number | null | undefined) {
  if (paymentActivityUnix == null || paymentActivityUnix <= 0) return false;
  const now = stripeReconcileNowUnix();
  return now - paymentActivityUnix > STRIPE_EVENT_API_RETENTION_SECONDS;
}

function cacheKey(context: StripeSuccessEventContext) {
  return [context.chargeId, context.paymentIntentId, context.sessionId].filter(Boolean).join("|");
}

const lookupCache = new Map<string, StripeSuccessEventLookupResult>();

export function clearStripeSuccessEventLookupCacheForTests() {
  lookupCache.clear();
}

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

function eventTypesForContext(context: StripeSuccessEventContext) {
  const types: (typeof SUCCESS_EVENT_TYPES)[number][] = [];
  if (context.paymentIntentId) types.push("payment_intent.succeeded");
  if (context.chargeId) types.push("charge.succeeded");
  if (context.sessionId) types.push("checkout.session.async_payment_succeeded");
  return types.length > 0 ? types : [...SUCCESS_EVENT_TYPES];
}

async function defaultStripeEventSuccessLookup(
  stripe: Stripe,
  context: StripeSuccessEventContext,
): Promise<StripeSuccessEventLookupResult> {
  const activityHint = context.chargeCreatedAtUnix ?? null;
  const created =
    activityHint != null && activityHint > 0
      ? {
          gte: Math.max(0, activityHint - EVENT_SEARCH_WINDOW_BEFORE_S),
          lte: activityHint + EVENT_SEARCH_WINDOW_AFTER_S,
        }
      : undefined;

  let paginationCapped = false;

  for (const type of eventTypesForContext(context)) {
    let startingAfter: string | undefined;
    for (let page = 0; page < EVENT_SEARCH_MAX_PAGES_PER_TYPE; page++) {
      if (!tryConsumeMemberReconcileEventListCall()) {
        return { outcome: "budget_exhausted" };
      }
      const list = await stripe.events.list({
        type,
        limit: 100,
        ...(created ? { created } : {}),
        ...(startingAfter ? { starting_after: startingAfter } : {}),
      });
      for (const event of list.data) {
        if (!stripeSuccessEventMatchesContext(event, context)) continue;
        return { outcome: "found", match: { paidAtUnix: event.created, eventType: type } };
      }
      if (!list.has_more) break;
      if (page === EVENT_SEARCH_MAX_PAGES_PER_TYPE - 1) {
        paginationCapped = true;
        break;
      }
      startingAfter = list.data[list.data.length - 1]?.id;
    }
  }

  if (paginationCapped) {
    recordMemberReconcileEventPaginationLimited();
    return { outcome: "pagination_limited" };
  }
  recordMemberReconcileEventNotFound();
  return { outcome: "not_found" };
}

let eventSuccessLookup: StripeEventSuccessLookup = defaultStripeEventSuccessLookup;

export async function lookupStripeSuccessEventCreated(
  stripe: Stripe,
  context: StripeSuccessEventContext,
): Promise<StripeSuccessEventLookupResult> {
  const key = cacheKey(context);
  const cached = lookupCache.get(key);
  if (cached) {
    recordMemberReconcileEventCacheHit();
    return cached;
  }
  if (stripeEventListLikelyOutOfCoverage(context.chargeCreatedAtUnix)) {
    recordMemberReconcileEventRetentionSkipped();
    const retention: StripeSuccessEventLookupResult = { outcome: "out_of_coverage" };
    lookupCache.set(key, retention);
    return retention;
  }
  const result = await eventSuccessLookup(stripe, context);
  lookupCache.set(key, result);
  if (result.outcome === "found") recordMemberReconcileEventFound();
  return result;
}

/** Test-only: inject Event list behavior; use `null` to restore production lookup. */
export function setStripeEventSuccessLookupForTests(lookup: StripeEventSuccessLookup | null) {
  eventSuccessLookup = lookup ?? defaultStripeEventSuccessLookup;
}
