/**
 * Read-only Stripe vs DB probe for a member (redacted stdout only).
 * Usage: MEMBER_USER_ID=... npx tsx scripts/giving-member-stripe-probe.ts
 * Optional: SINCE=2026-10-01 UNTIL=2026-10-31
 */

import Stripe from "stripe";
import { prisma } from "../src/lib/db";
import { redactEmailForLogs, redactStripeId, redactUserIdForLogs } from "../src/lib/giving-privacy-redact";
import { isShanahGivingCheckoutSession, isShanahGivingInvoiceMetadata } from "../src/lib/giving-stripe-eligibility";
import { isPaidCheckoutSession, isEligibleReconcileGiftInvoice } from "../src/lib/giving-reconcile-server";
import { resolveStripeInvoiceSubscriptionId } from "../src/lib/giving-stripe-invoice";
import { giftGivenOnFromCheckoutSession, giftGivenOnFromInvoice } from "../src/lib/giving-stripe-eligibility";
import { resolveCheckoutSessionSettlement } from "../src/lib/giving-stripe-checkout-settlement";
import {
  stripeInvoicePaidAtUnknown,
  stripeInvoiceSettlementPaidAtUnix,
  stripeListCreatedGteWithPaidAtLookback,
  stripeObjectInPaidWindow,
} from "../src/lib/giving-stripe-paid-at";
import { giftDateKeyFromUnixSeconds } from "../src/lib/giving-stripe-eligibility";

const userId = process.env.MEMBER_USER_ID?.trim();
const customerOverride = process.env.STRIPE_CUSTOMER_ID?.trim();
const sinceKey = process.env.SINCE ?? "2026-10-01";
const untilKey = process.env.UNTIL ?? "2026-10-31";

if (!userId) {
  console.error("MEMBER_USER_ID required");
  process.exit(1);
}

const stripeKey = process.env.STRIPE_SECRET_KEY?.trim();
if (!stripeKey) {
  console.error("STRIPE_SECRET_KEY required");
  process.exit(1);
}

const stripe = new Stripe(stripeKey);

function inRange(dateKey: string) {
  return dateKey >= sinceKey && dateKey <= untilKey;
}

function classifyCheckoutSkip(session: Stripe.Checkout.Session) {
  if (session.mode !== "payment") return `checkout_mode_${session.mode}`;
  if (session.payment_status !== "paid") return `payment_status_${session.payment_status}`;
  if (!isShanahGivingCheckoutSession(session)) return "not_shanah_checkout_metadata";
  return null;
}

async function invoiceMeta(invoice: Stripe.Invoice) {
  let extra: Record<string, string> = { ...(invoice.metadata ?? {}) };
  const subId = resolveStripeInvoiceSubscriptionId(invoice);
  if (subId) {
    const sub = await stripe.subscriptions.retrieve(subId);
    extra = { ...sub.metadata, ...extra };
  }
  return extra;
}

async function main() {
  let user: { id: string; email: string; stripeCustomerId: string | null } | null = null;
  if (userId) {
    try {
      user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, stripeCustomerId: true },
      });
    } catch {
      user = null;
    }
  }
  const customerId = customerOverride ?? user?.stripeCustomerId;
  if (!customerId) {
    console.error("STRIPE_CUSTOMER_ID or resolvable member stripeCustomerId required");
    process.exit(1);
  }
  if (!user && userId) {
    user = { id: userId, email: "", stripeCustomerId: customerId };
  }
  if (!user) {
    user = { id: "unknown", email: "", stripeCustomerId: customerId };
  }

  let dbRecords: {
    id: string;
    amount: number;
    givenOn: string;
    stripeSessionId: string | null;
    stripeInvoiceId: string | null;
    userId: string | null;
  }[] = [];
  try {
    dbRecords = await prisma.givingRecord.findMany({
      where: {
        source: "stripe",
        OR: [{ userId: user.id }, { stripeSessionId: { not: null } }, { stripeInvoiceId: { not: null } }],
      },
      select: {
        id: true,
        amount: true,
        givenOn: true,
        stripeSessionId: true,
        stripeInvoiceId: true,
        userId: true,
      },
    });
  } catch {
    dbRecords = [];
  }

  const sinceUnix = Math.floor(new Date(`${sinceKey}T00:00:00Z`).getTime() / 1000);
  const untilUnix = Math.floor(new Date(`${untilKey}T23:59:59Z`).getTime() / 1000);
  const listCreatedGte = stripeListCreatedGteWithPaidAtLookback(sinceUnix);

  const sessions: Stripe.Checkout.Session[] = [];
  let startingAfter: string | undefined;
  for (let page = 0; page < 10; page++) {
    const list = await stripe.checkout.sessions.list({
      customer: customerId,
      limit: 100,
      created: { gte: listCreatedGte, lte: untilUnix },
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });
    sessions.push(...list.data);
    if (!list.has_more) break;
    startingAfter = list.data[list.data.length - 1]?.id;
  }

  const invoices: Stripe.Invoice[] = [];
  startingAfter = undefined;
  for (let page = 0; page < 10; page++) {
    const list = await stripe.invoices.list({
      customer: customerId,
      limit: 100,
      created: { gte: listCreatedGte, lte: untilUnix },
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });
    invoices.push(...list.data);
    if (!list.has_more) break;
    startingAfter = list.data[list.data.length - 1]?.id;
  }

  const paymentIntents: Stripe.PaymentIntent[] = [];
  startingAfter = undefined;
  for (let page = 0; page < 10; page++) {
    const list = await stripe.paymentIntents.list({
      customer: customerId,
      limit: 100,
      created: { gte: sinceUnix, lte: untilUnix },
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });
    paymentIntents.push(...list.data);
    if (!list.has_more) break;
    startingAfter = list.data[list.data.length - 1]?.id;
  }

  console.log(
    JSON.stringify(
      {
        member: redactUserIdForLogs(user.id),
        email: redactEmailForLogs(user.email),
        stripeCustomer: redactStripeId(customerId),
        window: { since: sinceKey, until: untilKey },
        dbGiftsOwned: dbRecords.length,
        dbGiftsInWindow: dbRecords.filter((r) => inRange(r.givenOn)).length,
      },
      null,
      2,
    ),
  );

  for (const session of sessions) {
    const checkoutSettlement = await resolveCheckoutSessionSettlement(stripe, session);
    const paidAtUnix =
    checkoutSettlement.status === "verified" ? checkoutSettlement.paidAtUnix : null;
    const givenOn =
      checkoutSettlement.status === "verified"
        ? giftDateKeyFromUnixSeconds(checkoutSettlement.paidAtUnix)
        : session.mode === "payment" && session.payment_status === "paid"
          ? "unknown_paid_at"
          : giftGivenOnFromCheckoutSession(session);
    const skip = classifyCheckoutSkip(session);
    const existing =
      session.id && dbRecords.length
        ? dbRecords.find((row) => row.stripeSessionId === session.id) ?? null
        : session.id
          ? await prisma.givingRecord.findUnique({ where: { stripeSessionId: session.id } }).catch(() => null)
          : null;
    console.log(
      JSON.stringify({
        kind: "checkout_session",
        stripeId: redactStripeId(session.id),
        mode: session.mode,
        payment_status: session.payment_status,
        status: session.status,
        amountUsd: (session.amount_total ?? 0) / 100,
        givenOn,
        inWindow: givenOn !== "unknown_paid_at" && inRange(givenOn),
        paidAtKnown: Boolean(paidAtUnix),
        settlementSource: checkoutSettlement.status === "verified" ? checkoutSettlement.source : null,
        skipReason: skip ?? (existing ? "already_in_db" : null),
        dbUserId: existing?.userId ? redactUserIdForLogs(existing.userId) : null,
        dbOwnedByMember: existing?.userId === user.id,
        client_reference_id: session.client_reference_id
          ? redactUserIdForLogs(session.client_reference_id)
          : null,
        metaUserId: session.metadata?.userId ? redactUserIdForLogs(session.metadata.userId) : null,
        fund: session.metadata?.fund ?? null,
      }),
    );
  }

  for (const invoice of invoices) {
    const extra = await invoiceMeta(invoice);
    const invPaidUnix = stripeInvoiceSettlementPaidAtUnix(invoice);
    const givenOn = stripeInvoicePaidAtUnknown(invoice)
      ? "unknown_paid_at"
      : invPaidUnix
        ? giftDateKeyFromUnixSeconds(invPaidUnix)
        : giftGivenOnFromInvoice(invoice);
    const existing =
      dbRecords.length > 0
        ? dbRecords.find((row) => row.stripeInvoiceId === invoice.id) ?? null
        : await prisma.givingRecord.findUnique({ where: { stripeInvoiceId: invoice.id } }).catch(() => null);
    let skip: string | null = null;
    if (stripeInvoicePaidAtUnknown(invoice)) skip = "paid_at_unknown";
    else if (!stripeObjectInPaidWindow(invPaidUnix, sinceUnix, untilUnix)) {
      skip = "outside_paid_window";
    } else if (invoice.status !== "paid") skip = `invoice_status_${invoice.status}`;
    else if (!isEligibleReconcileGiftInvoice(invoice)) skip = "invoice_not_eligible_refund";
    else if (!isShanahGivingInvoiceMetadata(extra)) skip = "not_shanah_invoice_metadata";
    else if (existing) skip = "already_in_db";

    console.log(
      JSON.stringify({
        kind: "invoice",
        stripeId: redactStripeId(invoice.id),
        status: invoice.status,
        billing_reason: invoice.billing_reason,
        amountPaidUsd: (invoice.amount_paid ?? 0) / 100,
        givenOn,
        inWindow: givenOn !== "unknown_paid_at" && inRange(givenOn),
        paidAtKnown: Boolean(invPaidUnix) && !stripeInvoicePaidAtUnknown(invoice),
        skipReason: skip,
        dbUserId: existing?.userId ? redactUserIdForLogs(existing.userId) : null,
        dbOwnedByMember: existing?.userId === user.id,
        fund: extra.fund ?? null,
        metaUserId: extra.userId ? redactUserIdForLogs(extra.userId) : null,
      }),
    );
  }

  for (const pi of paymentIntents) {
    console.log(
      JSON.stringify({
        kind: "payment_intent",
        stripeId: redactStripeId(pi.id),
        status: pi.status,
        amountUsd: (pi.amount ?? 0) / 100,
        created: new Date((pi.created ?? 0) * 1000).toISOString().slice(0, 10),
        checkoutSession: pi.metadata?.checkoutSessionId
          ? redactStripeId(pi.metadata.checkoutSessionId)
          : null,
      }),
    );
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
