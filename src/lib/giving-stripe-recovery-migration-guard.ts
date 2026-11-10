import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { useDatabase } from "@/lib/use-database";

const RECOVERY_AUDIT_TABLE = "GivingStripeGiftRecoveryAudit";

export function isMissingRecoveryAuditTableError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === "P2021" || error.code === "P2022")
  );
}

/** Fail-closed: finance recovery writes require the audit migration on production DB. */
export async function isGivingGiftRecoveryAuditTableReady() {
  if (!useDatabase()) return false;
  try {
    await prisma.$queryRawUnsafe(
      `SELECT 1 FROM "${RECOVERY_AUDIT_TABLE}" WHERE false`,
    );
    return true;
  } catch (error) {
    if (isMissingRecoveryAuditTableError(error)) return false;
    throw error;
  }
}
