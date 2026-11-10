import type Stripe from "stripe";
import {
  freshMemberReconcileEventBudgetStats,
  MEMBER_RECONCILE_EVENT_LIST_BUDGET,
  type MemberReconcileEventBudgetStats,
} from "@/lib/giving-stripe-event-budget";
import {
  EVENT_SEARCH_MAX_PAGES_PER_TYPE,
  type StripeEventSuccessLookup,
  type StripeSuccessEventContext,
  type StripeSuccessEventLookupResult,
  type StripeSuccessEventMatch,
  stripeSuccessEventMatchesContext,
} from "@/lib/giving-stripe-success-event";

/** Stripe Event.list only returns events from roughly the last 30 days (see Stripe docs). */
export const STRIPE_EVENT_API_RETENTION_SECONDS = 30 * 86_400;

const EVENT_LIST_PAGE_LIMIT = 100;

export type MemberReconcileEventScope = {
  nowUnix: number;
  budgetMax: number;
  listCallsRemaining: number;
  stats: MemberReconcileEventBudgetStats;
  cache: Map<string, StripeSuccessEventLookupResult>;
  /** Tests may inject; production uses defaultEventListLookup. */
  eventLookup?: StripeEventSuccessLookup;
};

export function createMemberReconcileEventScope(options?: {
  nowUnix?: number;
  budgetMax?: number;
}): MemberReconcileEventScope {
  const budgetMax = options?.budgetMax ?? MEMBER_RECONCILE_EVENT_LIST_BUDGET;
  return {
    nowUnix: options?.nowUnix ?? Math.floor(Date.now() / 1000),
    budgetMax,
    listCallsRemaining: budgetMax,
    stats: freshMemberReconcileEventBudgetStats(budgetMax),
    cache: new Map(),
  };
}

function eventScopeCacheKey(context: StripeSuccessEventContext) {
  return [context.chargeId, context.paymentIntentId, context.sessionId].filter(Boolean).join("|");
}

function tryConsumeEventListCall(scope: MemberReconcileEventScope) {
  if (scope.listCallsRemaining <= 0) {
    scope.stats.budgetExhausted = true;
    return false;
  }
  scope.listCallsRemaining -= 1;
  scope.stats.listCallsUsed += 1;
  return true;
}

function stripeEventListCreatedWindow(scope: MemberReconcileEventScope) {
  return {
    gte: Math.max(0, scope.nowUnix - STRIPE_EVENT_API_RETENTION_SECONDS),
    lte: scope.nowUnix,
  };
}

async function defaultEventListLookup(
  stripe: Stripe,
  context: StripeSuccessEventContext,
  scope: MemberReconcileEventScope,
): Promise<StripeSuccessEventLookupResult> {
  const created = stripeEventListCreatedWindow(scope);
  const types = eventTypesForContext(context);
  let paginationCapped = false;

  for (const type of types) {
    let startingAfter: string | undefined;
    for (let page = 0; page < EVENT_SEARCH_MAX_PAGES_PER_TYPE; page++) {
      if (!tryConsumeEventListCall(scope)) {
        return { outcome: "budget_exhausted" };
      }
      const list = await stripe.events.list({
        type,
        limit: EVENT_LIST_PAGE_LIMIT,
        created,
        ...(startingAfter ? { starting_after: startingAfter } : {}),
      });
      for (const event of list.data) {
        if (!stripeSuccessEventMatchesContext(event, context)) continue;
        return {
          outcome: "found",
          match: {
            paidAtUnix: event.created,
            eventType: type as StripeSuccessEventMatch["eventType"],
          },
        };
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
    scope.stats.paginationLimited += 1;
    return { outcome: "pagination_limited" };
  }
  scope.stats.notFound += 1;
  return { outcome: "not_found" };
}

function eventTypesForContext(context: StripeSuccessEventContext) {
  const types: Stripe.Event.Type[] = [];
  if (context.paymentIntentId) types.push("payment_intent.succeeded");
  if (context.chargeId) types.push("charge.succeeded");
  if (context.sessionId) types.push("checkout.session.async_payment_succeeded");
  if (types.length > 0) return types;
  return [
    "payment_intent.succeeded",
    "charge.succeeded",
    "checkout.session.async_payment_succeeded",
  ] as Stripe.Event.Type[];
}

export async function lookupStripeSuccessEventCreated(
  stripe: Stripe,
  context: StripeSuccessEventContext,
  scope: MemberReconcileEventScope,
): Promise<StripeSuccessEventLookupResult> {
  const key = eventScopeCacheKey(context);
  const cached = scope.cache.get(key);
  if (cached) {
    scope.stats.cacheHits += 1;
    return cached;
  }
  const lookup = scope.eventLookup ?? defaultEventListLookup;
  const result = await lookup(stripe, context, scope);
  scope.cache.set(key, result);
  if (result.outcome === "found") scope.stats.found += 1;
  return result;
}

export function getMemberReconcileEventScopeStats(scope: MemberReconcileEventScope) {
  return { ...scope.stats };
}
