import type { Prisma } from "@prisma/client";
import type { CorroboratedOwnershipBasis } from "@/lib/giving-stripe-checkout-ownership";

export type RecoveryRecordInput = {
  recordId: string;
  memberUserId: string;
  donorName: string;
  donorEmail: string | null;
  giftAmount: number;
  currency: string;
  fund: string;
  givenOn: string;
  campusId: string | null;
  notes: string;
  stripeSessionId: string;
  recordedByUserId: string;
  recordedByName: string;
};

export type RecoveryAuditInput = {
  auditId: string;
  memberUserId: string;
  stripeSessionId: string;
  stripePaymentIntentId: string | null;
  requestedByUserId: string;
  requestedByName: string;
  ownershipBasis: CorroboratedOwnershipBasis | null;
  giftAmount: number;
  feeAmount: number | null;
  givenOn: string;
  successAtVerified: boolean;
  outcome: string;
  details: Record<string, unknown>;
};

export type ExistingGivingRecord = {
  id: string;
  userId: string | null;
  amount: number;
  givenOn: string;
};

export type RecoveryWriteOutcome =
  | { kind: "recorded"; recordId: string; auditId: string }
  | {
      kind: "already_recorded";
      recordId: string;
      auditId: string;
      giftAmount: number;
      givenOn: string;
    }
  | { kind: "other_member"; auditId: string; existingRecordId: string };

export async function recoveryRecordWithAuditInTransaction(
  tx: Pick<Prisma.TransactionClient, "givingRecord" | "givingStripeGiftRecoveryAudit">,
  input: {
    memberUserId: string;
    record: RecoveryRecordInput;
    audit: RecoveryAuditInput;
  },
): Promise<RecoveryWriteOutcome> {
  const existing = await tx.givingRecord.findUnique({
    where: { stripeSessionId: input.record.stripeSessionId },
  });

  if (existing) {
    if (existing.userId && existing.userId !== input.memberUserId) {
      const auditId = input.audit.auditId;
      await tx.givingStripeGiftRecoveryAudit.create({
        data: {
          id: auditId,
          memberUserId: input.audit.memberUserId,
          stripeSessionId: input.audit.stripeSessionId,
          stripePaymentIntentId: input.audit.stripePaymentIntentId,
          requestedByUserId: input.audit.requestedByUserId,
          requestedByName: input.audit.requestedByName,
          ownershipBasis: input.audit.ownershipBasis,
          giftAmount: existing.amount,
          feeAmount: input.audit.feeAmount,
          givenOn: existing.givenOn,
          successAtVerified: input.audit.successAtVerified,
          outcome: "rejected_other_member_record",
          details: { existingRecordId: existing.id, existingUserId: existing.userId },
          createdAt: new Date(),
        },
      });
      return { kind: "other_member", auditId, existingRecordId: existing.id };
    }

    await tx.givingStripeGiftRecoveryAudit.create({
      data: {
        id: input.audit.auditId,
        memberUserId: input.audit.memberUserId,
        stripeSessionId: input.audit.stripeSessionId,
        stripePaymentIntentId: input.audit.stripePaymentIntentId,
        requestedByUserId: input.audit.requestedByUserId,
        requestedByName: input.audit.requestedByName,
        ownershipBasis: input.audit.ownershipBasis,
        giftAmount: existing.amount,
        feeAmount: input.audit.feeAmount,
        givenOn: existing.givenOn,
        successAtVerified: input.audit.successAtVerified,
        outcome: "already_recorded_for_member",
        details: { recordId: existing.id },
        createdAt: new Date(),
      },
    });
    return {
      kind: "already_recorded",
      recordId: existing.id,
      auditId: input.audit.auditId,
      giftAmount: existing.amount,
      givenOn: existing.givenOn,
    };
  }

  const now = new Date();
  const created = await tx.givingRecord.create({
    data: {
      id: input.record.recordId,
      userId: input.record.memberUserId,
      donorName: input.record.donorName,
      donorEmail: input.record.donorEmail,
      amount: input.record.giftAmount,
      currency: input.record.currency,
      fund: input.record.fund,
      method: "stripe",
      givenOn: input.record.givenOn,
      campusId: input.record.campusId,
      notes: input.record.notes,
      source: "stripe",
      stripeSessionId: input.record.stripeSessionId,
      stripeInvoiceId: null,
      recordedBy: input.record.recordedByUserId,
      recordedByName: input.record.recordedByName,
      createdAt: now,
      updatedAt: now,
    },
  });

  await tx.givingStripeGiftRecoveryAudit.create({
    data: {
      id: input.audit.auditId,
      memberUserId: input.audit.memberUserId,
      stripeSessionId: input.audit.stripeSessionId,
      stripePaymentIntentId: input.audit.stripePaymentIntentId,
      requestedByUserId: input.audit.requestedByUserId,
      requestedByName: input.audit.requestedByName,
      ownershipBasis: input.audit.ownershipBasis,
      giftAmount: input.audit.giftAmount,
      feeAmount: input.audit.feeAmount,
      givenOn: input.audit.givenOn,
      successAtVerified: input.audit.successAtVerified,
      outcome: "recorded",
      details: { ...input.audit.details, recordId: created.id },
      createdAt: now,
    },
  });

  return { kind: "recorded", recordId: created.id, auditId: input.audit.auditId };
}
