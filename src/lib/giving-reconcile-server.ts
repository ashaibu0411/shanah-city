import type Stripe from "stripe";
import {
  recordGiftFromCheckoutSession,
  recordGiftFromInvoice,
} from "@/lib/giving-checkout-server";
import {
  getGivingRecordByStripeInvoiceId,
  getGivingRecordByStripeSessionId,
} from "@/lib/giving-server";
import { resolveStripeInvoiceSubscriptionId } from "@/lib/giving-stripe-invoice";
import {
  isShanahGivingCheckoutSession,
  isShanahGivingInvoiceMetadata,
  stripeInvoiceIsFullyRefunded,
} from "@/lib/giving-stripe-eligibility";
import {
  stripeCheckoutPaidAtUnknown,
  stripeCheckoutSettlementPaidAtUnix,
  stripeInvoicePaidAtUnknown,
  stripeInvoiceSettlementPaidAtUnix,
  stripeListCreatedGteWithPaidAtLookback,
  stripeObjectInPaidWindow,
} from "@/lib/giving-stripe-paid-at";
import { getStripe, isStripeGivingConfigured } from "@/lib/stripe-server";
import { useDatabase } from "@/lib/use-database";

export type GivingReconcileMissingItem = {
  kind: "checkout_session" | "invoice";
  stripeId: string;
  amountUsd: number;
  paidAtIso: string;
  donorEmail?: string;
  userId?: string;
};

export function isPaidCheckoutSession(session: Pick<Stripe.Checkout.Session, "mode" | "payment_status">) {
  return session.mode === "payment" && session.payment_status === "paid";
}

export function isPaidStripeInvoice(invoice: Pick<Stripe.Invoice, "status" | "amount_paid">) {
  return invoice.status === "paid" && (invoice.amount_paid ?? 0) > 0;
}

export function isEligibleReconcileGiftInvoice(
  invoice: Pick<Stripe.Invoice, "status" | "amount_paid"> & {
    amount_refunded?: number | null;
  },
) {
  return isPaidStripeInvoice(invoice) && !stripeInvoiceIsFullyRefunded(invoice);
}

export async function reportMissingStripeGifts(options?: { days?: number; limit?: number }) {
  if (!isStripeGivingConfigured()) {
    throw new Error("Stripe is not configured.");
  }
  if (!useDatabase()) {
    throw new Error("Giving reconciliation requires the production database.");
  }

  const days = Math.min(Math.max(options?.days ?? 90, 1), 365);
  const limit = Math.min(Math.max(options?.limit ?? 100, 1), 250);
  const sinceUnix = Math.floor((Date.now() - days * 86_400_000) / 1000);
  const stripe = getStripe();

  const missing: GivingReconcileMissingItem[] = [];
  let scannedSessions = 0;
  let scannedInvoices = 0;

  let sessionStartingAfter: string | undefined;
  while (missing.length < limit) {
    const page = await stripe.checkout.sessions.list({
      limit: 100,
      created: { gte: sinceUnix },
      ...(sessionStartingAfter ? { starting_after: sessionStartingAfter } : {}),
    });
    if (page.data.length === 0) break;

    for (const session of page.data) {
      scannedSessions += 1;
      if (!isPaidCheckoutSession(session)) continue;
      if (stripeCheckoutPaidAtUnknown(session)) continue;
      const checkoutPaidAt = stripeCheckoutSettlementPaidAtUnix(session);
      if (!stripeObjectInPaidWindow(checkoutPaidAt, sinceUnix)) continue;
      if (!isShanahGivingCheckoutSession(session)) continue;
      const existing = await getGivingRecordByStripeSessionId(session.id);
      if (existing) continue;

      missing.push({
        kind: "checkout_session",
        stripeId: session.id,
        amountUsd: Math.round(session.amount_total ?? 0) / 100,
        paidAtIso: new Date((checkoutPaidAt ?? 0) * 1000).toISOString(),
        donorEmail: session.customer_details?.email ?? session.customer_email ?? undefined,
        userId: session.client_reference_id ?? session.metadata?.userId,
      });
      if (missing.length >= limit) break;
    }

    if (!page.has_more || missing.length >= limit) break;
    sessionStartingAfter = page.data[page.data.length - 1]?.id;
  }

  let invoiceStartingAfter: string | undefined;
  while (missing.length < limit) {
    const page = await stripe.invoices.list({
      limit: 100,
      created: { gte: stripeListCreatedGteWithPaidAtLookback(sinceUnix) },
      ...(invoiceStartingAfter ? { starting_after: invoiceStartingAfter } : {}),
    });
    if (page.data.length === 0) break;

    for (const invoice of page.data) {
      scannedInvoices += 1;
      if (!isEligibleReconcileGiftInvoice(invoice)) continue;
      if (stripeInvoicePaidAtUnknown(invoice)) continue;
      const paidAtUnix = stripeInvoiceSettlementPaidAtUnix(invoice);
      if (!stripeObjectInPaidWindow(paidAtUnix, sinceUnix)) continue;
      const extraMetadata = await invoiceMetadataForReconcile(invoice);
      if (!isShanahGivingInvoiceMetadata(extraMetadata)) continue;
      const existing = await getGivingRecordByStripeInvoiceId(invoice.id);
      if (existing) continue;

      missing.push({
        kind: "invoice",
        stripeId: invoice.id,
        amountUsd: Math.round(invoice.amount_paid ?? 0) / 100,
        paidAtIso: new Date((paidAtUnix ?? 0) * 1000).toISOString(),
        donorEmail: invoice.customer_email ?? undefined,
        userId: invoice.metadata?.userId,
      });
      if (missing.length >= limit) break;
    }

    if (!page.has_more || missing.length >= limit) break;
    invoiceStartingAfter = page.data[page.data.length - 1]?.id;
  }

  return {
    dryRun: true as const,
    days,
    scannedSessions,
    scannedInvoices,
    missingCount: missing.length,
    missing,
  };
}

async function invoiceMetadataForReconcile(invoice: Stripe.Invoice) {
  let extraMetadata: Record<string, string> = { ...(invoice.metadata ?? {}) };
  const subscriptionId = resolveStripeInvoiceSubscriptionId(invoice);
  if (subscriptionId) {
    const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
    extraMetadata = { ...subscription.metadata, ...extraMetadata };
  }
  return extraMetadata;
}

export async function applyMissingStripeGifts(input: {
  sessionIds?: string[];
  invoiceIds?: string[];
}) {
  if (!isStripeGivingConfigured()) {
    throw new Error("Stripe is not configured.");
  }

  const stripe = getStripe();
  const sessionIds = (input.sessionIds ?? []).slice(0, 100);
  const invoiceIds = (input.invoiceIds ?? []).slice(0, 100);
  const applied: { stripeId: string; kind: "checkout_session" | "invoice"; recorded: boolean }[] = [];

  for (const sessionId of sessionIds) {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (!isPaidCheckoutSession(session) || !isShanahGivingCheckoutSession(session)) {
      applied.push({ stripeId: sessionId, kind: "checkout_session", recorded: false });
      continue;
    }
    const existing = await getGivingRecordByStripeSessionId(sessionId);
    if (existing) {
      applied.push({ stripeId: sessionId, kind: "checkout_session", recorded: true });
      continue;
    }
    const record = await recordGiftFromCheckoutSession(session);
    applied.push({ stripeId: sessionId, kind: "checkout_session", recorded: Boolean(record) });
  }

  for (const invoiceId of invoiceIds) {
    const invoice = await stripe.invoices.retrieve(invoiceId);
    const extraMetadata = await invoiceMetadataForReconcile(invoice);
    if (!isEligibleReconcileGiftInvoice(invoice) || !isShanahGivingInvoiceMetadata(extraMetadata)) {
      applied.push({ stripeId: invoiceId, kind: "invoice", recorded: false });
      continue;
    }
    const existing = await getGivingRecordByStripeInvoiceId(invoiceId);
    if (existing) {
      applied.push({ stripeId: invoiceId, kind: "invoice", recorded: true });
      continue;
    }
    const record = await recordGiftFromInvoice(invoice, extraMetadata);
    applied.push({ stripeId: invoiceId, kind: "invoice", recorded: Boolean(record) });
  }

  return { applied, appliedCount: applied.filter((row) => row.recorded).length };
}
