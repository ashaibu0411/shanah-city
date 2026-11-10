import type Stripe from "stripe";
import { getUserById } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { getMemberStripeCustomerId } from "@/lib/giving-stripe-member-sync";
import {
  getGivingRecordByStripeInvoiceId,
  getGivingRecordByStripeSessionId,
} from "@/lib/giving-server";
import { normalizeGivingEmail } from "@/lib/giving-types";
import {
  giftDateKeyFromUnixSeconds,
  isShanahGivingCheckoutSession,
  isShanahGivingInvoiceMetadata,
} from "@/lib/giving-stripe-eligibility";
import { resolveStripeInvoiceSubscriptionId } from "@/lib/giving-stripe-invoice";
import {
  checkoutSessionEligibleForMemberSync,
  stripeCheckoutMetadataOwnerConflict,
  stripeInvoiceMetadataOwnerConflict,
} from "@/lib/giving-stripe-member-sync-policy";
import {
  isEligibleReconcileGiftInvoice,
  isPaidCheckoutSession,
} from "@/lib/giving-reconcile-server";
import { parseGivingReconcileDateWindow } from "@/lib/giving-reconcile-window";
import {
  stripeCheckoutPaidAtUnknown,
  stripeCheckoutSettlementPaidAtUnix,
  stripeInvoicePaidAtUnknown,
  stripeInvoiceSettlementPaidAtUnix,
  stripeListCreatedGteWithPaidAtLookback,
  stripeObjectInPaidWindow,
  stripePaidAtIsoFromUnix,
} from "@/lib/giving-stripe-paid-at";
import { redactEmailForLogs, redactStripeId, redactUserIdForLogs } from "@/lib/giving-privacy-redact";
import { getStripe, isStripeGivingConfigured } from "@/lib/stripe-server";
import { useDatabase } from "@/lib/use-database";

export const MEMBER_RECONCILE_MAX_STRIPE_PAGES = 15;
export const MEMBER_RECONCILE_STRIPE_PAGE_LIMIT = 100;

export type MemberReconcileDbState = "missing" | "owned_by_member" | "owned_by_other" | "orphan";

export type MemberReconcileSecureLinkage =
  | "none"
  | "verified_customer_and_client_reference"
  | "verified_customer_and_metadata_userId"
  | "record_via_checkout_or_invoice_pipeline_only"
  | "finance_review_required"
  | "do_not_reassign_other_member_record";

export type MemberStripeReconciliationItem = {
  kind: "checkout_session" | "invoice" | "payment_intent";
  stripeId: string;
  stripeCustomerId: string;
  paidAtIso: string | null;
  paidAtKnown: boolean;
  givenOn: string;
  amountUsd: number;
  stripeStatus: string;
  inWindow: boolean;
  dbState: MemberReconcileDbState;
  skipReason: string | null;
  proposedSecureLinkage: MemberReconcileSecureLinkage;
  fund?: string;
  mode?: string;
  billingReason?: string;
};

export type MemberStripeReconciliationReport = {
  dryRun: true;
  memberUserId: string;
  memberEmail: string;
  stripeCustomerIdsInvestigated: { stripeCustomerId: string; source: "linked" | "email_lookup" }[];
  window: { since: string; until: string };
  dbOwnedGiftCount: number;
  dbOwnedGiftsInWindow: number;
  stripeScan: {
    complete: boolean;
    truncated: {
      checkoutSessions: boolean;
      invoices: boolean;
      paymentIntents: boolean;
    };
    pagesFetched: {
      checkoutSessions: number;
      invoices: number;
      paymentIntents: number;
    };
    stripeListCreatedGteUnix: number;
    stripeListCreatedLteUnix: number;
  };
  items: MemberStripeReconciliationItem[];
  summary: {
    stripePaidEligibleMissingFromMember: number;
    stripeAlreadyInDbForMember: number;
    skippedNotEligible: number;
    paidAtUnknownCount: number;
    verifiedPaidInWindowOnLinkedCustomer: number;
  };
  investigationNote: string;
};

function inDateKeyWindow(dateKey: string, since: string, until: string) {
  return dateKey >= since && dateKey <= until;
}

async function invoiceMetadataForMemberReconcile(invoice: Stripe.Invoice) {
  let extra: Record<string, string> = { ...(invoice.metadata ?? {}) };
  const subId = resolveStripeInvoiceSubscriptionId(invoice);
  if (subId && isStripeGivingConfigured()) {
    const sub = await getStripe().subscriptions.retrieve(subId);
    extra = { ...sub.metadata, ...extra };
  }
  return extra;
}

function dbStateForRecord(
  existing: { userId?: string | null } | null,
  memberId: string,
): MemberReconcileDbState {
  if (!existing) return "missing";
  const owner = existing.userId ?? null;
  if (!owner) return "orphan";
  if (owner === memberId) return "owned_by_member";
  return "owned_by_other";
}

function proposedLinkageForCheckout(
  session: Stripe.Checkout.Session,
  member: { id: string; email: string },
  memberCustomerId: string | null,
  ownerConflict: ReturnType<typeof stripeCheckoutMetadataOwnerConflict>,
  skipReason: string | null,
  dbState: MemberReconcileDbState,
): MemberReconcileSecureLinkage {
  if (dbState === "owned_by_other") return "do_not_reassign_other_member_record";
  if (ownerConflict.conflict) return "finance_review_required";
  if (skipReason) return "none";
  const ref = session.client_reference_id?.trim();
  const metaUser = session.metadata?.userId?.trim();
  if (
    checkoutSessionEligibleForMemberSync(session, member, memberCustomerId) &&
    (ref === member.id || metaUser === member.id)
  ) {
    return ref === member.id
      ? "verified_customer_and_client_reference"
      : "verified_customer_and_metadata_userId";
  }
  return "record_via_checkout_or_invoice_pipeline_only";
}

function proposedLinkageForInvoice(
  extra: Record<string, string>,
  member: { id: string },
  ownerConflict: ReturnType<typeof stripeInvoiceMetadataOwnerConflict>,
  skipReason: string | null,
  dbState: MemberReconcileDbState,
): MemberReconcileSecureLinkage {
  if (dbState === "owned_by_other") return "do_not_reassign_other_member_record";
  if (ownerConflict.conflict) return "finance_review_required";
  if (skipReason) return "none";
  const metaUser = extra.userId?.trim();
  if (metaUser === member.id) return "verified_customer_and_metadata_userId";
  return "record_via_checkout_or_invoice_pipeline_only";
}

function checkoutPaidAtContext(session: Stripe.Checkout.Session) {
  if (stripeCheckoutPaidAtUnknown(session)) {
    return { paidAtKnown: false, paidAtUnix: null, givenOn: "unknown_paid_at" as const };
  }
  const paidAtUnix = stripeCheckoutSettlementPaidAtUnix(session);
  if (paidAtUnix) {
    return { paidAtKnown: true, paidAtUnix, givenOn: giftDateKeyFromUnixSeconds(paidAtUnix) };
  }
  return { paidAtKnown: false, paidAtUnix: null, givenOn: "not_paid" as const };
}

function invoicePaidAtContext(invoice: Stripe.Invoice) {
  if (stripeInvoicePaidAtUnknown(invoice)) {
    return { paidAtKnown: false, paidAtUnix: null, givenOn: "unknown_paid_at" as const };
  }
  const paidAtUnix = stripeInvoiceSettlementPaidAtUnix(invoice);
  if (paidAtUnix) {
    return { paidAtKnown: true, paidAtUnix, givenOn: giftDateKeyFromUnixSeconds(paidAtUnix) };
  }
  return { paidAtKnown: false, paidAtUnix: null, givenOn: "not_paid" as const };
}

function classifyCheckoutSession(
  session: Stripe.Checkout.Session,
  member: { id: string; email: string },
  memberCustomerId: string | null,
  sinceUnix: number,
  untilUnix: number,
) {
  const ownerConflict = stripeCheckoutMetadataOwnerConflict(session, member);
  if (ownerConflict.conflict) {
    return { skipReason: ownerConflict.reason, ownerConflict };
  }
  if (session.mode === "subscription") {
    return { skipReason: "subscription_checkout_use_invoice", ownerConflict };
  }
  if (session.mode !== "payment") {
    return { skipReason: `checkout_mode_${session.mode ?? "unknown"}`, ownerConflict };
  }
  if (stripeCheckoutPaidAtUnknown(session)) {
    return { skipReason: "paid_at_unknown", ownerConflict };
  }
  if (!isPaidCheckoutSession(session)) {
    return { skipReason: `payment_status_${session.payment_status}`, ownerConflict };
  }
  const settlement = stripeCheckoutSettlementPaidAtUnix(session);
  if (!stripeObjectInPaidWindow(settlement, sinceUnix, untilUnix)) {
    return { skipReason: "outside_paid_window", ownerConflict };
  }
  if (!isShanahGivingCheckoutSession(session)) {
    return { skipReason: "not_shanah_checkout", ownerConflict };
  }
  if (!checkoutSessionEligibleForMemberSync(session, member, memberCustomerId)) {
    return { skipReason: "unauthorized_session", ownerConflict };
  }
  return { skipReason: null, ownerConflict };
}

function classifyInvoice(
  invoice: Stripe.Invoice,
  extra: Record<string, string>,
  member: { id: string },
  memberCustomerId: string | null,
  sinceUnix: number,
  untilUnix: number,
) {
  const ownerConflict = stripeInvoiceMetadataOwnerConflict(invoice, extra, member);
  if (ownerConflict.conflict) {
    return { skipReason: ownerConflict.reason, ownerConflict };
  }
  if (invoice.status !== "paid" || (invoice.amount_paid ?? 0) <= 0) {
    return { skipReason: `invoice_status_${invoice.status ?? "unknown"}`, ownerConflict };
  }
  if (stripeInvoicePaidAtUnknown(invoice)) {
    return { skipReason: "paid_at_unknown", ownerConflict };
  }
  const settlement = stripeInvoiceSettlementPaidAtUnix(invoice);
  if (!stripeObjectInPaidWindow(settlement, sinceUnix, untilUnix)) {
    return { skipReason: "outside_paid_window", ownerConflict };
  }
  if (!isEligibleReconcileGiftInvoice(invoice)) {
    return { skipReason: "invoice_not_eligible_refund", ownerConflict };
  }
  if (!isShanahGivingInvoiceMetadata(extra)) {
    return { skipReason: "not_shanah_invoice_metadata", ownerConflict };
  }
  if (!memberCustomerId) {
    return { skipReason: "member_stripe_customer_missing", ownerConflict };
  }
  return { skipReason: null, ownerConflict };
}

async function paginateStripe<T extends { id: string }>(
  maxPages: number,
  fetchPage: (startingAfter?: string) => Promise<Stripe.ApiList<T>>,
) {
  const rows: T[] = [];
  let startingAfter: string | undefined;
  let pagesFetched = 0;
  let truncated = false;

  for (let page = 0; page < maxPages; page++) {
    const list = await fetchPage(startingAfter);
    pagesFetched += 1;
    rows.push(...list.data);
    if (!list.has_more) break;
    if (page === maxPages - 1) {
      truncated = true;
      break;
    }
    startingAfter = list.data[list.data.length - 1]?.id;
  }

  return { rows, pagesFetched, truncated };
}

async function discoverStripeCustomerIds(member: { email: string }, linkedCustomerId: string) {
  const stripe = getStripe();
  const discovered = new Map<string, "linked" | "email_lookup">();
  discovered.set(linkedCustomerId, "linked");

  const email = normalizeGivingEmail(member.email);
  if (email) {
    const byEmail = await stripe.customers.list({ email, limit: 10 });
    for (const customer of byEmail.data) {
      if (!customer.id || customer.id === linkedCustomerId) continue;
      discovered.set(customer.id, "email_lookup");
    }
  }

  return [...discovered.entries()].map(([id, source]) => ({
    id,
    source,
    redacted: redactStripeId(id) ?? "redacted",
  }));
}

async function scanCustomerStripeActivity(options: {
  stripeCustomerId: string;
  customerRedacted: string;
  member: { id: string; email: string };
  memberCustomerId: string;
  since: string;
  until: string;
  sinceUnix: number;
  untilUnix: number;
  listCreatedGte: number;
  items: MemberStripeReconciliationItem[];
  pageStats: MemberStripeReconciliationReport["stripeScan"]["pagesFetched"];
  truncated: MemberStripeReconciliationReport["stripeScan"]["truncated"];
}) {
  const stripe = getStripe();
  const {
    stripeCustomerId,
    customerRedacted,
    member,
    memberCustomerId,
    since,
    until,
    sinceUnix,
    untilUnix,
    listCreatedGte,
    items,
    pageStats,
    truncated,
  } = options;

  const sessions = await paginateStripe<Stripe.Checkout.Session>(
    MEMBER_RECONCILE_MAX_STRIPE_PAGES,
    (startingAfter) =>
      stripe.checkout.sessions.list({
        customer: stripeCustomerId,
        limit: MEMBER_RECONCILE_STRIPE_PAGE_LIMIT,
        created: { gte: listCreatedGte, lte: untilUnix },
        ...(startingAfter ? { starting_after: startingAfter } : {}),
      }),
  );
  pageStats.checkoutSessions += sessions.pagesFetched;
  truncated.checkoutSessions ||= sessions.truncated;

  for (const session of sessions.rows) {
    const paidCtx = checkoutPaidAtContext(session);
    const inWindow =
      paidCtx.paidAtKnown && inDateKeyWindow(paidCtx.givenOn, since, until);
    const { skipReason, ownerConflict } = classifyCheckoutSession(
      session,
      member,
      memberCustomerId,
      sinceUnix,
      untilUnix,
    );
    const existing = await getGivingRecordByStripeSessionId(session.id);
    const dbState = dbStateForRecord(existing, member.id);
    const finalSkip =
      dbState === "owned_by_member"
        ? "already_in_db"
        : dbState === "owned_by_other"
          ? "already_in_db_other_member"
          : skipReason;

    items.push({
      kind: "checkout_session",
      stripeId: redactStripeId(session.id) ?? "redacted",
      stripeCustomerId: customerRedacted,
      paidAtIso: stripePaidAtIsoFromUnix(paidCtx.paidAtUnix),
      paidAtKnown: paidCtx.paidAtKnown,
      givenOn: paidCtx.givenOn,
      amountUsd: Math.round(session.amount_total ?? 0) / 100,
      stripeStatus: `${session.mode}:${session.payment_status}:${session.status}`,
      inWindow,
      dbState,
      skipReason: finalSkip,
      proposedSecureLinkage: proposedLinkageForCheckout(
        session,
        member,
        memberCustomerId,
        ownerConflict,
        finalSkip,
        dbState,
      ),
      fund: session.metadata?.fund,
      mode: session.mode ?? undefined,
    });
  }

  const invoices = await paginateStripe<Stripe.Invoice>(MEMBER_RECONCILE_MAX_STRIPE_PAGES, (startingAfter) =>
    stripe.invoices.list({
      customer: stripeCustomerId,
      limit: MEMBER_RECONCILE_STRIPE_PAGE_LIMIT,
      created: { gte: listCreatedGte, lte: untilUnix },
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    }),
  );
  pageStats.invoices += invoices.pagesFetched;
  truncated.invoices ||= invoices.truncated;

  for (const invoice of invoices.rows) {
    const extra = await invoiceMetadataForMemberReconcile(invoice);
    const paidCtx = invoicePaidAtContext(invoice);
    const inWindow = paidCtx.paidAtKnown && inDateKeyWindow(paidCtx.givenOn, since, until);
    const { skipReason, ownerConflict } = classifyInvoice(
      invoice,
      extra,
      member,
      memberCustomerId,
      sinceUnix,
      untilUnix,
    );
    const existing = await getGivingRecordByStripeInvoiceId(invoice.id);
    const dbState = dbStateForRecord(existing, member.id);
    const finalSkip =
      dbState === "owned_by_member"
        ? "already_in_db"
        : dbState === "owned_by_other"
          ? "already_in_db_other_member"
          : skipReason;

    items.push({
      kind: "invoice",
      stripeId: redactStripeId(invoice.id) ?? "redacted",
      stripeCustomerId: customerRedacted,
      paidAtIso: stripePaidAtIsoFromUnix(paidCtx.paidAtUnix),
      paidAtKnown: paidCtx.paidAtKnown,
      givenOn: paidCtx.givenOn,
      amountUsd: Math.round(invoice.amount_paid ?? 0) / 100,
      stripeStatus: invoice.status ?? "unknown",
      inWindow,
      dbState,
      skipReason: finalSkip,
      proposedSecureLinkage: proposedLinkageForInvoice(extra, member, ownerConflict, finalSkip, dbState),
      fund: extra.fund,
      billingReason: invoice.billing_reason ?? undefined,
    });
  }

  const intents = await paginateStripe<Stripe.PaymentIntent>(MEMBER_RECONCILE_MAX_STRIPE_PAGES, (startingAfter) =>
    stripe.paymentIntents.list({
      customer: stripeCustomerId,
      limit: MEMBER_RECONCILE_STRIPE_PAGE_LIMIT,
      created: { gte: sinceUnix, lte: untilUnix },
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    }),
  );
  pageStats.paymentIntents += intents.pagesFetched;
  truncated.paymentIntents ||= intents.truncated;

  for (const pi of intents.rows) {
    const succeeded = pi.status === "succeeded";
    const paidAtUnix = succeeded ? pi.created ?? null : null;
    const givenOn = paidAtUnix ? giftDateKeyFromUnixSeconds(paidAtUnix) : "not_succeeded";
    items.push({
      kind: "payment_intent",
      stripeId: redactStripeId(pi.id) ?? "redacted",
      stripeCustomerId: customerRedacted,
      paidAtIso: stripePaidAtIsoFromUnix(paidAtUnix),
      paidAtKnown: Boolean(succeeded && paidAtUnix),
      givenOn,
      amountUsd: Math.round(pi.amount ?? 0) / 100,
      stripeStatus: pi.status,
      inWindow: succeeded && paidAtUnix ? inDateKeyWindow(givenOn, since, until) : false,
      dbState: "missing",
      skipReason: "payment_intent_requires_session_or_invoice_match",
      proposedSecureLinkage: "record_via_checkout_or_invoice_pipeline_only",
    });
  }
}

/**
 * Read-only Stripe vs DB comparison for one member. No writes, no cross-member reassignment.
 */
export async function buildMemberStripeReconciliationReport(input: {
  memberUserId: string;
  since?: string;
  until?: string;
}) {
  if (!isStripeGivingConfigured()) {
    throw new Error("Stripe is not configured.");
  }
  if (!useDatabase()) {
    throw new Error("Member reconciliation requires the production database.");
  }

  const windowParse = parseGivingReconcileDateWindow(input.since, input.until);
  if (!windowParse.ok) {
    throw new Error(windowParse.message);
  }
  const { since, until, sinceUnix, untilUnix } = windowParse.window;

  const memberRow = await getUserById(input.memberUserId);
  if (!memberRow) {
    throw new Error("Member not found.");
  }

  const member = { id: memberRow.id, email: memberRow.email };
  const memberCustomerId = await getMemberStripeCustomerId(member.id);
  if (!memberCustomerId) {
    throw new Error("Member has no linked stripeCustomerId.");
  }

  const customers = await discoverStripeCustomerIds(member, memberCustomerId);
  const listCreatedGte = stripeListCreatedGteWithPaidAtLookback(sinceUnix);
  const items: MemberStripeReconciliationItem[] = [];
  const pageStats = { checkoutSessions: 0, invoices: 0, paymentIntents: 0 };
  const truncated = { checkoutSessions: false, invoices: false, paymentIntents: false };

  for (const customer of customers) {
    await scanCustomerStripeActivity({
      stripeCustomerId: customer.id,
      customerRedacted: customer.redacted,
      member,
      memberCustomerId,
      since,
      until,
      sinceUnix,
      untilUnix,
      listCreatedGte,
      items,
      pageStats,
      truncated,
    });
  }

  const ownedDbRows = await prisma.givingRecord.findMany({
    where: { userId: member.id, source: "stripe" },
    select: { givenOn: true },
  });
  const dbOwnedGiftCount = ownedDbRows.length;
  const dbOwnedGiftsInWindow = ownedDbRows.filter((row) =>
    inDateKeyWindow(row.givenOn, since, until),
  ).length;

  const visibleItems = items.filter(
    (row) =>
      row.inWindow ||
      row.skipReason === "paid_at_unknown" ||
      (row.kind === "payment_intent" && row.inWindow),
  );

  const linkedCustomerRedacted = redactStripeId(memberCustomerId) ?? "redacted";
  const verifiedPaidInWindowOnLinked = visibleItems.filter(
    (row) =>
      row.stripeCustomerId === linkedCustomerRedacted &&
      row.inWindow &&
      row.paidAtKnown &&
      (row.kind === "checkout_session" || row.kind === "invoice") &&
      row.stripeStatus.includes("paid"),
  ).length;

  const investigationNote =
    verifiedPaidInWindowOnLinked === 0 && customers.length > 1
      ? "No verified paid-at gifts in window on linked customer; additional Stripe customers matched member email (read-only scan). Root-cause statements remain hypotheses until finance confirms Stripe line items."
      : verifiedPaidInWindowOnLinked === 0
        ? "No verified paid-at Shanah gifts in window on investigated Stripe customer(s). Confirm donations used another Stripe customer or missing settlement timestamps (paid_at_unknown)."
        : "Verified paid-at activity found in window; compare skipReason and dbState per line item before any backfill.";

  const stripePaidEligibleMissingFromMember = visibleItems.filter(
    (row) =>
      row.inWindow &&
      row.dbState === "missing" &&
      (row.kind === "checkout_session" || row.kind === "invoice") &&
      !row.skipReason,
  ).length;

  const scanComplete = !truncated.checkoutSessions && !truncated.invoices && !truncated.paymentIntents;

  return {
    dryRun: true as const,
    memberUserId: redactUserIdForLogs(member.id) ?? "redacted",
    memberEmail: redactEmailForLogs(member.email) ?? "redacted",
    stripeCustomerIdsInvestigated: customers.map((row) => ({
      stripeCustomerId: row.redacted,
      source: row.source,
    })),
    window: { since, until },
    dbOwnedGiftCount,
    dbOwnedGiftsInWindow,
    stripeScan: {
      complete: scanComplete,
      truncated,
      pagesFetched: pageStats,
      stripeListCreatedGteUnix: listCreatedGte,
      stripeListCreatedLteUnix: untilUnix,
    },
    items: visibleItems,
    summary: {
      stripePaidEligibleMissingFromMember,
      stripeAlreadyInDbForMember: dbOwnedGiftsInWindow,
      skippedNotEligible: visibleItems.filter(
        (row) => row.inWindow && row.skipReason && row.dbState === "missing",
      ).length,
      paidAtUnknownCount: visibleItems.filter((row) => row.skipReason === "paid_at_unknown").length,
      verifiedPaidInWindowOnLinkedCustomer: verifiedPaidInWindowOnLinked,
    },
    investigationNote,
  } satisfies MemberStripeReconciliationReport;
}
