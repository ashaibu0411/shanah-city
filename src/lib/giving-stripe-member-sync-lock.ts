import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { useDatabase } from "@/lib/use-database";

/** Stripe member sync may hold this lease while listing Stripe (well under serverless bounds). */
export const MEMBER_STRIPE_SYNC_LEASE_MS = 120_000;

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

function isMissingLeaseTableError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === "P2021" || error.code === "P2022")
  );
}

/**
 * Acquire a TTL lease via atomic INSERT … ON CONFLICT (works across pooled Prisma connections).
 * Returns acquired: false when another holder still holds a non-expired lease.
 */
export async function tryAcquireMemberStripeSyncLock(userId: string) {
  if (!useDatabase()) return { acquired: true as const, release: async () => {} };

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
      return { acquired: false as const, release: async () => {} };
    }

    return {
      acquired: true as const,
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
      return { acquired: true as const, release: async () => {} };
    }
    throw error;
  }
}
