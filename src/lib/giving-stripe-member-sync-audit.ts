import { prisma } from "@/lib/db";
import { useDatabase } from "@/lib/use-database";
import { redactStripeId, redactUserIdForLogs } from "@/lib/giving-privacy-redact";
import type { MemberStripeSyncTrigger } from "@/lib/giving-stripe-member-sync-policy";

function newAuditId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export type MemberStripeSyncRunStatus =
  | "ok"
  | "skipped_cooldown"
  | "stripe_error"
  | "timeout"
  | "partial";

export async function loadMemberStripeSyncState(userId: string) {
  if (!useDatabase()) {
    return {
      lastAttemptAt: null as Date | null,
      lastSuccessAt: null as Date | null,
      consecutiveFailures: 0,
    };
  }

  const recent = await prisma.givingStripeMemberSyncRun.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 12,
    select: {
      status: true,
      createdAt: true,
      finishedAt: true,
    },
  });

  const lastAttemptAt = recent[0]?.createdAt ?? null;
  const lastSuccess = recent.find((row) => row.status === "ok");
  const lastSuccessAt = lastSuccess?.finishedAt ?? lastSuccess?.createdAt ?? null;

  let consecutiveFailures = 0;
  for (const row of recent) {
    if (row.status === "ok" || row.status === "skipped_cooldown") break;
    if (row.status === "stripe_error" || row.status === "timeout" || row.status === "partial") {
      consecutiveFailures += 1;
    }
  }

  return { lastAttemptAt, lastSuccessAt, consecutiveFailures };
}

export async function createMemberStripeSyncRun(input: {
  userId: string;
  trigger: MemberStripeSyncTrigger;
  status: MemberStripeSyncRunStatus;
  recorded: number;
  linked: number;
  flagged: number;
  skipped: number;
  startedAt: Date;
  finishedAt: Date;
  errorMessage?: string | null;
}) {
  if (!useDatabase()) return;

  await prisma.givingStripeMemberSyncRun.create({
    data: {
      id: newAuditId("gssrun"),
      userId: input.userId,
      trigger: input.trigger,
      status: input.status,
      recorded: input.recorded,
      linked: input.linked,
      flagged: input.flagged,
      skipped: input.skipped,
      errorMessage: input.errorMessage ?? null,
      startedAt: input.startedAt,
      finishedAt: input.finishedAt,
    },
  });

  console.info("[giving-stripe-member-sync]", {
    member: redactUserIdForLogs(input.userId),
    trigger: input.trigger,
    status: input.status,
    recorded: input.recorded,
    linked: input.linked,
    flagged: input.flagged,
    skipped: input.skipped,
    error: input.errorMessage ?? undefined,
  });
}

export async function flagStripeMemberSyncForFinanceReview(input: {
  userId: string;
  stripeSessionId?: string | null;
  stripeInvoiceId?: string | null;
  reason: string;
  metadataUserId?: string | null;
  clientReferenceId?: string | null;
}) {
  if (!useDatabase()) return false;

  const sessionId = input.stripeSessionId?.trim() || null;
  const invoiceId = input.stripeInvoiceId?.trim() || null;
  if (!sessionId && !invoiceId) return false;

  try {
    await prisma.givingStripeMemberSyncReview.create({
      data: {
        id: newAuditId("gssrev"),
        userId: input.userId,
        stripeSessionId: sessionId,
        stripeInvoiceId: invoiceId,
        reason: input.reason,
        metadataUserId: input.metadataUserId?.trim() || null,
        clientReferenceId: input.clientReferenceId?.trim() || null,
      },
    });
    console.warn("[giving-stripe-member-sync] finance_review", {
      member: redactUserIdForLogs(input.userId),
      stripeSession: sessionId ? redactStripeId(sessionId) : undefined,
      stripeInvoice: invoiceId ? redactStripeId(invoiceId) : undefined,
      reason: input.reason,
    });
    return true;
  } catch {
    return false;
  }
}

export async function countOpenMemberStripeSyncReviews() {
  if (!useDatabase()) return 0;
  return prisma.givingStripeMemberSyncReview.count({
    where: { resolvedAt: null },
  });
}
