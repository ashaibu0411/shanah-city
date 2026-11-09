import { prisma } from "@/lib/db";
import { getStripeWebhookSecret, isStripeGivingConfigured } from "@/lib/stripe-server";
import { useDatabase } from "@/lib/use-database";
import { normalizeGivingEmail } from "@/lib/giving-types";
import { redactEmailForLogs, redactStripeId, redactUserIdForLogs } from "@/lib/giving-privacy-redact";
import { reportMissingStripeGifts } from "@/lib/giving-reconcile-server";
import { getMemberStripeCustomerId, loadLatestMemberStripeSyncReport } from "@/lib/giving-stripe-member-sync";
import type { MemberStripeSyncReport } from "@/lib/giving-stripe-member-sync-report";
import { countOpenMemberStripeSyncReviews } from "@/lib/giving-stripe-member-sync-audit";

export type GivingIdentityLinkCandidate = {
  recordId: string;
  stripeKind: "checkout_session" | "invoice";
  stripeIdRedacted: string;
  linkMethod: "email_match" | "metadata_user" | "stripe_customer";
  confidence: "high" | "ambiguous";
  donorEmailDomain: string | null;
  candidateUserRedacted: string | null;
  auditNote: string;
};

export async function buildGivingDatabaseBuckets() {
  if (!useDatabase()) {
    return {
      stripeRecordTotal: 0,
      stripeWithUserId: 0,
      stripeWithoutUserId: 0,
      withStripeSessionId: 0,
      withStripeInvoiceId: 0,
      mislinkedEmailCount: 0,
      orphanLinkableByEmailCount: 0,
      orphanNoAccountEmailCount: 0,
      stripeCustomerUsers: 0,
      stripeCustomerUsersWithZeroStripeGifts: 0,
    };
  }

  const stripeRecordTotal = await prisma.givingRecord.count({ where: { source: "stripe" } });
  const stripeWithUserId = await prisma.givingRecord.count({
    where: { source: "stripe", userId: { not: null } },
  });
  const stripeWithoutUserId = await prisma.givingRecord.count({
    where: { source: "stripe", userId: null },
  });
  const withStripeSessionId = await prisma.givingRecord.count({
    where: { stripeSessionId: { not: null } },
  });
  const withStripeInvoiceId = await prisma.givingRecord.count({
    where: { stripeInvoiceId: { not: null } },
  });

  const mislinkedEmailCount = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*)::bigint AS count
    FROM "GivingRecord" g
    JOIN "User" u ON g."userId" = u.id
    WHERE g.source = 'stripe'
      AND g."donorEmail" IS NOT NULL
      AND LOWER(TRIM(g."donorEmail")) <> LOWER(TRIM(u.email))
  `.then((rows) => Number(rows[0]?.count ?? 0));

  const orphanLinkableByEmailCount = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*)::bigint AS count
    FROM "GivingRecord" g
    JOIN "User" u ON LOWER(TRIM(g."donorEmail")) = LOWER(TRIM(u.email))
    WHERE g.source = 'stripe' AND g."userId" IS NULL
  `.then((rows) => Number(rows[0]?.count ?? 0));

  const orphanNoAccountEmailCount = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*)::bigint AS count
    FROM "GivingRecord" g
    WHERE g.source = 'stripe'
      AND g."userId" IS NULL
      AND g."donorEmail" IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM "User" u
        WHERE LOWER(TRIM(u.email)) = LOWER(TRIM(g."donorEmail"))
      )
  `.then((rows) => Number(rows[0]?.count ?? 0));

  const stripeCustomerUsers = await prisma.user.count({
    where: { stripeCustomerId: { not: null } },
  });

  const stripeCustomerUsersWithZeroStripeGifts = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*)::bigint AS count
    FROM "User" u
    WHERE u."stripeCustomerId" IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM "GivingRecord" g
        WHERE g."userId" = u.id AND g.source = 'stripe'
      )
  `.then((rows) => Number(rows[0]?.count ?? 0));

  return {
    stripeRecordTotal,
    stripeWithUserId,
    stripeWithoutUserId,
    withStripeSessionId,
    withStripeInvoiceId,
    mislinkedEmailCount,
    orphanLinkableByEmailCount,
    orphanNoAccountEmailCount,
    stripeCustomerUsers,
    stripeCustomerUsersWithZeroStripeGifts,
  };
}

export async function buildGivingIdentityLinkCandidates(limit = 50) {
  if (!useDatabase()) return [] as GivingIdentityLinkCandidate[];

  const orphans = await prisma.givingRecord.findMany({
    where: { source: "stripe", userId: null },
    orderBy: { givenOn: "desc" },
    take: Math.min(limit, 100),
    select: {
      id: true,
      donorEmail: true,
      stripeSessionId: true,
      stripeInvoiceId: true,
    },
  });

  const candidates: GivingIdentityLinkCandidate[] = [];

  for (const row of orphans) {
    const email = normalizeGivingEmail(row.donorEmail);
    const stripeKind = row.stripeSessionId ? "checkout_session" : "invoice";
    const stripeId = row.stripeSessionId ?? row.stripeInvoiceId;

    if (email) {
      const user = await prisma.user.findFirst({
        where: { email: { equals: email, mode: "insensitive" } },
        select: { id: true },
      });
      if (user) {
        candidates.push({
          recordId: row.id,
          stripeKind,
          stripeIdRedacted: redactStripeId(stripeId) ?? "—",
          linkMethod: "email_match",
          confidence: "high",
          donorEmailDomain: email.split("@")[1] ?? null,
          candidateUserRedacted: redactUserIdForLogs(user.id),
          auditNote: "Orphan Stripe gift; donor email matches an existing account. Manual link or member sign-in email link only.",
        });
        continue;
      }
    }

    candidates.push({
      recordId: row.id,
      stripeKind,
      stripeIdRedacted: redactStripeId(stripeId) ?? "—",
      linkMethod: "stripe_customer",
      confidence: "ambiguous",
      donorEmailDomain: email ? (email.split("@")[1] ?? null) : null,
      candidateUserRedacted: null,
      auditNote:
        "No unique account email match. Use Stripe customer ID verification before any userId assignment.",
    });
  }

  return candidates;
}

export async function buildMemberGivingVisibilityDiagnostic(member: {
  id: string;
  email: string;
}) {
  const customerId = await getMemberStripeCustomerId(member.id);
  const stripeGiftsForUser = useDatabase()
    ? await prisma.givingRecord.count({
        where: { userId: member.id, source: "stripe" },
      })
    : 0;
  const emailGifts = useDatabase()
    ? await prisma.givingRecord.count({
        where: {
          source: "stripe",
          donorEmail: { equals: normalizeGivingEmail(member.email) ?? "", mode: "insensitive" },
        },
      })
    : 0;

  const lastSync = await loadLatestMemberStripeSyncReport(member.id);
  const syncReport = (lastSync?.metrics as MemberStripeSyncReport | null) ?? null;

  return {
    memberRedacted: redactUserIdForLogs(member.id),
    emailDomain: normalizeGivingEmail(member.email)?.split("@")[1] ?? null,
    hasStripeCustomerId: Boolean(customerId),
    stripeCustomerIdRedacted: customerId ? redactStripeId(customerId) : null,
    stripeGiftsOwned: stripeGiftsForUser,
    stripeGiftsByDonorEmail: emailGifts,
    lastMemberSync: lastSync
      ? {
          status: lastSync.status,
          trigger: lastSync.trigger,
          recorded: lastSync.recorded,
          linked: lastSync.linked,
          finishedAt: lastSync.finishedAt?.toISOString() ?? null,
          report: syncReport,
        }
      : null,
    likelyMissingInDb:
      Boolean(customerId) && stripeGiftsForUser === 0
        ? "Stripe customer linked but zero stripe GivingRecord rows for this userId — category (1) likely; run Stripe customer sync or finance backfill."
        : null,
    interpretationNote:
      "Active recurring subscriptions in Stripe are not donations until a paid invoice is recorded. sync status ok with zero newlyRecorded may mean already_recorded in DB or no eligible paid Shanah metadata in the 90-day window.",
  };
}

export async function buildGivingHistoryIncidentReport(options?: {
  days?: number;
  memberUserId?: string;
  memberEmail?: string;
}) {
  const dbBuckets = await buildGivingDatabaseBuckets();
  const identityCandidates = await buildGivingIdentityLinkCandidates(50);
  const openMemberSyncReviews = await countOpenMemberStripeSyncReviews();

  let missingStripe = null as Awaited<ReturnType<typeof reportMissingStripeGifts>> | null;
  if (isStripeGivingConfigured() && useDatabase()) {
    try {
      missingStripe = await reportMissingStripeGifts({
        days: options?.days ?? 90,
        limit: 100,
      });
    } catch {
      missingStripe = null;
    }
  }

  const memberDiag =
    options?.memberUserId && options?.memberEmail
      ? await buildMemberGivingVisibilityDiagnostic({
          id: options.memberUserId,
          email: options.memberEmail,
        })
      : null;

  const missingRedacted = missingStripe?.missing.map((row) => ({
    kind: row.kind,
    stripeIdRedacted: redactStripeId(row.stripeId),
    amountUsd: row.amountUsd,
    paidAtIso: row.paidAtIso,
    donorEmailRedacted: redactEmailForLogs(row.donorEmail),
    userIdRedacted: redactUserIdForLogs(row.userId),
  }));

  return {
    generatedAt: new Date().toISOString(),
    readOnly: true as const,
    infrastructure: {
      database: useDatabase(),
      stripeConfigured: isStripeGivingConfigured(),
      stripeWebhookSecretConfigured: Boolean(getStripeWebhookSecret()),
    },
    classificationGuide: {
      missingInDatabase: "Paid Shanah Stripe checkout/invoice with no GivingRecord row.",
      storedUnlinked: "GivingRecord exists but userId is null.",
      mislinkedUserId:
        "GivingRecord userId points to a member whose account email differs from donorEmail.",
      emailDrift:
        "Member changed account email; donorEmail on gift no longer matches — use Stripe customer sync.",
      historyApiOrUi: "If DB rows exist for userId but profile is empty, inspect /api/giving/history and client merge.",
    },
    database: {
      ...dbBuckets,
      openMemberSyncReviews,
    },
    stripeMissing: missingStripe
      ? {
          days: missingStripe.days,
          scannedSessions: missingStripe.scannedSessions,
          scannedInvoices: missingStripe.scannedInvoices,
          missingCount: missingStripe.missingCount,
          samples: missingRedacted,
        }
      : null,
    identityLinkCandidates: identityCandidates,
    member: memberDiag,
    safeRecoveryPlan: [
      "1. Finance: GET /api/admin/giving/diagnostic?days=90 (read-only).",
      "2. Affected member: open Profile → Your giving (triggers verified Stripe customer sync for own customer only).",
      "3. Category (1): POST /api/admin/giving/reconcile with APPLY_STRIPE_GIVING_BACKFILL after reviewing dry-run IDs.",
      "4. Category (2) high-confidence email_match only: member sign-in link OR finance-approved userId update with audit.",
      "5. Never assign userId on ambiguous email-only guesses.",
    ],
  };
}
