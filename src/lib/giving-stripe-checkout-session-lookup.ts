import type Stripe from "stripe";
import { checkoutSessionDualCorroboratedForMember } from "@/lib/giving-stripe-checkout-ownership";
import { resolveStripeCustomerId } from "@/lib/giving-stripe-invoice";
import {
  MEMBER_STRIPE_SYNC_CUSTOMERLESS_PAGE_LIMIT,
  MEMBER_STRIPE_SYNC_CUSTOMERLESS_SEARCH_MAX_PAGES,
} from "@/lib/giving-stripe-member-sync-policy";

/** Checkout Sessions for a PaymentIntent (Stripe list filter — authoritative for Checkout mode gifts). */
export async function listCheckoutSessionsForPaymentIntent(
  stripe: Stripe,
  paymentIntentId: string,
  limit = 10,
) {
  const list = await stripe.checkout.sessions.list({
    payment_intent: paymentIntentId,
    limit: Math.min(Math.max(limit, 1), 100),
  });
  return list.data;
}

export async function listSucceededPaymentIntentsForCustomer(
  stripe: Stripe,
  customerId: string,
  sinceUnix: number,
  options?: { limit?: number; startingAfter?: string },
) {
  return stripe.paymentIntents.list({
    customer: customerId,
    created: { gte: sinceUnix },
    limit: options?.limit ?? 100,
    ...(options?.startingAfter ? { starting_after: options.startingAfter } : {}),
  });
}

function stripeSearchEscapeMemberId(memberId: string) {
  return memberId.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

type CheckoutSessionSearchApi = {
  search(params: {
    query: string;
    limit?: number;
    page?: string;
  }): Promise<{
    data: Stripe.Checkout.Session[];
    has_more: boolean;
    next_page?: string | null;
  }>;
};

/**
 * Bounded Stripe Search for paid Shanah checkouts stamped with member metadata.userId but no
 * Stripe customer (customer-scoped list omits these). Caller must re-verify dual corroboration.
 */
export async function listCustomerlessDualCorroboratedCheckoutSessionsForMember(
  stripe: Stripe,
  memberId: string,
  sinceUnix: number,
  options?: { maxPages?: number; pageLimit?: number },
): Promise<Stripe.Checkout.Session[]> {
  if (!memberId.trim()) return [];

  const maxPages = options?.maxPages ?? MEMBER_STRIPE_SYNC_CUSTOMERLESS_SEARCH_MAX_PAGES;
  const pageLimit = Math.min(
    options?.pageLimit ?? MEMBER_STRIPE_SYNC_CUSTOMERLESS_PAGE_LIMIT,
    100,
  );
  const matches: Stripe.Checkout.Session[] = [];
  const seen = new Set<string>();
  const searchApi = stripe.checkout.sessions as unknown as CheckoutSessionSearchApi;
  if (typeof searchApi.search !== "function") {
    return [];
  }

  const query = `metadata['userId']:'${stripeSearchEscapeMemberId(memberId)}'`;

  let page: string | undefined;
  for (let i = 0; i < maxPages; i++) {
    const result = await searchApi.search({
      query,
      limit: pageLimit,
      ...(page ? { page } : {}),
    });

    for (const session of result.data) {
      if (seen.has(session.id)) continue;
      seen.add(session.id);
      if ((session.created ?? 0) < sinceUnix) continue;
      if (resolveStripeCustomerId(session.customer)) continue;
      if (!checkoutSessionDualCorroboratedForMember(session, memberId)) continue;
      matches.push(session);
    }

    if (!result.has_more || !result.next_page) break;
    page = result.next_page;
  }

  return matches;
}
