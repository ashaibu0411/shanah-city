import type Stripe from "stripe";

const SUCCESS_EVENT_TYPES = [
  "charge.succeeded",
  "payment_intent.succeeded",
  "checkout.session.async_payment_succeeded",
] as const satisfies readonly Stripe.Event.Type[];

export type StripeSuccessEventContext = {
  chargeId?: string;
  paymentIntentId?: string;
  sessionId?: string;
  /** Narrow Event.list search when charge creation time is known (discovery hint only). */
  chargeCreatedAtUnix?: number | null;
};

export type StripeSuccessEventMatch = {
  paidAtUnix: number;
  eventType: (typeof SUCCESS_EVENT_TYPES)[number];
};

export type StripeEventSuccessLookup = (
  stripe: Stripe,
  context: StripeSuccessEventContext,
) => Promise<StripeSuccessEventMatch | null>;

const EVENT_SEARCH_WINDOW_BEFORE_S = 86_400;
const EVENT_SEARCH_WINDOW_AFTER_S = 21 * 86_400;
const EVENT_SEARCH_MAX_PAGES = 5;

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

async function defaultStripeEventSuccessLookup(
  stripe: Stripe,
  context: StripeSuccessEventContext,
): Promise<StripeSuccessEventMatch | null> {
  const created =
    context.chargeCreatedAtUnix != null && context.chargeCreatedAtUnix > 0
      ? {
          gte: Math.max(0, context.chargeCreatedAtUnix - EVENT_SEARCH_WINDOW_BEFORE_S),
          lte: context.chargeCreatedAtUnix + EVENT_SEARCH_WINDOW_AFTER_S,
        }
      : undefined;

  for (const type of SUCCESS_EVENT_TYPES) {
    let startingAfter: string | undefined;
    for (let page = 0; page < EVENT_SEARCH_MAX_PAGES; page++) {
      const list = await stripe.events.list({
        type,
        limit: 100,
        ...(created ? { created } : {}),
        ...(startingAfter ? { starting_after: startingAfter } : {}),
      });
      for (const event of list.data) {
        if (!stripeSuccessEventMatchesContext(event, context)) continue;
        return { paidAtUnix: event.created, eventType: type };
      }
      if (!list.has_more) break;
      startingAfter = list.data[list.data.length - 1]?.id;
    }
  }
  return null;
}

let eventSuccessLookup: StripeEventSuccessLookup = defaultStripeEventSuccessLookup;

export async function lookupStripeSuccessEventCreated(
  stripe: Stripe,
  context: StripeSuccessEventContext,
) {
  return eventSuccessLookup(stripe, context);
}

/** Test-only: inject deterministic Event.created matches without calling Stripe. */
export function setStripeEventSuccessLookupForTests(lookup: StripeEventSuccessLookup | null) {
  eventSuccessLookup = lookup ?? defaultStripeEventSuccessLookup;
}
