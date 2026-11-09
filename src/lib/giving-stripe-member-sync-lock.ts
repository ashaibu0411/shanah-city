import { prisma } from "@/lib/db";
import { useDatabase } from "@/lib/use-database";

/** Cross-request mutex so sign-in `after()` and history `after()` do not double-scan Stripe. */
export async function tryAcquireMemberStripeSyncLock(userId: string) {
  if (!useDatabase()) return { acquired: true as const, release: async () => {} };

  const rows = await prisma.$queryRaw<{ locked: boolean }[]>`
    SELECT pg_try_advisory_lock(hashtext(${`giving-sync:${userId}`})) AS locked
  `;
  const locked = Boolean(rows[0]?.locked);
  if (!locked) {
    return { acquired: false as const, release: async () => {} };
  }

  return {
    acquired: true as const,
    release: async () => {
      await prisma.$executeRaw`SELECT pg_advisory_unlock(hashtext(${`giving-sync:${userId}`}))`;
    },
  };
}
