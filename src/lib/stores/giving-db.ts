import { prisma } from "@/lib/db";
import type { GivingFund, GivingMethod, GivingRecord } from "@/lib/giving-types";
import { normalizeGivingEmail } from "@/lib/giving-types";

function mapRecord(record: {
  id: string;
  userId: string | null;
  donorName: string;
  donorEmail: string | null;
  amount: number;
  currency: string;
  fund: string;
  method: string;
  givenOn: string;
  campusId: string | null;
  notes: string | null;
  source: string;
  stripeSessionId: string | null;
  stripeInvoiceId: string | null;
  recordedBy: string;
  recordedByName: string;
  thankYouSentAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): GivingRecord {
  return {
    id: record.id,
    userId: record.userId ?? undefined,
    donorName: record.donorName,
    donorEmail: record.donorEmail ?? undefined,
    amount: record.amount,
    currency: record.currency,
    fund: record.fund as GivingFund,
    method: record.method as GivingMethod,
    givenOn: record.givenOn,
    campusId: record.campusId ?? undefined,
    notes: record.notes ?? undefined,
    source: (record.source as GivingRecord["source"]) ?? "manual",
    stripeSessionId: record.stripeSessionId ?? undefined,
    stripeInvoiceId: record.stripeInvoiceId ?? undefined,
    recordedBy: record.recordedBy,
    recordedByName: record.recordedByName,
    thankYouSentAt: record.thankYouSentAt?.toISOString(),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function listGivingRecords(options?: {
  since?: string;
  until?: string;
  userId?: string;
  fund?: string;
  donorEmail?: string;
  guestsOnly?: boolean;
}) {
  const where: {
    givenOn?: { gte?: string; lte?: string };
    userId?: string | null;
    fund?: string;
    donorEmail?: { equals: string; mode: "insensitive" };
  } = {};

  if (options?.since || options?.until) {
    where.givenOn = {};
    if (options.since) where.givenOn.gte = options.since;
    if (options.until) where.givenOn.lte = options.until;
  }

  if (options?.userId) {
    where.userId = options.userId;
  }

  if (options?.fund) {
    where.fund = options.fund;
  }

  const donorEmail = normalizeGivingEmail(options?.donorEmail);
  if (donorEmail) {
    where.donorEmail = { equals: donorEmail, mode: "insensitive" };
  }

  if (options?.guestsOnly) {
    where.userId = null;
  }

  const records = await prisma.givingRecord.findMany({
    where,
    orderBy: [{ givenOn: "desc" }, { createdAt: "desc" }],
  });

  return records.map(mapRecord);
}

export async function createGivingRecord(input: {
  userId?: string;
  donorName: string;
  donorEmail?: string;
  amount: number;
  currency?: string;
  fund: GivingFund;
  method: GivingMethod;
  givenOn: string;
  campusId?: string;
  notes?: string;
  source?: GivingRecord["source"];
  stripeSessionId?: string;
  stripeInvoiceId?: string;
  recordedBy: string;
  recordedByName: string;
}) {
  const now = new Date();
  const record = await prisma.givingRecord.create({
    data: {
      id: `give-${Date.now()}`,
      userId: input.userId ?? null,
      donorName: input.donorName,
      donorEmail: normalizeGivingEmail(input.donorEmail) ?? null,
      amount: input.amount,
      currency: input.currency ?? "USD",
      fund: input.fund,
      method: input.method,
      givenOn: input.givenOn,
      campusId: input.campusId ?? null,
      notes: input.notes ?? null,
      source: input.source ?? "manual",
      stripeSessionId: input.stripeSessionId ?? null,
      stripeInvoiceId: input.stripeInvoiceId ?? null,
      recordedBy: input.recordedBy,
      recordedByName: input.recordedByName,
      createdAt: now,
      updatedAt: now,
    },
  });

  return mapRecord(record);
}

export async function updateGivingRecord(
  id: string,
  update: Partial<
    Pick<
      GivingRecord,
      | "userId"
      | "donorName"
      | "donorEmail"
      | "amount"
      | "fund"
      | "method"
      | "givenOn"
      | "campusId"
      | "notes"
    >
  >,
) {
  const existing = await prisma.givingRecord.findUnique({ where: { id } });
  if (!existing) return null;

  const record = await prisma.givingRecord.update({
    where: { id },
    data: {
      userId: update.userId === undefined ? undefined : update.userId ?? null,
      donorName: update.donorName,
      donorEmail:
        update.donorEmail === undefined
          ? undefined
          : normalizeGivingEmail(update.donorEmail) ?? null,
      amount: update.amount,
      fund: update.fund,
      method: update.method,
      givenOn: update.givenOn,
      campusId: update.campusId === undefined ? undefined : update.campusId ?? null,
      notes: update.notes === undefined ? undefined : update.notes ?? null,
      updatedAt: new Date(),
    },
  });

  return mapRecord(record);
}

export async function deleteGivingRecord(id: string) {
  try {
    await prisma.givingRecord.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

export async function getGivingRecordById(id: string) {
  const record = await prisma.givingRecord.findUnique({ where: { id } });
  return record ? mapRecord(record) : null;
}

export async function markThankYouSent(id: string) {
  const existing = await prisma.givingRecord.findUnique({ where: { id } });
  if (!existing) return null;

  const record = await prisma.givingRecord.update({
    where: { id },
    data: {
      thankYouSentAt: new Date(),
      updatedAt: new Date(),
    },
  });

  return mapRecord(record);
}

export async function getGivingRecordByStripeSessionId(stripeSessionId: string) {
  const record = await prisma.givingRecord.findUnique({ where: { stripeSessionId } });
  return record ? mapRecord(record) : null;
}

export async function getGivingRecordByStripeInvoiceId(stripeInvoiceId: string) {
  const record = await prisma.givingRecord.findUnique({ where: { stripeInvoiceId } });
  return record ? mapRecord(record) : null;
}

export async function linkGivingRecordsToUser(email: string, userId: string) {
  const donorEmail = normalizeGivingEmail(email);
  if (!donorEmail) return 0;

  const result = await prisma.givingRecord.updateMany({
    where: {
      userId: null,
      donorEmail: { equals: donorEmail, mode: "insensitive" },
    },
    data: {
      userId,
      updatedAt: new Date(),
    },
  });

  return result.count;
}
