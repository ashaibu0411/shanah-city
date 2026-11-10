import type { GivingFund } from "@/lib/giving-types";
import { isKnownGivingFund } from "@/lib/giving-stripe-eligibility";
import { prisma } from "@/lib/db";
import { useDatabase } from "@/lib/use-database";
import { hubMethodIsPublic } from "@/lib/giving-hub-server";
import type { GivingHubOffPlatformIntentStatus } from "@/lib/giving-hub-types";

const ALLOWED_METHODS = new Set(["zelle", "cashapp"]);

export async function createOffPlatformGivingIntent(input: {
  userId: string;
  methodKey: string;
  amount: number;
  fund: string;
  donorNote?: string;
}) {
  if (!useDatabase()) {
    throw new Error("Database required.");
  }
  if (!ALLOWED_METHODS.has(input.methodKey)) {
    throw new Error("Unsupported off-platform method.");
  }
  if (!Number.isFinite(input.amount) || input.amount <= 0 || input.amount > 1_000_000) {
    throw new Error("Invalid amount.");
  }
  if (!isKnownGivingFund(input.fund)) {
    throw new Error("Invalid fund.");
  }

  const method = await prisma.givingHubPaymentMethod.findUnique({
    where: { methodKey: input.methodKey },
  });
  if (!method || !hubMethodIsPublic(method)) {
    throw new Error("This giving method is not yet available. Use Stripe checkout or contact Finance.");
  }

  const id = `ghint-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const now = new Date();
  return prisma.givingHubOffPlatformIntent.create({
    data: {
      id,
      userId: input.userId,
      methodKey: input.methodKey,
      amount: input.amount,
      fund: input.fund as GivingFund,
      donorNote: input.donorNote?.trim().slice(0, 500) || null,
      status: "pending_finance",
      createdAt: now,
      updatedAt: now,
    },
  });
}

export async function listOffPlatformIntentsForMember(userId: string) {
  if (!useDatabase()) return [];
  return prisma.givingHubOffPlatformIntent.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function listPendingOffPlatformIntentsForFinance(limit = 100) {
  if (!useDatabase()) return [];
  return prisma.givingHubOffPlatformIntent.findMany({
    where: { status: "pending_finance" },
    orderBy: { createdAt: "asc" },
    take: Math.min(limit, 200),
  });
}

export async function reviewOffPlatformIntent(input: {
  id: string;
  reviewerUserId: string;
  status: Exclude<GivingHubOffPlatformIntentStatus, "pending_finance">;
  financeNote?: string;
  matchedRecordId?: string;
}) {
  if (input.status === "matched" && !input.matchedRecordId?.trim()) {
    throw new Error("matchedRecordId required when status is matched.");
  }
  return prisma.givingHubOffPlatformIntent.update({
    where: { id: input.id },
    data: {
      status: input.status,
      financeNote: input.financeNote?.trim().slice(0, 500) || null,
      matchedRecordId: input.matchedRecordId?.trim() || null,
      reviewedByUserId: input.reviewerUserId,
      reviewedAt: new Date(),
      updatedAt: new Date(),
    },
  });
}
