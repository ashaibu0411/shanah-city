import type Stripe from "stripe";
import { GIVING_CHECKOUT_FUNDS, normalizeGivingEmail, type GivingFund } from "@/lib/giving-types";
import { metadataUserId } from "@/lib/giving-stripe-identity";
import { resolveStripeCustomerId } from "@/lib/giving-stripe-invoice";
import { getZonedDateParts } from "@/lib/denver-time";

const GIVING_FUND_SET = new Set<string>(GIVING_CHECKOUT_FUNDS.map((row) => row.value));

export function isKnownGivingFund(value: string | null | undefined): value is GivingFund {
  const fund = String(value ?? "").trim();
  return GIVING_FUND_SET.has(fund);
}

/** Metadata stamped by Shanah City Stripe Checkout (`createGivingCheckoutSession`). */
export function isShanahGivingStripeMetadata(metadata: Record<string, string> | null | undefined) {
  if (!metadata) return false;
  if (!isKnownGivingFund(metadata.fund)) return false;
  const giftAmount = Number(metadata.giftAmount);
  if (!Number.isFinite(giftAmount) || giftAmount <= 0) return false;
  return true;
}

export function isShanahGivingCheckoutSession(
  session: Pick<Stripe.Checkout.Session, "metadata" | "mode">,
) {
  if (session.mode !== "payment") return false;
  return isShanahGivingStripeMetadata(session.metadata ?? undefined);
}

export function isShanahGivingInvoiceMetadata(metadata: Record<string, string> | null | undefined) {
  return isShanahGivingStripeMetadata(metadata);
}

export function stripeInvoiceIsFullyRefunded(invoice: Pick<Stripe.Invoice, "amount_paid"> & {
  amount_refunded?: number | null;
}) {
  const paid = invoice.amount_paid ?? 0;
  if (paid <= 0) return false;
  const refunded = invoice.amount_refunded ?? 0;
  return refunded >= paid;
}

export function giftDateKeyFromUnixSeconds(unix?: number | null) {
  if (!unix || unix <= 0) {
    return getZonedDateParts().dateKey;
  }
  return getZonedDateParts(new Date(unix * 1000)).dateKey;
}

export function giftGivenOnFromCheckoutSession(session: {
  created?: number | null;
  status_transitions?: { paid_at?: number | null } | null;
}) {
  const paidAt = session.status_transitions?.paid_at;
  if (paidAt) return giftDateKeyFromUnixSeconds(paidAt);
  return giftDateKeyFromUnixSeconds(session.created ?? undefined);
}

export function giftGivenOnFromInvoice(invoice: {
  created?: number | null;
  status_transitions?: { paid_at?: number | null } | null;
}) {
  const paidAt = invoice.status_transitions?.paid_at;
  if (paidAt) return giftDateKeyFromUnixSeconds(paidAt);
  return giftDateKeyFromUnixSeconds(invoice.created ?? undefined);
}

/**
 * Fail-closed: allow confirm only when the session is Shanah giving and the member
 * matches client_reference_id / metadata userId, linked Stripe customer, or checkout email.
 */
export function checkoutSessionAuthorizedForMember(
  session: Pick<
    Stripe.Checkout.Session,
    "metadata" | "client_reference_id" | "customer" | "customer_details" | "customer_email" | "mode"
  >,
  member: { id: string; email: string },
  options?: { memberStripeCustomerId?: string | null },
) {
  if (!isShanahGivingCheckoutSession(session)) return false;

  const ref = session.client_reference_id?.trim();
  const metaUser = metadataUserId(session.metadata?.userId);

  if (ref) return ref === member.id;
  if (metaUser) return metaUser === member.id;

  const customerId = resolveStripeCustomerId(session.customer);
  if (
    customerId &&
    options?.memberStripeCustomerId?.trim() &&
    customerId === options.memberStripeCustomerId.trim()
  ) {
    return true;
  }

  const sessionEmail = normalizeGivingEmail(
    session.customer_details?.email ?? session.customer_email ?? undefined,
  );
  const memberEmail = normalizeGivingEmail(member.email);
  if (sessionEmail && memberEmail && sessionEmail === memberEmail) {
    return true;
  }

  return false;
}

export function canLinkGivingRecordToMember(
  record: { userId?: string | null; donorEmail?: string | null },
  member: { id: string; email: string },
) {
  if (record.userId && record.userId !== member.id) return false;
  const recordEmail = normalizeGivingEmail(record.donorEmail);
  const memberEmail = normalizeGivingEmail(member.email);
  if (!recordEmail || !memberEmail) return false;
  return recordEmail === memberEmail;
}
