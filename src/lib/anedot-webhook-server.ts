import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { useDatabase } from "@/lib/use-database";
import { parseAnedotFundAllowlist, anedotAccountUid } from "@/lib/anedot-env";
import { resolveAnedotFundToGivingFund, resolveIntentFundOrNull } from "@/lib/anedot-fund-map";
import { recordAnedotGift, reverseAnedotGiftByDonationId } from "@/lib/anedot-giving-record-server";
import { findAnedotIntentByReference } from "@/lib/anedot-intent-server";
import { reconcileAnedotIntent } from "@/lib/anedot-intent-reconcile";
import {
  anedotAccountUid as uidFromPayload,
  anedotConfirmPolicyForEvent,
  anedotDonationFromPayload,
  anedotDonationIdFromEnvelope,
  anedotDonorEmail,
  anedotDonorName,
  anedotEventType,
  anedotFeeAmountDollars,
  anedotGivenOnDateKey,
  anedotGrossAmountDollars,
  anedotIntentReferenceFromPayload,
  anedotLifecycleStatusForEvent,
  anedotNetAmountDollars,
  anedotPaymentSource,
  isKnownAnedotDonationEvent,
  parseAnedotWebhookJson,
  type AnedotWebhookEnvelope,
} from "@/lib/anedot-payload";
import { verifyAnedotWebhookSignature } from "@/lib/anedot-webhook-signature";

export type AnedotWebhookProcessResult = {
  status: number;
  outcome: string;
  anedotDonationId?: string;
};

export async function processAnedotWebhook(input: {
  rawBody: string;
  signature: string | null;
  requestId: string | null;
  secret: string;
  expectedAccountUid?: string | null;
}): Promise<AnedotWebhookProcessResult> {
  if (!useDatabase()) {
    return { status: 503, outcome: "database_unavailable" };
  }

  if (!verifyAnedotWebhookSignature(input.rawBody, input.signature, input.secret)) {
    return { status: 401, outcome: "invalid_signature" };
  }

  const envelope = parseAnedotWebhookJson(input.rawBody);
  if (!envelope) {
    return { status: 400, outcome: "invalid_json" };
  }

  const eventType = anedotEventType(envelope);
  if (!eventType) {
    return { status: 400, outcome: "missing_event" };
  }

  if (input.requestId) {
    const prior = await prisma.givingAnedotWebhookEvent.findUnique({
      where: { requestId: input.requestId },
    });
    if (prior) {
      return { status: 200, outcome: "duplicate_request", anedotDonationId: prior.anedotDonationId ?? undefined };
    }
  }

  if (!isKnownAnedotDonationEvent(eventType)) {
    await logWebhookEvent({
      requestId: input.requestId,
      eventType,
      anedotDonationId: anedotDonationIdFromEnvelope(envelope),
      outcome: "ignored_unknown_event",
    });
    return { status: 200, outcome: "ignored_unknown_event" };
  }

  const configuredUid = input.expectedAccountUid ?? anedotAccountUid();
  const payloadUid = uidFromPayload(envelope);
  if (configuredUid && payloadUid && configuredUid !== payloadUid) {
    await logWebhookEvent({
      requestId: input.requestId,
      eventType,
      anedotDonationId: anedotDonationIdFromEnvelope(envelope),
      outcome: "rejected_account_mismatch",
    });
    return { status: 403, outcome: "account_mismatch" };
  }

  const donationId = anedotDonationIdFromEnvelope(envelope);
  if (!donationId) {
    await logWebhookEvent({
      requestId: input.requestId,
      eventType,
      anedotDonationId: null,
      outcome: "missing_donation_id",
    });
    return { status: 422, outcome: "missing_donation_id" };
  }

  const existingLedger = await prisma.givingAnedotDonationLedger.findUnique({
    where: { anedotDonationId: donationId },
  });

  let gross = anedotGrossAmountDollars(envelope) ?? existingLedger?.grossAmount ?? null;
  const donation = anedotDonationFromPayload(envelope);
  const fundSlug =
    resolveAnedotFundToGivingFund(donation?.fund, parseAnedotFundAllowlist()) ??
  (existingLedger?.fund ? resolveIntentFundOrNull(existingLedger.fund) : null);
  const intentRef = anedotIntentReferenceFromPayload(envelope);
  const intentRow = intentRef ? await findAnedotIntentByReference(intentRef) : null;
  const reconciled = reconcileAnedotIntent({
    intent: intentRow
      ? {
          id: intentRow.id,
          userId: intentRow.userId,
          amount: intentRow.amount,
          fund: intentRow.fund,
          expiresAt: intentRow.expiresAt,
          consumedAt: intentRow.consumedAt,
        }
      : null,
    webhookAmount: gross,
    webhookFund: fundSlug,
  });

  if (!reconciled.ok) {
    await logWebhookEvent({
      requestId: input.requestId,
      eventType,
      anedotDonationId: donationId,
      outcome: `rejected_${reconciled.reason}`,
    });
    return { status: 422, outcome: reconciled.reason };
  }

  const ownerUserId = reconciled.userId ?? existingLedger?.userId ?? null;

  const paymentSource = anedotPaymentSource(envelope) ?? existingLedger?.paymentSource ?? null;
  const policy = anedotConfirmPolicyForEvent(eventType, paymentSource);
  const lifecycle = anedotLifecycleStatusForEvent(eventType);
  const feeAmount = anedotFeeAmountDollars(donation);
  const netAmount = anedotNetAmountDollars(envelope);
  const settlementAt = donation?.settlement_date ? new Date(donation.settlement_date) : null;
  const recurring =
    envelope.payload && typeof envelope.payload.recurring === "string"
      ? envelope.payload.recurring === "true"
      : Boolean(envelope.payload && envelope.payload.frequency && envelope.payload.frequency !== "once");

  let givingRecordId: string | null = null;
  let outcome = "ledger_updated";

  try {
    const ledger = await prisma.$transaction(async (tx) => {
      const existing = existingLedger;
      givingRecordId = existing?.givingRecordId ?? null;

      if (policy === "reverse") {
        if (existing?.givingRecordId) {
          await reverseAnedotGiftByDonationId(donationId);
          givingRecordId = null;
        }
      } else if (policy === "confirm_now" && gross !== null) {
        const confirmedFund = resolveIntentFundOrNull(reconciled.fund);
        if (!confirmedFund) {
          outcome = "rejected_invalid_fund";
        } else {
        const shouldCreate = !existing?.givingRecordId;
        const achUnsettled =
          existing?.lifecycleStatus === "completed" &&
          paymentSource === "bank_account" &&
          eventType === "donation_settled";
        if (shouldCreate || achUnsettled) {
          const record = await recordAnedotGift({
            anedotDonationId: donationId,
            amount: gross,
            fund: confirmedFund,
            donorName: anedotDonorName(envelope),
            donorEmail: anedotDonorEmail(envelope),
            userId: ownerUserId ?? undefined,
            givenOn: anedotGivenOnDateKey(envelope),
            feeAmount,
            netAmount,
            recurring,
          });
          givingRecordId = record.id;
          outcome = "gift_confirmed";
        }
        }
      } else if (policy === "wait_settlement") {
        outcome = "awaiting_settlement";
      }

      await tx.givingAnedotDonationLedger.upsert({
        where: { anedotDonationId: donationId },
        create: {
          anedotDonationId: donationId,
          intentId: reconciled.intentId || null,
          userId: ownerUserId,
          fund: reconciled.fund,
          grossAmount: gross,
          netAmount,
          feeAmount,
          paymentSource,
          lifecycleStatus: lifecycle,
          givingRecordId,
          commitmentUid:
            typeof envelope.payload?.commitment_uid === "string"
              ? envelope.payload.commitment_uid
              : null,
          settlementAt,
          lastEventType: eventType,
          lastEventAt: new Date(),
        },
        update: {
          intentId: reconciled.intentId || undefined,
          userId: ownerUserId,
          fund: reconciled.fund,
          grossAmount: gross ?? undefined,
          netAmount: netAmount ?? undefined,
          feeAmount: feeAmount ?? undefined,
          paymentSource: paymentSource ?? undefined,
          lifecycleStatus: lifecycle,
          givingRecordId,
          settlementAt: settlementAt ?? undefined,
          lastEventType: eventType,
          lastEventAt: new Date(),
        },
      });

      if (intentRow && reconciled.intentId && !intentRow.consumedAt) {
        await tx.givingAnedotIntent.update({
          where: { id: intentRow.id },
          data: { consumedAt: new Date() },
        });
      }

      return true;
    });

    if (!ledger) {
      return { status: 500, outcome: "ledger_failed" };
    }
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { status: 200, outcome: "duplicate_record", anedotDonationId: donationId };
    }
    console.error("Anedot webhook ledger error:", error);
    return { status: 500, outcome: "ledger_error" };
  }

  await logWebhookEvent({
    requestId: input.requestId,
    eventType,
    anedotDonationId: donationId,
    outcome,
  });

  return { status: 200, outcome, anedotDonationId: donationId };
}

async function logWebhookEvent(input: {
  requestId: string | null;
  eventType: string;
  anedotDonationId: string | null;
  outcome: string;
}) {
  const id = `anedot-wh-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  try {
    await prisma.givingAnedotWebhookEvent.create({
      data: {
        id,
        requestId: input.requestId,
        anedotDonationId: input.anedotDonationId,
        eventType: input.eventType,
        outcome: input.outcome,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return;
    }
    console.error("Anedot webhook audit log failed:", error);
  }
}

/** Test helper — build envelope without I/O. */
export function anedotSampleDonationCompletedEnvelope(
  overrides?: Partial<AnedotWebhookEnvelope>,
): AnedotWebhookEnvelope {
  return {
    event: "donation_completed",
    payload: {
      account_uid: "test-account",
      source: "credit_card",
      amount_in_dollars: "50.0",
      net_amount: "46.70",
      frequency: "once",
      recurring: "false",
      email: "donor@example.com",
      name: "Test Donor",
      date_iso8601: "2026-11-10",
      utm_content: "intent.test",
      donation: {
        id: "d-test-donation",
        fund: { identifier: "1001", name: "General Fund" },
        fees: { anedot_fees: { amount: "3.30" }, vendor_fees: [] },
      },
    },
    ...overrides,
  };
}
