import type Stripe from "stripe";

/** Paid timestamp for filtering (not invoice.created, which can precede payment). */
export function stripeInvoicePaidAtUnix(
  invoice: Pick<Stripe.Invoice, "status_transitions" | "created" | "status">,
) {
  const paidAt = invoice.status_transitions?.paid_at;
  if (paidAt) return paidAt;
  if (invoice.status === "paid") return invoice.created ?? 0;
  return 0;
}

export function stripeCheckoutPaidAtUnix(
  session: Pick<Stripe.Checkout.Session, "created" | "status_transitions">,
) {
  const paidAt = session.status_transitions?.paid_at;
  if (paidAt) return paidAt;
  return session.created ?? 0;
}

export function stripeObjectInPaidWindow(
  paidAtUnix: number,
  sinceUnix: number,
  untilUnix?: number,
) {
  if (paidAtUnix <= 0) return false;
  if (paidAtUnix < sinceUnix) return false;
  if (untilUnix !== undefined && paidAtUnix > untilUnix) return false;
  return true;
}

/** Stripe list APIs filter on `created`; widen lookback so paid-at falls inside sync window. */
export function stripeListCreatedGteWithPaidAtLookback(sinceUnix: number, lookbackSeconds = 120 * 86_400) {
  return Math.max(0, sinceUnix - lookbackSeconds);
}
