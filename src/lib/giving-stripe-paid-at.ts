import type Stripe from "stripe";

type StripePaidAtTransitions = { paid_at?: number | null } | null | undefined;

type StripeCheckoutSettlementFields = {
  mode?: string | null;
  payment_status?: string | null;
  status_transitions?: StripePaidAtTransitions;
};

/** Verified settlement time from Stripe; never substitutes invoice/session created. */
export function stripeInvoiceSettlementPaidAtUnix(
  invoice: Pick<Stripe.Invoice, "status_transitions" | "status">,
): number | null {
  const paidAt = invoice.status_transitions?.paid_at;
  if (paidAt) return paidAt;
  return null;
}

export function stripeCheckoutSettlementPaidAtUnix(session: StripeCheckoutSettlementFields): number | null {
  if (session.mode !== "payment" || session.payment_status !== "paid") return null;
  const paidAt = session.status_transitions?.paid_at;
  if (paidAt) return paidAt;
  return null;
}

export function stripeInvoicePaidAtUnknown(
  invoice: Pick<Stripe.Invoice, "status_transitions" | "status">,
) {
  return invoice.status === "paid" && !invoice.status_transitions?.paid_at;
}

export function stripeCheckoutPaidAtUnknown(session: StripeCheckoutSettlementFields) {
  return (
    session.mode === "payment" &&
    session.payment_status === "paid" &&
    !session.status_transitions?.paid_at
  );
}

/** @deprecated Use stripeInvoiceSettlementPaidAtUnix — never falls back to created. */
export function stripeInvoicePaidAtUnix(
  invoice: Pick<Stripe.Invoice, "status_transitions" | "status" | "created">,
) {
  return stripeInvoiceSettlementPaidAtUnix(invoice);
}

export function stripeObjectInPaidWindow(
  paidAtUnix: number | null | undefined,
  sinceUnix: number,
  untilUnix?: number,
) {
  if (paidAtUnix == null || paidAtUnix <= 0) return false;
  if (paidAtUnix < sinceUnix) return false;
  if (untilUnix !== undefined && paidAtUnix > untilUnix) return false;
  return true;
}

/** Stripe list APIs filter on `created`; widen lookback so paid-at falls inside sync window. */
export function stripeListCreatedGteWithPaidAtLookback(sinceUnix: number, lookbackSeconds = 120 * 86_400) {
  return Math.max(0, sinceUnix - lookbackSeconds);
}

export function stripePaidAtIsoFromUnix(paidAtUnix: number | null | undefined) {
  if (paidAtUnix == null || paidAtUnix <= 0) return null;
  return new Date(paidAtUnix * 1000).toISOString();
}
