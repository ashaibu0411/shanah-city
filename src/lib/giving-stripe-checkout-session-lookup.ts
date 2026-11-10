import type Stripe from "stripe";

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
