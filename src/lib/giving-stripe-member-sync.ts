import type Stripe from "stripe";
import type { PublicMember } from "@/lib/auth-types";
import { prisma } from "@/lib/db";
import { useDatabase } from "@/lib/use-database";
import {
  recordGiftFromCheckoutSession,
  recordGiftFromInvoice,
} from "@/lib/giving-checkout-server";
import {
  getGivingRecordByStripeInvoiceId,
  getGivingRecordByStripeSessionId,
  updateGivingRecord,
} from "@/lib/giving-server";
import {
  canLinkGivingRecordToMember,
  isShanahGivingCheckoutSession,
  isShanahGivingInvoiceMetadata,
} from "@/lib/giving-stripe-eligibility";
import { resolveStripeCustomerId, resolveStripeInvoiceSubscriptionId } from "@/lib/giving-stripe-invoice";
import {
  isEligibleReconcileGiftInvoice,
  isPaidCheckoutSession,
} from "@/lib/giving-reconcile-server";
import { getStripe, isStripeGivingConfigured } from "@/lib/stripe-server";
import {
  createMemberStripeSyncRun,
  flagStripeMemberSyncForFinanceReview,
  loadMemberStripeSyncState,
} from "@/lib/giving-stripe-member-sync-audit";
import {
  checkoutSessionEligibleForMemberSync,
  MEMBER_STRIPE_SYNC_DAYS,
  MEMBER_STRIPE_SYNC_MAX_PAGES,
  MEMBER_STRIPE_SYNC_PAGE_LIMIT,
  MEMBER_STRIPE_SYNC_TIMEOUT_MS,
  shouldAttemptMemberStripeSync,
  stripeCheckoutMetadataOwnerConflict,
  stripeCustomerVerifiedForMember,
  stripeInvoiceMetadataOwnerConflict,
  isStripeMemberSyncTimeoutError,
  type MemberStripeSyncTrigger,
} from "@/lib/giving-stripe-member-sync-policy";

export { checkoutSessionEligibleForMemberSync } from "@/lib/giving-stripe-member-sync-policy";

export async function getMemberStripeCustomerId(userId: string) {
  if (!useDatabase()) return null;
  const row = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true },
  });
  return row?.stripeCustomerId?.trim() || null;
}

async function withStripeMemberSyncTimeout<T>(promise: Promise<T>) {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("stripe_member_sync_timeout")), MEMBER_STRIPE_SYNC_TIMEOUT_MS);
    }),
  ]);
}

async function invoiceMetadataForSync(invoice: Stripe.Invoice) {
  let extraMetadata: Record<string, string> = { ...(invoice.metadata ?? {}) };
  const subscriptionId = resolveStripeInvoiceSubscriptionId(invoice);
  if (subscriptionId && isStripeGivingConfigured()) {
    try {
      const subscription = await withStripeMemberSyncTimeout(
        getStripe().subscriptions.retrieve(subscriptionId),
      );
      extraMetadata = { ...subscription.metadata, ...extraMetadata };
    } catch {
      return null;
    }
  }
  return extraMetadata;
}

function invoiceEligibleForVerifiedMemberSync(
  invoice: Stripe.Invoice,
  extraMetadata: Record<string, string>,
  member: { id: string; email: string },
  memberStripeCustomerId: string,
) {
  const paymentCustomer = resolveStripeCustomerId(invoice.customer);
  if (!stripeCustomerVerifiedForMember(paymentCustomer, memberStripeCustomerId)) {
    return { eligible: false as const, conflict: null };
  }
  const conflict = stripeInvoiceMetadataOwnerConflict(invoice, extraMetadata, member);
  if (conflict.conflict) {
    return { eligible: false as const, conflict };
  }
  return { eligible: true as const, conflict: null };
}

async function tryClaimOrphanForMember(
  record: Awaited<ReturnType<typeof getGivingRecordByStripeSessionId>>,
  member: Pick<PublicMember, "id" | "email">,
) {
  if (!record || record.userId) return false;
  if (!canLinkGivingRecordToMember(record, member)) return false;
  await updateGivingRecord(record.id, { userId: member.id });
  return true;
}

export type MemberStripeSyncResult = {
  recorded: number;
  linked: number;
  flagged: number;
  skipped: number;
  status: "ok" | "skipped_cooldown" | "stripe_error" | "timeout" | "partial" | "noop";
};

async function runVerifiedStripeGiftSync(
  member: Pick<PublicMember, "id" | "email" | "name" | "campusId">,
): Promise<MemberStripeSyncResult> {
  const empty: MemberStripeSyncResult = {
    recorded: 0,
    linked: 0,
    flagged: 0,
    skipped: 0,
    status: "noop",
  };

  if (!isStripeGivingConfigured() || !useDatabase()) return empty;

  const customerId = await getMemberStripeCustomerId(member.id);
  if (!customerId) return empty;

  const stripe = getStripe();
  const sinceUnix = Math.floor((Date.now() - MEMBER_STRIPE_SYNC_DAYS * 86_400_000) / 1000);
  let recorded = 0;
  let linked = 0;
  let flagged = 0;
  let skipped = 0;
  let partial = false;

  let sessionStartingAfter: string | undefined;
  for (let page = 0; page < MEMBER_STRIPE_SYNC_MAX_PAGES; page++) {
    let list: Stripe.ApiList<Stripe.Checkout.Session>;
    try {
      list = await withStripeMemberSyncTimeout(
        stripe.checkout.sessions.list({
          customer: customerId,
          limit: MEMBER_STRIPE_SYNC_PAGE_LIMIT,
          created: { gte: sinceUnix },
          ...(sessionStartingAfter ? { starting_after: sessionStartingAfter } : {}),
        }),
      );
    } catch {
      partial = true;
      break;
    }

    if (list.data.length === 0) break;

    for (const session of list.data) {
      if (!isPaidCheckoutSession(session) || !isShanahGivingCheckoutSession(session)) continue;

      const ownerConflict = stripeCheckoutMetadataOwnerConflict(session, member);
      if (ownerConflict.conflict) {
        skipped += 1;
        const flaggedRow = await flagStripeMemberSyncForFinanceReview({
          userId: member.id,
          stripeSessionId: session.id,
          reason: ownerConflict.reason,
          metadataUserId: ownerConflict.metadataUserId,
          clientReferenceId: ownerConflict.clientReferenceId,
        });
        if (flaggedRow) flagged += 1;
        continue;
      }

      if (!checkoutSessionEligibleForMemberSync(session, member, customerId)) {
        skipped += 1;
        continue;
      }

      const existing = await getGivingRecordByStripeSessionId(session.id);
      if (!existing) {
        const created = await recordGiftFromCheckoutSession(session);
        if (created) recorded += 1;
        else skipped += 1;
        continue;
      }
      if (await tryClaimOrphanForMember(existing, member)) {
        linked += 1;
      }
    }

    if (!list.has_more) break;
    sessionStartingAfter = list.data[list.data.length - 1]?.id;
  }

  let invoiceStartingAfter: string | undefined;
  for (let page = 0; page < MEMBER_STRIPE_SYNC_MAX_PAGES; page++) {
    let list: Stripe.ApiList<Stripe.Invoice>;
    try {
      list = await withStripeMemberSyncTimeout(
        stripe.invoices.list({
          customer: customerId,
          limit: MEMBER_STRIPE_SYNC_PAGE_LIMIT,
          created: { gte: sinceUnix },
          ...(invoiceStartingAfter ? { starting_after: invoiceStartingAfter } : {}),
        }),
      );
    } catch {
      partial = true;
      break;
    }

    if (list.data.length === 0) break;

    for (const invoice of list.data) {
      const extraMetadata = await invoiceMetadataForSync(invoice);
      if (!extraMetadata) {
        partial = true;
        continue;
      }
      if (!isEligibleReconcileGiftInvoice(invoice) || !isShanahGivingInvoiceMetadata(extraMetadata)) {
        continue;
      }

      const eligibility = invoiceEligibleForVerifiedMemberSync(
        invoice,
        extraMetadata,
        member,
        customerId,
      );
      if (!eligibility.eligible) {
        if (eligibility.conflict?.conflict) {
          skipped += 1;
          const flaggedRow = await flagStripeMemberSyncForFinanceReview({
            userId: member.id,
            stripeInvoiceId: invoice.id,
            reason: eligibility.conflict.reason,
            metadataUserId: eligibility.conflict.metadataUserId,
            clientReferenceId: eligibility.conflict.clientReferenceId,
          });
          if (flaggedRow) flagged += 1;
        } else {
          skipped += 1;
        }
        continue;
      }

      const existing = await getGivingRecordByStripeInvoiceId(invoice.id);
      if (!existing) {
        const created = await recordGiftFromInvoice(invoice, extraMetadata);
        if (created) recorded += 1;
        else skipped += 1;
        continue;
      }
      if (await tryClaimOrphanForMember(existing, member)) {
        linked += 1;
      }
    }

    if (!list.has_more) break;
    invoiceStartingAfter = list.data[list.data.length - 1]?.id;
  }

  return {
    recorded,
    linked,
    flagged,
    skipped,
    status: partial ? "partial" : "ok",
  };
}

/**
 * Safe entry point for sign-in and history: cooldown, timeout isolation, audit row.
 * Never throws to callers.
 */
export async function scheduleVerifiedStripeGiftsForMember(
  member: Pick<PublicMember, "id" | "email" | "name" | "campusId">,
  trigger: MemberStripeSyncTrigger,
): Promise<MemberStripeSyncResult> {
  const noop: MemberStripeSyncResult = {
    recorded: 0,
    linked: 0,
    flagged: 0,
    skipped: 0,
    status: "noop",
  };

  if (!isStripeGivingConfigured() || !useDatabase()) return noop;

  const startedAt = new Date();
  try {
    const state = await loadMemberStripeSyncState(member.id);
    const decision = shouldAttemptMemberStripeSync({
      nowMs: startedAt.getTime(),
      lastAttemptAtMs: state.lastAttemptAt?.getTime() ?? null,
      lastSuccessAtMs: state.lastSuccessAt?.getTime() ?? null,
      consecutiveFailures: state.consecutiveFailures,
      trigger,
    });

    if (!decision.run) {
      const finishedAt = new Date();
      await createMemberStripeSyncRun({
        userId: member.id,
        trigger,
        status: "skipped_cooldown",
        recorded: 0,
        linked: 0,
        flagged: 0,
        skipped: 0,
        startedAt,
        finishedAt,
        errorMessage: decision.reason,
      });
      return { ...noop, status: "skipped_cooldown" };
    }

    const outcome = await runVerifiedStripeGiftSync(member);
    const finishedAt = new Date();
    const auditStatus = outcome.status === "partial" ? "partial" : "ok";

    await createMemberStripeSyncRun({
      userId: member.id,
      trigger,
      status: auditStatus,
      recorded: outcome.recorded,
      linked: outcome.linked,
      flagged: outcome.flagged,
      skipped: outcome.skipped,
      startedAt,
      finishedAt,
    });

    return outcome;
  } catch (error) {
    const finishedAt = new Date();
    const timeout = isStripeMemberSyncTimeoutError(error);
    const message = timeout
      ? "stripe_member_sync_timeout"
      : error instanceof Error
        ? error.message.slice(0, 240)
        : "stripe_member_sync_error";

    await createMemberStripeSyncRun({
      userId: member.id,
      trigger,
      status: timeout ? "timeout" : "stripe_error",
      recorded: 0,
      linked: 0,
      flagged: 0,
      skipped: 0,
      startedAt,
      finishedAt,
      errorMessage: message,
    });

    return { ...noop, status: timeout ? "timeout" : "stripe_error" };
  }
}

/** @deprecated Use scheduleVerifiedStripeGiftsForMember — kept for tests importing direct sync. */
export async function syncVerifiedStripeGiftsForMember(
  member: Pick<PublicMember, "id" | "email" | "name" | "campusId">,
) {
  return scheduleVerifiedStripeGiftsForMember(member, "history");
}
