import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { useDatabase } from "@/lib/use-database";
import { redactUserIdForLogs } from "@/lib/giving-privacy-redact";

/** Stripe member sync may hold this lease while listing Stripe (well under serverless bounds). */
export const MEMBER_STRIPE_SYNC_LEASE_MS = 120_000;

export type MemberStripeSyncLockDenyReason =
  | "database_unavailable"
  | "lease_table_missing"
  | "stripe_sync_in_progress";

function newLeaseHolderId() {
  return `lease-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function isMemberStripeSyncLeaseExpired(expiresAt: Date, now = new Date()) {
  return expiresAt.getTime() <= now.getTime();
}

/** Testable claim rules for DB lease rows (pooled-safe vs session advisory locks). */
export function canClaimMemberStripeSyncLease(
  existing: { holderId: string; expiresAt: Date } | null,
  holderId: string,
  now = new Date(),
) {
  if (!existing) return true;
  if (isMemberStripeSyncLeaseExpired(existing.expiresAt, now)) return true;
  return existing.holderId === holderId;
}

export function isMissingLeaseTableError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === "P2021" || error.code === "P2022")
  );
}

/** Fail-closed: never run parallel Stripe recovery without a lease row when DB is required. */
export function memberStripeSyncLockAcquireDeniedReason(options: {
  databaseEnabled: boolean;
  missingLeaseTable?: boolean;
}): MemberStripeSyncLockDenyReason | null {
  if (!options.databaseEnabled) return "database_unavailable";
  if (options.missingLeaseTable) return "lease_table_missing";
  return null;
}

export type MemberStripeSyncLockResult =
  | { acquired: true; release: () => Promise<void> }
  | { acquired: false; reason: MemberStripeSyncLockDenyReason; release: () => Promise<void> };

/**
 * Acquire a TTL lease via atomic INSERT … ON CONFLICT (works across pooled Prisma connections).
 * Returns acquired: false when another holder still holds a non-expired lease.
 */
export async function tryAcquireMemberStripeSyncLock(userId: string): Promise<MemberStripeSyncLockResult> {
  const noopRelease = async () => {};

  const preflight = memberStripeSyncLockAcquireDeniedReason({
    databaseEnabled: useDatabase(),
  });
  if (preflight) {
    return { acquired: false, reason: preflight, release: noopRelease };
  }

  const holderId = newLeaseHolderId();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + MEMBER_STRIPE_SYNC_LEASE_MS);

  try {
    const rows = await prisma.$queryRaw<{ holderId: string }[]>`
      INSERT INTO "GivingStripeMemberSyncLease" ("userId", "holderId", "expiresAt", "updatedAt")
      VALUES (${userId}, ${holderId}, ${expiresAt}, ${now})
      ON CONFLICT ("userId") DO UPDATE
      SET
        "holderId" = EXCLUDED."holderId",
        "expiresAt" = EXCLUDED."expiresAt",
        "updatedAt" = EXCLUDED."updatedAt"
      WHERE "GivingStripeMemberSyncLease"."expiresAt" < ${now}
      RETURNING "holderId"
    `;

    const acquired = rows.length > 0 && rows[0]?.holderId === holderId;
    if (!acquired) {
      return { acquired: false, reason: "stripe_sync_in_progress", release: noopRelease };
    }

    return {
      acquired: true,
      release: async () => {
        try {
          await prisma.givingStripeMemberSyncLease.updateMany({
            where: { userId, holderId },
            data: { expiresAt: new Date(), updatedAt: new Date() },
          });
        } catch (error) {
          if (!isMissingLeaseTableError(error)) throw error;
        }
      },
    };
  } catch (error) {
    if (isMissingLeaseTableError(error)) {
      console.warn("[giving-stripe-member-sync] lease_table_missing", {
        member: redactUserIdForLogs(userId),
      });
      return {
        acquired: false,
        reason: "lease_table_missing",
        release: noopRelease,
      };
    }
    throw error;
  }
}
