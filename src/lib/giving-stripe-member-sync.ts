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
import {
  stripeInvoicePaidAtUnknown,
  stripeInvoiceSettlementPaidAtUnix,
  stripeListCreatedGteWithPaidAtLookback,
  stripeObjectInPaidWindow,
} from "@/lib/giving-stripe-paid-at";
import { checkoutSessionHasCorroboratedMemberIdentity } from "@/lib/giving-stripe-checkout-ownership";
import {
  listCheckoutSessionsForPaymentIntent,
  listCustomerlessDualCorroboratedCheckoutSessionsForMember,
  listSucceededPaymentIntentsForCustomer,
} from "@/lib/giving-stripe-checkout-session-lookup";
import { getStripe, isStripeGivingConfigured } from "@/lib/stripe-server";
import {
  createMemberStripeSyncRun,
  flagStripeMemberSyncForFinanceReview,
  loadMemberStripeSyncState,
} from "@/lib/giving-stripe-member-sync-audit";
import { tryAcquireMemberStripeSyncLock } from "@/lib/giving-stripe-member-sync-lock";
import {
  bumpSkipReason,
  emptyMemberStripeSyncReport,
  reportToSyncResult,
  type MemberStripeSyncReport,
} from "@/lib/giving-stripe-member-sync-report";
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

async function invoiceMetadataForSync(invoice: Stripe.Invoice, report: MemberStripeSyncReport) {
  let extraMetadata: Record<string, string> = { ...(invoice.metadata ?? {}) };
  const subscriptionId = resolveStripeInvoiceSubscriptionId(invoice);
  if (subscriptionId && isStripeGivingConfigured()) {
    try {
      const subscription = await withStripeMemberSyncTimeout(
        getStripe().subscriptions.retrieve(subscriptionId),
      );
      extraMetadata = { ...subscription.metadata, ...extraMetadata };
    } catch {
      bumpSkipReason(report, "subscription_metadata_unavailable");
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
    return { eligible: false as const, conflict: null, reason: "customer_mismatch" as const };
  }
  const conflict = stripeInvoiceMetadataOwnerConflict(invoice, extraMetadata, member);
  if (conflict.conflict) {
    return { eligible: false as const, conflict, reason: "metadata_owner_conflict" as const };
  }
  return { eligible: true as const, conflict: null, reason: null };
}

async function tryClaimOrphanForMember(
  record: Awaited<ReturnType<typeof getGivingRecordByStripeSessionId>>,
  member: Pick<PublicMember, "id" | "email">,
  report: MemberStripeSyncReport,
) {
  if (!record) return false;
  if (record.userId === member.id) {
    report.alreadyRecorded += 1;
    return false;
  }
  if (record.userId) {
    bumpSkipReason(report, "already_recorded");
    return false;
  }
  if (!canLinkGivingRecordToMember(record, member)) return false;
  await updateGivingRecord(record.id, { userId: member.id });
  report.linked += 1;
  return true;
}

export type MemberStripeSyncResult = {
  recorded: number;
  linked: number;
  flagged: number;
  skipped: number;
  status:
    | "ok"
    | "skipped_cooldown"
    | "skipped_contention"
    | "stripe_error"
    | "timeout"
    | "partial"
    | "noop";
  skippedReason?: string;
  report?: MemberStripeSyncReport;
  durationMs?: number;
};

async function runVerifiedStripeGiftSync(
  member: Pick<PublicMember, "id" | "email" | "name" | "campusId">,
): Promise<MemberStripeSyncResult & { report: MemberStripeSyncReport }> {
  const report = emptyMemberStripeSyncReport();
  const started = Date.now();
  let partial = false;

  if (!isStripeGivingConfigured() || !useDatabase()) {
    report.durationMs = Date.now() - started;
    return { ...reportToSyncResult(report, "noop"), report };
  }

  const customerId = await getMemberStripeCustomerId(member.id);
  if (!customerId) {
    report.durationMs = Date.now() - started;
    return { ...reportToSyncResult(report, "noop"), report };
  }

  const stripe = getStripe();
  const sinceUnix = Math.floor((Date.now() - MEMBER_STRIPE_SYNC_DAYS * 86_400_000) / 1000);
  const memberSyncCheckoutSessionIds = new Set<string>();

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
    } catch (error) {
      partial = true;
      report.errors.push(error instanceof Error ? error.message.slice(0, 120) : "checkout_list_error");
      break;
    }

    if (list.data.length === 0) break;

    for (const session of list.data) {
      memberSyncCheckoutSessionIds.add(session.id);
      report.scannedCheckoutSessions += 1;
      if (session.mode === "subscription") {
        bumpSkipReason(report, "subscription_checkout_use_invoice");
        continue;
      }
      if (session.mode !== "payment") {
        bumpSkipReason(report, "checkout_mode_unsupported");
        continue;
      }
      if (!isPaidCheckoutSession(session)) {
        bumpSkipReason(report, "not_paid");
        continue;
      }
      report.paidCheckoutSessions += 1;
      if (!isShanahGivingCheckoutSession(session)) {
        bumpSkipReason(report, "not_shanah_checkout");
        continue;
      }

      const ownerConflict = stripeCheckoutMetadataOwnerConflict(session, member);
      if (ownerConflict.conflict) {
        bumpSkipReason(report, "metadata_owner_conflict");
        const flaggedRow = await flagStripeMemberSyncForFinanceReview({
          userId: member.id,
          stripeSessionId: session.id,
          reason: ownerConflict.reason,
          metadataUserId: ownerConflict.metadataUserId,
          clientReferenceId: ownerConflict.clientReferenceId,
        });
        if (flaggedRow) report.flagged += 1;
        continue;
      }

      if (!checkoutSessionEligibleForMemberSync(session, member, customerId)) {
        bumpSkipReason(report, "unauthorized_session");
        continue;
      }
      if (!checkoutSessionHasCorroboratedMemberIdentity(session)) {
        bumpSkipReason(report, "unauthorized_session");
        continue;
      }
      report.eligibleCheckoutSessions += 1;

      const existing = await getGivingRecordByStripeSessionId(session.id);
      if (existing) {
        await tryClaimOrphanForMember(existing, member, report);
        continue;
      }

      const created = await recordGiftFromCheckoutSession(session);
      if (created) {
        report.newlyRecorded += 1;
      } else {
        bumpSkipReason(report, "record_create_failed");
      }
    }

    if (!list.has_more) break;
    sessionStartingAfter = list.data[list.data.length - 1]?.id;
  }

  try {
    const customerless = await withStripeMemberSyncTimeout(
      listCustomerlessDualCorroboratedCheckoutSessionsForMember(stripe, member.id, sinceUnix),
    );
    for (const session of customerless) {
      if (memberSyncCheckoutSessionIds.has(session.id)) continue;
      memberSyncCheckoutSessionIds.add(session.id);
      report.scannedCheckoutSessions += 1;
      report.scannedCustomerlessCheckoutSessions =
        (report.scannedCustomerlessCheckoutSessions ?? 0) + 1;
      if (session.mode === "subscription") {
        bumpSkipReason(report, "subscription_checkout_use_invoice");
        continue;
      }
      if (session.mode !== "payment") {
        bumpSkipReason(report, "checkout_mode_unsupported");
        continue;
      }
      if (!isPaidCheckoutSession(session)) {
        bumpSkipReason(report, "not_paid");
        continue;
      }
      report.paidCheckoutSessions += 1;
      if (!isShanahGivingCheckoutSession(session)) {
        bumpSkipReason(report, "not_shanah_checkout");
        continue;
      }

      const ownerConflict = stripeCheckoutMetadataOwnerConflict(session, member);
      if (ownerConflict.conflict) {
        bumpSkipReason(report, "metadata_owner_conflict");
        const flaggedRow = await flagStripeMemberSyncForFinanceReview({
          userId: member.id,
          stripeSessionId: session.id,
          reason: ownerConflict.reason,
          metadataUserId: ownerConflict.metadataUserId,
          clientReferenceId: ownerConflict.clientReferenceId,
        });
        if (flaggedRow) report.flagged += 1;
        continue;
      }

      if (!checkoutSessionEligibleForMemberSync(session, member, customerId)) {
        bumpSkipReason(report, "unauthorized_session");
        continue;
      }
      if (!checkoutSessionHasCorroboratedMemberIdentity(session)) {
        bumpSkipReason(report, "unauthorized_session");
        continue;
      }
      report.eligibleCheckoutSessions += 1;

      const existing = await getGivingRecordByStripeSessionId(session.id);
      if (existing) {
        await tryClaimOrphanForMember(existing, member, report);
        continue;
      }

      const created = await recordGiftFromCheckoutSession(session);
      if (created) {
        report.newlyRecorded += 1;
      } else {
        bumpSkipReason(report, "record_create_failed");
      }
    }
  } catch (error) {
    partial = true;
    report.errors.push(
      error instanceof Error ? error.message.slice(0, 120) : "customerless_checkout_search_error",
    );
  }

  let piStartingAfter: string | undefined;
  for (let page = 0; page < MEMBER_STRIPE_SYNC_MAX_PAGES; page++) {
    let list: Stripe.ApiList<Stripe.PaymentIntent>;
    try {
      list = await withStripeMemberSyncTimeout(
        listSucceededPaymentIntentsForCustomer(stripe, customerId, sinceUnix, {
          limit: MEMBER_STRIPE_SYNC_PAGE_LIMIT,
          startingAfter: piStartingAfter,
        }),
      );
    } catch (error) {
      partial = true;
      report.errors.push(error instanceof Error ? error.message.slice(0, 120) : "payment_intent_list_error");
      break;
    }

    if (list.data.length === 0) break;

    for (const pi of list.data) {
      if (pi.status !== "succeeded") continue;
      report.scannedPaymentIntents = (report.scannedPaymentIntents ?? 0) + 1;
      let sessions: Stripe.Checkout.Session[];
      try {
        sessions = await withStripeMemberSyncTimeout(
          listCheckoutSessionsForPaymentIntent(stripe, pi.id),
        );
      } catch {
        bumpSkipReason(report, "record_create_failed");
        continue;
      }
      if (sessions.length === 0) continue;

      for (const row of sessions) {
        const session = await stripe.checkout.sessions.retrieve(row.id);
        if (!isPaidCheckoutSession(session) || !isShanahGivingCheckoutSession(session)) continue;
        if (stripeCheckoutMetadataOwnerConflict(session, member).conflict) continue;
        if (!checkoutSessionEligibleForMemberSync(session, member, customerId)) continue;
        if (!checkoutSessionHasCorroboratedMemberIdentity(session)) continue;

        const existing = await getGivingRecordByStripeSessionId(session.id);
        if (existing) {
          await tryClaimOrphanForMember(existing, member, report);
          continue;
        }

        const created = await recordGiftFromCheckoutSession(session);
        if (created) {
          report.newlyRecorded += 1;
          report.recordedPaymentIntents = (report.recordedPaymentIntents ?? 0) + 1;
        }
      }
    }

    if (!list.has_more) break;
    piStartingAfter = list.data[list.data.length - 1]?.id;
  }

  let invoiceStartingAfter: string | undefined;
  for (let page = 0; page < MEMBER_STRIPE_SYNC_MAX_PAGES; page++) {
    let list: Stripe.ApiList<Stripe.Invoice>;
    try {
      list = await withStripeMemberSyncTimeout(
        stripe.invoices.list({
          customer: customerId,
          limit: MEMBER_STRIPE_SYNC_PAGE_LIMIT,
          created: { gte: stripeListCreatedGteWithPaidAtLookback(sinceUnix) },
          ...(invoiceStartingAfter ? { starting_after: invoiceStartingAfter } : {}),
        }),
      );
    } catch (error) {
      partial = true;
      report.errors.push(error instanceof Error ? error.message.slice(0, 120) : "invoice_list_error");
      break;
    }

    if (list.data.length === 0) break;

    for (const invoice of list.data) {
      report.scannedInvoices += 1;
      if (invoice.status !== "paid" || (invoice.amount_paid ?? 0) <= 0) {
        bumpSkipReason(report, "not_paid");
        continue;
      }
      if (stripeInvoicePaidAtUnknown(invoice)) {
        bumpSkipReason(report, "paid_at_unknown");
        continue;
      }
      const paidAtUnix = stripeInvoiceSettlementPaidAtUnix(invoice);
      if (!stripeObjectInPaidWindow(paidAtUnix, sinceUnix)) {
        bumpSkipReason(report, "outside_paid_window");
        continue;
      }
      report.paidInvoices += 1;

      const extraMetadata = await invoiceMetadataForSync(invoice, report);
      if (!extraMetadata) continue;

      if (!isEligibleReconcileGiftInvoice(invoice)) {
        bumpSkipReason(report, "not_eligible_invoice");
        continue;
      }
      if (!isShanahGivingInvoiceMetadata(extraMetadata)) {
        bumpSkipReason(report, "not_shanah_invoice");
        continue;
      }

      const eligibility = invoiceEligibleForVerifiedMemberSync(
        invoice,
        extraMetadata,
        member,
        customerId,
      );
      if (!eligibility.eligible) {
        if (eligibility.reason) bumpSkipReason(report, eligibility.reason);
        if (eligibility.conflict?.conflict) {
          const flaggedRow = await flagStripeMemberSyncForFinanceReview({
            userId: member.id,
            stripeInvoiceId: invoice.id,
            reason: eligibility.conflict.reason,
            metadataUserId: eligibility.conflict.metadataUserId,
            clientReferenceId: eligibility.conflict.clientReferenceId,
          });
          if (flaggedRow) report.flagged += 1;
        }
        continue;
      }
      report.eligibleInvoices += 1;

      const existing = await getGivingRecordByStripeInvoiceId(invoice.id);
      if (existing) {
        await tryClaimOrphanForMember(existing, member, report);
        continue;
      }

      const created = await recordGiftFromInvoice(invoice, extraMetadata);
      if (created) {
        report.newlyRecorded += 1;
      } else {
        bumpSkipReason(report, "record_create_failed");
      }
    }

    if (!list.has_more) break;
    invoiceStartingAfter = list.data[list.data.length - 1]?.id;
  }

  report.durationMs = Date.now() - started;
  const status = partial ? "partial" : "ok";
  return { ...reportToSyncResult(report, status), report, durationMs: report.durationMs };
}

export async function scheduleVerifiedStripeGiftsForMember(
  member: Pick<PublicMember, "id" | "email" | "name" | "campusId">,
  trigger: MemberStripeSyncTrigger,
): Promise<MemberStripeSyncResult> {
  const noop = reportToSyncResult(emptyMemberStripeSyncReport(), "noop");

  if (!isStripeGivingConfigured() || !useDatabase()) return noop;

  const lock = await tryAcquireMemberStripeSyncLock(member.id);
  if (!lock.acquired) {
    return reportToSyncResult(
      emptyMemberStripeSyncReport(),
      "skipped_contention",
      lock.reason,
    );
  }

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
      return reportToSyncResult(emptyMemberStripeSyncReport(), "skipped_cooldown", decision.reason);
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
      metrics: outcome.report as unknown as import("@prisma/client").Prisma.InputJsonValue,
    });

    return outcome;
  } catch (error) {
    const finishedAt = new Date();
    const report = emptyMemberStripeSyncReport();
    report.durationMs = finishedAt.getTime() - startedAt.getTime();
    const timeout = isStripeMemberSyncTimeoutError(error);
    const message = timeout
      ? "stripe_member_sync_timeout"
      : error instanceof Error
        ? error.message.slice(0, 240)
        : "stripe_member_sync_error";
    report.errors.push(message);

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
      metrics: report as unknown as import("@prisma/client").Prisma.InputJsonValue,
    });

    return {
      ...reportToSyncResult(report, timeout ? "timeout" : "stripe_error"),
      report,
      durationMs: report.durationMs,
    };
  } finally {
    await lock.release();
  }
}

export async function loadLatestMemberStripeSyncReport(userId: string) {
  if (!useDatabase()) return null;
  try {
    const row = await prisma.givingStripeMemberSyncRun.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        status: true,
        trigger: true,
        recorded: true,
        linked: true,
        flagged: true,
        skipped: true,
        finishedAt: true,
        metrics: true,
      },
    });
    return row;
  } catch {
    return null;
  }
}

export async function syncVerifiedStripeGiftsForMember(
  member: Pick<PublicMember, "id" | "email" | "name" | "campusId">,
) {
  return scheduleVerifiedStripeGiftsForMember(member, "history");
}
