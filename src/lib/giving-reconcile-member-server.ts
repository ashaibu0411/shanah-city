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
  getMemberReconcileEventBudgetStats,
  resetMemberReconcileEventBudget,
} from "@/lib/giving-stripe-event-budget";
import {
  checkoutSettlementPaidAtUnix,
  resolveCheckoutSessionSettlement,
  resolvePaymentIntentSettlement,
  settlementUnknownMapsToSkipReason,
  type StripeSettlementResolution,
} from "@/lib/giving-stripe-checkout-settlement";
import {
  stripeInvoicePaidAtUnknown,
  stripeInvoiceSettlementPaidAtUnix,
  stripeListCreatedGteWithPaidAtLookback,
  stripeObjectInPaidWindow,
  stripeCreatedAtIsoFromUnix,
  stripePaidAtIsoFromUnix,
} from "@/lib/giving-stripe-paid-at";
import { redactEmailForLogs, redactStripeId, redactUserIdForLogs } from "@/lib/giving-privacy-redact";
import { getStripe, isStripeGivingConfigured } from "@/lib/stripe-server";
import { useDatabase } from "@/lib/use-database";

export const MEMBER_RECONCILE_MAX_STRIPE_PAGES = 15;
export const MEMBER_RECONCILE_STRIPE_PAGE_LIMIT = 100;
export const EMAIL_CUSTOMER_LOOKUP_MAX_PAGES = 5;
export const EMAIL_CUSTOMER_LOOKUP_PAGE_LIMIT = 100;

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
  stripeCreatedAtIso?: string | null;
  chargeCreatedAtIso?: string | null;
  settlementSource?: string | null;
  customerInvestigationSource?: "linked" | "email_lookup";
  paymentSucceededVerified?: boolean;
  successAtVerified?: boolean;
  successDateVerifiability?: "verified" | "unverified" | "not_applicable";
  financeManualDateReviewRecommended?: boolean;
  verifiedStripePaymentRefs?: {
    checkoutSessionId: string | null;
    paymentIntentId: string | null;
    chargeId: string | null;
  };
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
    /** All Stripe list sources fully paginated (sessions, invoices, PIs, email customers). */
    sourceListingComplete: boolean;
    /** True only when source listing is complete and event timestamp lookups were not budget-capped. */
    diagnosticConclusive: boolean;
    complete: boolean;
    successEventLookups: ReturnType<typeof getMemberReconcileEventBudgetStats>;
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
    emailCustomerLookupTruncated: boolean;
    emailCustomerLookupPages: number;
  };
  items: MemberStripeReconciliationItem[];
  summary: {
    stripePaidEligibleMissingFromMember: number;
    stripeAlreadyInDbForMember: number;
    skippedNotEligible: number;
    paidAtUnknownCount: number;
    eventRetentionExpiredCount: number;
    financeReviewSucceededWithoutVerifiedDate: number;
    verifiedPaidInWindowOnLinkedCustomer: number;
  };
  investigationNote: string;
};

function inDateKeyWindow(dateKey: string, since: string, until: string) {
  return dateKey >= since && dateKey <= until;
}

function verifiedStripeRefsFromCheckoutSession(session: Stripe.Checkout.Session) {
  const piRef = session.payment_intent;
  const paymentIntentId =
    typeof piRef === "string" ? piRef : typeof piRef === "object" ? piRef?.id ?? null : null;
  let chargeId: string | null = null;
  if (typeof piRef === "object" && piRef?.latest_charge) {
    const ch = piRef.latest_charge;
    chargeId = typeof ch === "string" ? ch : ch?.id ?? null;
  }
  return {
    checkoutSessionId: redactStripeId(session.id),
    paymentIntentId: paymentIntentId ? redactStripeId(paymentIntentId) : null,
    chargeId: chargeId ? redactStripeId(chargeId) : null,
  };
}

const FINANCE_VISIBLE_SKIP_REASONS = new Set([
  "paid_at_unknown",
  "success_date_event_retention_expired",
  "success_date_lookup_inconclusive",
]);

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
  customerSource: "linked" | "email_lookup",
): MemberReconcileSecureLinkage {
  if (customerSource === "email_lookup") return "finance_review_required";
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
  customerSource: "linked" | "email_lookup",
): MemberReconcileSecureLinkage {
  if (customerSource === "email_lookup") return "finance_review_required";
  if (dbState === "owned_by_other") return "do_not_reassign_other_member_record";
  if (ownerConflict.conflict) return "finance_review_required";
  if (skipReason) return "none";
  const metaUser = extra.userId?.trim();
  if (metaUser === member.id) return "verified_customer_and_metadata_userId";
  return "record_via_checkout_or_invoice_pipeline_only";
}

function checkoutPaidContextFromSettlement(
  session: Stripe.Checkout.Session,
  settlement: StripeSettlementResolution,
) {
  if (settlement.status === "verified") {
    return {
      paidAtKnown: true,
      paidAtUnix: settlement.paidAtUnix,
      givenOn: giftDateKeyFromUnixSeconds(settlement.paidAtUnix),
      settlementSource: settlement.source,
      paymentSucceededVerified: true,
      successAtVerified: true,
      chargeCreatedAtUnix: settlement.chargeCreatedAtUnix,
    };
  }
  if (settlement.status === "success_date_unknown") {
    return {
      paidAtKnown: false,
      paidAtUnix: null,
      givenOn: "unknown_paid_at" as const,
      settlementSource: null,
      paymentSucceededVerified: true,
      successAtVerified: false,
      chargeCreatedAtUnix: settlement.chargeCreatedAtUnix,
    };
  }
  if (session.mode === "payment" && session.payment_status === "paid" && settlement.status === "unknown") {
    return {
      paidAtKnown: false,
      paidAtUnix: null,
      givenOn: "unknown_paid_at" as const,
      settlementSource: null,
      paymentSucceededVerified: false,
      successAtVerified: false,
      chargeCreatedAtUnix: settlement.chargeCreatedAtUnix,
    };
  }
  return {
    paidAtKnown: false,
    paidAtUnix: null,
    givenOn: "not_paid" as const,
    settlementSource: null,
    paymentSucceededVerified: false,
    successAtVerified: false,
    chargeCreatedAtUnix: settlement.chargeCreatedAtUnix ?? null,
  };
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
  settlement: StripeSettlementResolution,
  customerSource: "linked" | "email_lookup",
) {
  const ownerConflict = stripeCheckoutMetadataOwnerConflict(session, member);
  if (ownerConflict.conflict) {
    return { skipReason: ownerConflict.reason, ownerConflict };
  }
  if (customerSource === "email_lookup") {
    return {
      skipReason: "secondary_customer_email_lookup_non_authoritative",
      ownerConflict,
    };
  }
  if (session.mode === "subscription") {
    return { skipReason: "subscription_checkout_use_invoice", ownerConflict };
  }
  if (session.mode !== "payment") {
    return { skipReason: `checkout_mode_${session.mode ?? "unknown"}`, ownerConflict };
  }
  if (!isPaidCheckoutSession(session)) {
    return { skipReason: `payment_status_${session.payment_status}`, ownerConflict };
  }
  if (settlement.status === "success_date_unknown") {
    return {
      skipReason: settlementUnknownMapsToSkipReason(settlement.reason),
      ownerConflict,
    };
  }
  if (settlement.status === "unknown") {
    return { skipReason: "paid_at_unknown", ownerConflict };
  }
  const paidAtUnix = checkoutSettlementPaidAtUnix(settlement);
  if (!stripeObjectInPaidWindow(paidAtUnix, sinceUnix, untilUnix)) {
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
  customerSource: "linked" | "email_lookup",
) {
  const ownerConflict = stripeInvoiceMetadataOwnerConflict(invoice, extra, member);
  if (ownerConflict.conflict) {
    return { skipReason: ownerConflict.reason, ownerConflict };
  }
  if (customerSource === "email_lookup") {
    return {
      skipReason: "secondary_customer_email_lookup_non_authoritative",
      ownerConflict,
    };
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

  let emailLookupTruncated = false;
  let emailLookupPages = 0;
  const email = normalizeGivingEmail(member.email);
  if (email) {
    let startingAfter: string | undefined;
    for (let page = 0; page < EMAIL_CUSTOMER_LOOKUP_MAX_PAGES; page++) {
      const byEmail = await stripe.customers.list({
        email,
        limit: EMAIL_CUSTOMER_LOOKUP_PAGE_LIMIT,
        ...(startingAfter ? { starting_after: startingAfter } : {}),
      });
      emailLookupPages += 1;
      for (const customer of byEmail.data) {
        if (!customer.id || customer.id === linkedCustomerId) continue;
        discovered.set(customer.id, "email_lookup");
      }
      if (!byEmail.has_more) break;
      if (page === EMAIL_CUSTOMER_LOOKUP_MAX_PAGES - 1) {
        emailLookupTruncated = true;
        break;
      }
      startingAfter = byEmail.data[byEmail.data.length - 1]?.id;
    }
  }

  return {
    customers: [...discovered.entries()].map(([id, source]) => ({
      id,
      source,
      redacted: redactStripeId(id) ?? "redacted",
    })),
    emailLookupTruncated,
    emailLookupPages,
  };
}

async function scanCustomerStripeActivity(options: {
  stripeCustomerId: string;
  customerRedacted: string;
  customerSource: "linked" | "email_lookup";
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
    customerSource,
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
    const settlement = await resolveCheckoutSessionSettlement(stripe, session);
    const paidCtx = checkoutPaidContextFromSettlement(session, settlement);
    const inWindow =
      paidCtx.paidAtKnown && inDateKeyWindow(paidCtx.givenOn, since, until);
    const { skipReason, ownerConflict } = classifyCheckoutSession(
      session,
      member,
      memberCustomerId,
      sinceUnix,
      untilUnix,
      settlement,
      customerSource,
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
        customerSource,
      ),
      fund: session.metadata?.fund,
      mode: session.mode ?? undefined,
      stripeCreatedAtIso: stripeCreatedAtIsoFromUnix(session.created ?? null),
      chargeCreatedAtIso: stripeCreatedAtIsoFromUnix(paidCtx.chargeCreatedAtUnix),
      settlementSource: paidCtx.settlementSource ?? null,
      customerInvestigationSource: customerSource,
      paymentSucceededVerified: paidCtx.paymentSucceededVerified,
      successAtVerified: paidCtx.successAtVerified,
      successDateVerifiability: paidCtx.successAtVerified
        ? "verified"
        : paidCtx.paymentSucceededVerified
          ? "unverified"
          : "not_applicable",
      financeManualDateReviewRecommended:
        settlement.status === "success_date_unknown" && settlement.financeManualDateReviewRecommended,
      verifiedStripePaymentRefs: verifiedStripeRefsFromCheckoutSession(session),
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
      customerSource,
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
      proposedSecureLinkage: proposedLinkageForInvoice(
        extra,
        member,
        ownerConflict,
        finalSkip,
        dbState,
        customerSource,
      ),
      fund: extra.fund,
      billingReason: invoice.billing_reason ?? undefined,
      stripeCreatedAtIso: stripeCreatedAtIsoFromUnix(invoice.created ?? null),
      settlementSource: paidCtx.paidAtKnown ? "invoice_paid_at" : null,
      customerInvestigationSource: customerSource,
    });
  }

  const intents = await paginateStripe<Stripe.PaymentIntent>(MEMBER_RECONCILE_MAX_STRIPE_PAGES, (startingAfter) =>
    stripe.paymentIntents.list({
      customer: stripeCustomerId,
      limit: MEMBER_RECONCILE_STRIPE_PAGE_LIMIT,
      created: { gte: sinceUnix, lte: untilUnix },
      expand: ["data.latest_charge"],
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    }),
  );
  pageStats.paymentIntents += intents.pagesFetched;
  truncated.paymentIntents ||= intents.truncated;

  for (const pi of intents.rows) {
    const piSettlement = await resolvePaymentIntentSettlement(stripe, pi);
    const verifiedPaidAt =
      piSettlement.status === "verified" ? piSettlement.paidAtUnix : null;
    const givenOn = verifiedPaidAt
      ? giftDateKeyFromUnixSeconds(verifiedPaidAt)
      : pi.status === "succeeded"
        ? "settlement_unverified"
        : "not_succeeded";
    items.push({
      kind: "payment_intent",
      stripeId: redactStripeId(pi.id) ?? "redacted",
      stripeCustomerId: customerRedacted,
      paidAtIso: stripePaidAtIsoFromUnix(verifiedPaidAt),
      paidAtKnown: verifiedPaidAt != null,
      stripeCreatedAtIso: stripeCreatedAtIsoFromUnix(pi.created ?? null),
      chargeCreatedAtIso: stripeCreatedAtIsoFromUnix(piSettlement.chargeCreatedAtUnix),
      givenOn,
      amountUsd: Math.round(pi.amount ?? 0) / 100,
      stripeStatus: pi.status,
      inWindow: verifiedPaidAt ? inDateKeyWindow(givenOn, since, until) : false,
      dbState: "missing",
      skipReason: "payment_intent_requires_session_or_invoice_match",
      proposedSecureLinkage:
        customerSource === "email_lookup"
          ? "finance_review_required"
          : "record_via_checkout_or_invoice_pipeline_only",
      settlementSource: piSettlement.status === "verified" ? piSettlement.source : null,
      customerInvestigationSource: customerSource,
      paymentSucceededVerified: piSettlement.paymentSucceededVerified,
      successAtVerified: piSettlement.successAtVerified,
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

  resetMemberReconcileEventBudget();
  const discovered = await discoverStripeCustomerIds(member, memberCustomerId);
  const listCreatedGte = stripeListCreatedGteWithPaidAtLookback(sinceUnix);
  const items: MemberStripeReconciliationItem[] = [];
  const pageStats = { checkoutSessions: 0, invoices: 0, paymentIntents: 0 };
  const truncated = { checkoutSessions: false, invoices: false, paymentIntents: false };

  for (const customer of discovered.customers) {
    await scanCustomerStripeActivity({
      stripeCustomerId: customer.id,
      customerRedacted: customer.redacted,
      customerSource: customer.source,
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

  const visibleItems = items.filter((row) => {
    if (row.kind === "payment_intent") {
      return Boolean(row.paymentSucceededVerified) || row.inWindow;
    }
    return (
      row.inWindow ||
      Boolean(row.paymentSucceededVerified) ||
      (row.skipReason != null && FINANCE_VISIBLE_SKIP_REASONS.has(row.skipReason))
    );
  });

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
    verifiedPaidInWindowOnLinked === 0 && discovered.customers.length > 1
      ? "No verified paid-at gifts in window on linked customer; additional Stripe customers matched member email (read-only scan). Root-cause statements remain hypotheses until finance confirms Stripe line items."
      : verifiedPaidInWindowOnLinked === 0
        ? "No verified event-based success timestamps in window. Succeeded payments may still appear with success_date_event_retention_expired (Stripe Events API ~30-day list limit); use verifiedStripePaymentRefs for manual finance verification — not proof of non-payment."
        : "Verified paid-at activity found in window; compare skipReason and dbState per line item before any backfill.";

  const stripePaidEligibleMissingFromMember = visibleItems.filter(
    (row) =>
      row.inWindow &&
      row.dbState === "missing" &&
      (row.kind === "checkout_session" || row.kind === "invoice") &&
      !row.skipReason,
  ).length;

  const eventStats = getMemberReconcileEventBudgetStats();
  const sourceListingComplete =
    !truncated.checkoutSessions &&
    !truncated.invoices &&
    !truncated.paymentIntents &&
    !discovered.emailLookupTruncated;
  const diagnosticConclusive =
    sourceListingComplete && !eventStats.budgetExhausted && eventStats.paginationLimited === 0;

  const financeReviewSucceededWithoutVerifiedDate = visibleItems.filter(
    (row) =>
      (row.kind === "checkout_session" || row.kind === "invoice") &&
      row.paymentSucceededVerified &&
      !row.successAtVerified &&
      row.financeManualDateReviewRecommended,
  ).length;

  return {
    dryRun: true as const,
    memberUserId: redactUserIdForLogs(member.id) ?? "redacted",
    memberEmail: redactEmailForLogs(member.email) ?? "redacted",
    stripeCustomerIdsInvestigated: discovered.customers.map((row) => ({
      stripeCustomerId: row.redacted,
      source: row.source,
    })),
    window: { since, until },
    dbOwnedGiftCount,
    dbOwnedGiftsInWindow,
    stripeScan: {
      sourceListingComplete,
      diagnosticConclusive,
      complete: sourceListingComplete,
      successEventLookups: eventStats,
      truncated,
      pagesFetched: pageStats,
      stripeListCreatedGteUnix: listCreatedGte,
      stripeListCreatedLteUnix: untilUnix,
      emailCustomerLookupTruncated: discovered.emailLookupTruncated,
      emailCustomerLookupPages: discovered.emailLookupPages,
    },
    items: visibleItems,
    summary: {
      stripePaidEligibleMissingFromMember,
      stripeAlreadyInDbForMember: dbOwnedGiftsInWindow,
      skippedNotEligible: visibleItems.filter(
        (row) => row.inWindow && row.skipReason && row.dbState === "missing",
      ).length,
      paidAtUnknownCount: visibleItems.filter((row) => row.skipReason === "paid_at_unknown").length,
      eventRetentionExpiredCount: visibleItems.filter(
        (row) => row.skipReason === "success_date_event_retention_expired",
      ).length,
      financeReviewSucceededWithoutVerifiedDate,
      verifiedPaidInWindowOnLinkedCustomer: verifiedPaidInWindowOnLinked,
    },
    investigationNote,
  } satisfies MemberStripeReconciliationReport;
}
