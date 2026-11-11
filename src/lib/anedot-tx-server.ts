import { Prisma, type PrismaClient } from "@prisma/client";
import { normalizeGivingEmail, type GivingFund } from "@/lib/giving-types";
import { signAnedotIntentPayload } from "@/lib/anedot-intent-token";
import { anedotIntentSigningSecret } from "@/lib/anedot-env";

export type AnedotTx = Prisma.TransactionClient;

function anedotGiftNote(base: string) {
  return base;
}

export async function txFindGivingRecordByAnedotDonationId(tx: AnedotTx, anedotDonationId: string) {
  return tx.givingRecord.findUnique({ where: { anedotDonationId } });
}

export async function txCreateAnedotGivingRecord(
  tx: AnedotTx,
  input: {
    anedotDonationId: string;
    grossAmount: number;
    effectiveAmount: number;
    currency: string;
    fund: GivingFund;
    donorName: string;
    donorEmail?: string;
    userId?: string;
    givenOn: string;
    notes?: string;
  },
) {
  const now = new Date();
  try {
    return await tx.givingRecord.create({
      data: {
        id: `give-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        userId: input.userId ?? null,
        donorName: input.donorName,
        donorEmail: normalizeGivingEmail(input.donorEmail) ?? null,
        amount: input.grossAmount,
        effectiveAmount: input.effectiveAmount,
        anedotReversalStatus: "none",
        currency: input.currency,
        fund: input.fund,
        method: "anedot",
        givenOn: input.givenOn,
        notes: input.notes ?? anedotGiftNote("Anedot hosted checkout."),
        source: "anedot",
        anedotDonationId: input.anedotDonationId,
        recordedBy: input.userId ?? "anedot",
        recordedByName: "Anedot giving",
        createdAt: now,
        updatedAt: now,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const existing = await txFindGivingRecordByAnedotDonationId(tx, input.anedotDonationId);
      if (existing) return existing;
    }
    throw error;
  }
}

export async function txApplyAnedotFullReversal(
  tx: AnedotTx,
  input: {
    givingRecordId: string;
    anedotDonationId: string;
    eventType: string;
    requestId: string | null;
    priorEffective: number;
    note: string;
  },
) {
  const now = new Date();
  const record = await tx.givingRecord.update({
    where: { id: input.givingRecordId },
    data: {
      effectiveAmount: 0,
      anedotReversalStatus: "full",
      notes: input.note,
      updatedAt: now,
    },
  });

  await tx.givingAnedotAdjustment.create({
    data: {
      id: `anedot-adj-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      anedotDonationId: input.anedotDonationId,
      givingRecordId: input.givingRecordId,
      eventType: input.eventType,
      requestId: input.requestId,
      deltaAmount: -input.priorEffective,
      effectiveAfter: 0,
      notes: input.note,
    },
  });

  return record;
}

export async function txApplyAnedotPartialReversal(
  tx: AnedotTx,
  input: {
    givingRecordId: string;
    anedotDonationId: string;
    eventType: string;
    requestId: string | null;
    nextEffective: number;
    reversedDelta: number;
    note: string;
  },
) {
  const now = new Date();
  const status = input.nextEffective <= 0.0001 ? "full" : "partial";
  const record = await tx.givingRecord.update({
    where: { id: input.givingRecordId },
    data: {
      effectiveAmount: input.nextEffective,
      anedotReversalStatus: status,
      notes: input.note,
      updatedAt: now,
    },
  });

  await tx.givingAnedotAdjustment.create({
    data: {
      id: `anedot-adj-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      anedotDonationId: input.anedotDonationId,
      givingRecordId: input.givingRecordId,
      eventType: input.eventType,
      requestId: input.requestId,
      deltaAmount: -input.reversedDelta,
      effectiveAfter: input.nextEffective,
      notes: input.note,
    },
  });

  return record;
}

export async function txReserveAnedotWebhookDelivery(
  tx: AnedotTx,
  input: {
    requestId: string;
    eventType: string;
    anedotDonationId: string | null;
    outcome: string;
  },
) {
  const id = `anedot-wh-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  try {
    await tx.givingAnedotWebhookEvent.create({
      data: {
        id,
        requestId: input.requestId,
        anedotDonationId: input.anedotDonationId,
        eventType: input.eventType,
        outcome: input.outcome,
      },
    });
    return { duplicate: false as const };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { duplicate: true as const };
    }
    throw error;
  }
}

export async function txFinalizeAnedotWebhookDelivery(
  tx: AnedotTx,
  requestId: string,
  outcome: string,
) {
  await tx.givingAnedotWebhookEvent.updateMany({
    where: { requestId },
    data: { outcome },
  });
}

export async function txFindIntentByReference(tx: AnedotTx, reference: string) {
  const intentId = reference.split(".")[0]?.trim();
  if (!intentId) return null;
  const row = await tx.givingAnedotIntent.findUnique({ where: { id: intentId } });
  if (!row) return null;
  const signingSecret = anedotIntentSigningSecret();
  if (!signingSecret) return null;
  const expectedRef = `${row.id}.${signAnedotIntentPayload(`${row.id}:${row.intentToken}`, signingSecret)}`;
  if (expectedRef !== reference) return null;
  return row;
}

export async function txUpsertAnedotLedger(
  tx: AnedotTx,
  input: {
    anedotDonationId: string;
    intentId: string | null;
    userId: string | null;
    fund: string;
    grossAmount: number | null;
    netAmount: number | null;
    feeAmount: number | null;
    effectiveAmount: number | null;
    reversedAmount: number;
    currency: string;
    paymentSource: string | null;
    lifecycleStatus: string;
    lifecycleRank: number;
    givingRecordId: string | null;
    commitmentUid: string | null;
    actionPageId: string | null;
    settlementAt: Date | null;
    lastEventType: string;
    lastEventAt: Date;
  },
) {
  return tx.givingAnedotDonationLedger.upsert({
    where: { anedotDonationId: input.anedotDonationId },
    create: {
      anedotDonationId: input.anedotDonationId,
      intentId: input.intentId,
      userId: input.userId,
      fund: input.fund,
      grossAmount: input.grossAmount,
      netAmount: input.netAmount,
      feeAmount: input.feeAmount,
      effectiveAmount: input.effectiveAmount,
      reversedAmount: input.reversedAmount,
      currency: input.currency,
      paymentSource: input.paymentSource,
      lifecycleStatus: input.lifecycleStatus,
      lifecycleRank: input.lifecycleRank,
      givingRecordId: input.givingRecordId,
      commitmentUid: input.commitmentUid,
      actionPageId: input.actionPageId,
      settlementAt: input.settlementAt,
      lastEventType: input.lastEventType,
      lastEventAt: input.lastEventAt,
    },
    update: {
      intentId: input.intentId || undefined,
      userId: input.userId,
      fund: input.fund,
      grossAmount: input.grossAmount ?? undefined,
      netAmount: input.netAmount ?? undefined,
      feeAmount: input.feeAmount ?? undefined,
      effectiveAmount: input.effectiveAmount ?? undefined,
      reversedAmount: input.reversedAmount,
      currency: input.currency,
      paymentSource: input.paymentSource ?? undefined,
      lifecycleStatus: input.lifecycleStatus,
      lifecycleRank: input.lifecycleRank,
      givingRecordId: input.givingRecordId,
      commitmentUid: input.commitmentUid ?? undefined,
      actionPageId: input.actionPageId ?? undefined,
      settlementAt: input.settlementAt ?? undefined,
      lastEventType: input.lastEventType,
      lastEventAt: input.lastEventAt,
    },
  });
}

/** After-commit side effect only. */
export async function queueAnedotThankYou(
  prisma: PrismaClient | AnedotTx,
  givingRecordId: string,
) {
  const { sendGivingThankYou } = await import("@/lib/giving-notify-server");
  const { markThankYouSent } = await import("@/lib/giving-server");
  const { getGivingRecordById } = await import("@/lib/giving-server");
  const record = await getGivingRecordById(givingRecordId);
  if (!record) return;
  void sendGivingThankYou(record)
    .then(async (result) => {
      if (result.sent) await markThankYouSent(record.id);
    })
    .catch((error) => console.error("Anedot giving thank-you failed:", error));
}
