import type Stripe from "stripe";
import { getUserById } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { getMemberStripeCustomerId } from "@/lib/giving-stripe-member-sync";
import {
  getGivingRecordByStripeInvoiceId,
  getGivingRecordByStripeSessionId,
} from "@/lib/giving-server";
import {
  giftGivenOnFromCheckoutSession,
  giftGivenOnFromInvoice,
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
import {
  stripeInvoicePaidAtUnix,
  stripeListCreatedGteWithPaidAtLookback,
  stripeObjectInPaidWindow,
} from "@/lib/giving-stripe-paid-at";
import { redactEmailForLogs, redactStripeId, redactUserIdForLogs } from "@/lib/giving-privacy-redact";
import { getStripe, isStripeGivingConfigured } from "@/lib/stripe-server";
import { useDatabase } from "@/lib/use-database";

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
  paidAtIso: string;
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
  stripeCustomerId: string | null;
  window: { since: string; until: string };
  dbOwnedGiftCount: number;
  dbOwnedGiftsInWindow: number;
  items: MemberStripeReconciliationItem[];
  summary: {
    stripePaidEligibleMissingFromMember: number;
    stripeAlreadyInDbForMember: number;
    skippedNotEligible: number;
  };
};

const RECONCILE_MAX_PAGES = 15;

function parseDateWindow(since: string, until: string) {
  const sinceUnix = Math.floor(new Date(`${since}T00:00:00.000Z`).getTime() / 1000);
  const untilUnix = Math.floor(new Date(`${until}T23:59:59.999Z`).getTime() / 1000);
  return { sinceUnix, untilUnix };
}

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
  existing: { userId: string | null } | null,
  memberId: string,
): MemberReconcileDbState {
  if (!existing) return "missing";
  if (!existing.userId) return "orphan";
  if (existing.userId === memberId) return "owned_by_member";
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
  invoice: Stripe.Invoice,
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

function classifyCheckoutSession(
  session: Stripe.Checkout.Session,
  member: { id: string; email: string },
  memberCustomerId: string | null,
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
  if (!isPaidCheckoutSession(session)) {
    return { skipReason: `payment_status_${session.payment_status}`, ownerConflict };
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
  const paidAtUnix = stripeInvoicePaidAtUnix(invoice);
  if (!stripeObjectInPaidWindow(paidAtUnix, sinceUnix, untilUnix)) {
    return {
      skipReason: "outside_paid_window",
      ownerConflict: stripeInvoiceMetadataOwnerConflict(invoice, extra, member),
    };
  }
  const ownerConflict = stripeInvoiceMetadataOwnerConflict(invoice, extra, member);
  if (ownerConflict.conflict) {
    return { skipReason: ownerConflict.reason, ownerConflict };
  }
  if (invoice.status !== "paid" || (invoice.amount_paid ?? 0) <= 0) {
    return { skipReason: `invoice_status_${invoice.status ?? "unknown"}`, ownerConflict };
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

  const since = input.since ?? "2026-10-01";
  const until = input.until ?? "2026-10-31";
  const { sinceUnix, untilUnix } = parseDateWindow(since, until);

  const memberRow = await getUserById(input.memberUserId);
  if (!memberRow) {
    throw new Error("Member not found.");
  }

  const member = { id: memberRow.id, email: memberRow.email };
  const memberCustomerId = await getMemberStripeCustomerId(member.id);
  if (!memberCustomerId) {
    throw new Error("Member has no linked stripeCustomerId.");
  }

  const stripe = getStripe();
  const listCreatedGte = stripeListCreatedGteWithPaidAtLookback(sinceUnix);
  const items: MemberStripeReconciliationItem[] = [];

  let startingAfter: string | undefined;
  for (let page = 0; page < RECONCILE_MAX_PAGES; page++) {
    const list = await stripe.checkout.sessions.list({
      customer: memberCustomerId,
      limit: 100,
      created: { gte: listCreatedGte, lte: untilUnix },
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });
    for (const session of list.data) {
      const givenOn = giftGivenOnFromCheckoutSession(session);
      const inWindow = inDateKeyWindow(givenOn, since, until);
      const { skipReason, ownerConflict } = classifyCheckoutSession(session, member, memberCustomerId);
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
        stripeId: redactStripeId(session.id),
        paidAtIso: new Date((session.status_transitions?.paid_at ?? session.created ?? 0) * 1000).toISOString(),
        givenOn,
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
    if (!list.has_more) break;
    startingAfter = list.data[list.data.length - 1]?.id;
  }

  startingAfter = undefined;
  for (let page = 0; page < RECONCILE_MAX_PAGES; page++) {
    const list = await stripe.invoices.list({
      customer: memberCustomerId,
      limit: 100,
      created: { gte: listCreatedGte, lte: untilUnix },
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });
    for (const invoice of list.data) {
      const extra = await invoiceMetadataForMemberReconcile(invoice);
      const givenOn = giftGivenOnFromInvoice(invoice);
      const inWindow = inDateKeyWindow(givenOn, since, until);
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
        stripeId: redactStripeId(invoice.id),
        paidAtIso: new Date(stripeInvoicePaidAtUnix(invoice) * 1000).toISOString(),
        givenOn,
        amountUsd: Math.round(invoice.amount_paid ?? 0) / 100,
        stripeStatus: invoice.status ?? "unknown",
        inWindow,
        dbState,
        skipReason: finalSkip,
        proposedSecureLinkage: proposedLinkageForInvoice(
          invoice,
          extra,
          member,
          ownerConflict,
          finalSkip,
          dbState,
        ),
        fund: extra.fund,
        billingReason: invoice.billing_reason ?? undefined,
      });
    }
    if (!list.has_more) break;
    startingAfter = list.data[list.data.length - 1]?.id;
  }

  startingAfter = undefined;
  for (let page = 0; page < RECONCILE_MAX_PAGES; page++) {
    const list = await stripe.paymentIntents.list({
      customer: memberCustomerId,
      limit: 100,
      created: { gte: sinceUnix, lte: untilUnix },
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });
    for (const pi of list.data) {
      const createdKey = new Date((pi.created ?? 0) * 1000).toISOString().slice(0, 10);
      items.push({
        kind: "payment_intent",
        stripeId: redactStripeId(pi.id),
        paidAtIso: new Date((pi.created ?? 0) * 1000).toISOString(),
        givenOn: createdKey,
        amountUsd: Math.round(pi.amount ?? 0) / 100,
        stripeStatus: pi.status,
        inWindow: inDateKeyWindow(createdKey, since, until),
        dbState: "missing",
        skipReason: "payment_intent_requires_session_or_invoice_match",
        proposedSecureLinkage: "record_via_checkout_or_invoice_pipeline_only",
      });
    }
    if (!list.has_more) break;
    startingAfter = list.data[list.data.length - 1]?.id;
  }

  const ownedDbRows = await prisma.givingRecord.findMany({
    where: { userId: member.id, source: "stripe" },
    select: { givenOn: true },
  });
  const dbOwnedGiftCount = ownedDbRows.length;
  const dbOwnedGiftsInWindow = ownedDbRows.filter((row) =>
    inDateKeyWindow(row.givenOn, since, until),
  ).length;
  const stripePaidEligibleMissingFromMember = items.filter(
    (row) =>
      row.inWindow &&
      row.dbState === "missing" &&
      (row.kind === "checkout_session" || row.kind === "invoice") &&
      !row.skipReason,
  ).length;

  return {
    dryRun: true as const,
    memberUserId: redactUserIdForLogs(member.id),
    memberEmail: redactEmailForLogs(member.email),
    stripeCustomerId: redactStripeId(memberCustomerId),
    window: { since, until },
    dbOwnedGiftCount,
    dbOwnedGiftsInWindow,
    items: items.filter((row) => row.inWindow || row.kind === "payment_intent"),
    summary: {
      stripePaidEligibleMissingFromMember,
      stripeAlreadyInDbForMember: dbOwnedGiftsInWindow,
      skippedNotEligible: items.filter((row) => row.inWindow && row.skipReason && row.dbState === "missing")
        .length,
    },
  } satisfies MemberStripeReconciliationReport;
}
