import { prisma } from "@/lib/db";
import { useDatabase } from "@/lib/use-database";
import {
  anedotActionPageId,
  anedotAccountUid,
  parseAnedotFundAllowlist,
} from "@/lib/anedot-env";
import { resolveAnedotFundToGivingFund, resolveIntentFundOrNull } from "@/lib/anedot-fund-map";
import {
  anedotGiftMutationForEvent,
  anedotLifecycleRank,
  anedotShouldApplyLifecycleTransition,
} from "@/lib/anedot-lifecycle";
import { reconcileAnedotIntent } from "@/lib/anedot-intent-reconcile";
import {
  anedotAccountUid as uidFromPayload,
  anedotActionPageIdFromPayload,
  anedotCurrencyCode,
  anedotDonationFromPayload,
  anedotDonationIdFromEnvelope,
  anedotDonorEmail,
  anedotDonorName,
  anedotEventAtMs,
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
import {
  queueAnedotThankYou,
  txApplyAnedotFullReversal,
  txApplyAnedotPartialReversal,
  txCreateAnedotGivingRecord,
  txFindGivingRecordByAnedotDonationId,
  txFindIntentByReference,
  txFinalizeAnedotWebhookDelivery,
  txReserveAnedotWebhookDelivery,
  txUpsertAnedotLedger,
} from "@/lib/anedot-tx-server";
import { verifyAnedotWebhookSignature } from "@/lib/anedot-webhook-signature";

export type AnedotWebhookProcessResult = {
  status: number;
  outcome: string;
  anedotDonationId?: string;
};

function bindNewDonationEvent(eventType: string): boolean {
  return eventType === "donation_completed" || eventType === "donation_settled";
}

function requiresVerifiedAmount(eventType: string, existingRecordId: string | null): boolean {
  if (eventType === "donation_completed" || eventType === "donation_settled") {
    return !existingRecordId;
  }
  return false;
}

export async function processAnedotWebhook(input: {
  rawBody: string;
  signature: string | null;
  requestId: string | null;
  secret: string;
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

  if (!input.requestId?.trim()) {
    return { status: 400, outcome: "missing_request_id" };
  }
  const requestId = input.requestId.trim();

  const configuredUid = anedotAccountUid();
  if (!configuredUid) {
    return { status: 503, outcome: "account_uid_not_configured" };
  }

  const payloadUid = uidFromPayload(envelope);
  if (!payloadUid || payloadUid !== configuredUid) {
    return { status: 403, outcome: "account_mismatch" };
  }

  const configuredPageId = anedotActionPageId();
  const payloadPageId = anedotActionPageIdFromPayload(envelope);
  if (configuredPageId && payloadPageId && configuredPageId !== payloadPageId) {
    return { status: 403, outcome: "action_page_mismatch" };
  }

  if (!isKnownAnedotDonationEvent(eventType)) {
    return { status: 200, outcome: "ignored_unknown_event" };
  }

  const donationId = anedotDonationIdFromEnvelope(envelope);
  if (!donationId) {
    return { status: 422, outcome: "missing_donation_id" };
  }

  const currency = anedotCurrencyCode(envelope);
  if (currency !== "USD") {
    return { status: 422, outcome: "unsupported_currency" };
  }

  let thankYouRecordId: string | null = null;
  let outcome = "ledger_updated";

  try {
    const result = await prisma.$transaction(async (tx) => {
      const reserved = await txReserveAnedotWebhookDelivery(tx, {
        requestId,
        eventType,
        anedotDonationId: donationId,
        outcome: "processing",
      });
      if (reserved.duplicate) {
        return { status: 200, outcome: "duplicate_request" as const };
      }

      const existingLedger = await tx.givingAnedotDonationLedger.findUnique({
        where: { anedotDonationId: donationId },
      });

      const paymentSource =
        anedotPaymentSource(envelope) ?? existingLedger?.paymentSource ?? null;
      const nextLifecycle = anedotLifecycleStatusForEvent(eventType, paymentSource);
      const nextRank = anedotLifecycleRank(nextLifecycle);
      const eventAtMs = anedotEventAtMs(envelope);

      if (existingLedger) {
        const stale = anedotShouldApplyLifecycleTransition({
          currentStatus: existingLedger.lifecycleStatus,
          currentRank: existingLedger.lifecycleRank,
          nextStatus: nextLifecycle,
          nextRank,
          eventType,
          eventAtMs,
          lastEventAtMs: existingLedger.lastEventAt.getTime(),
        });
        if (!stale.apply) {
          await txFinalizeAnedotWebhookDelivery(tx, requestId, `rejected_${stale.reason}`);
          return { status: 200, outcome: stale.reason as string };
        }
      }

      const donation = anedotDonationFromPayload(envelope);
      let gross = anedotGrossAmountDollars(envelope) ?? existingLedger?.grossAmount ?? null;
      const netAmount = anedotNetAmountDollars(envelope);
      const feeAmount = anedotFeeAmountDollars(donation);
      const fundSlug =
        resolveAnedotFundToGivingFund(donation?.fund, parseAnedotFundAllowlist()) ??
        (existingLedger?.fund ? resolveIntentFundOrNull(existingLedger.fund) : null);

      const existingRecord = existingLedger?.givingRecordId
        ? await tx.givingRecord.findUnique({ where: { id: existingLedger.givingRecordId } })
        : await txFindGivingRecordByAnedotDonationId(tx, donationId);

      const existingRecordId = existingRecord?.id ?? null;
      const bindNew = bindNewDonationEvent(eventType) && !existingRecordId;
      const verifyAmount = requiresVerifiedAmount(eventType, existingRecordId);

      const intentRef = anedotIntentReferenceFromPayload(envelope);
      const intentRow =
        bindNew && intentRef ? await txFindIntentByReference(tx, intentRef) : null;

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
        existingLedger: existingLedger
          ? {
              userId: existingLedger.userId,
              fund: existingLedger.fund,
              grossAmount: existingLedger.grossAmount,
              currency: existingLedger.currency,
            }
          : null,
        webhookAmount: gross,
        webhookFund: fundSlug,
        bindNewDonation: bindNew,
        requireVerifiedAmount: verifyAmount,
      });

      if (!reconciled.ok) {
        await txFinalizeAnedotWebhookDelivery(tx, requestId, `rejected_${reconciled.reason}`);
        return { status: 422, outcome: reconciled.reason };
      }

      const ownerUserId =
        reconciled.userId ?? existingLedger?.userId ?? intentRow?.userId ?? null;
      const confirmedFund = resolveIntentFundOrNull(reconciled.fund);
      if (bindNew && !confirmedFund) {
        await txFinalizeAnedotWebhookDelivery(tx, requestId, "rejected_invalid_fund");
        return { status: 422, outcome: "invalid_fund" };
      }

      if (verifyAmount && (gross === null || gross <= 0)) {
        await txFinalizeAnedotWebhookDelivery(tx, requestId, "rejected_missing_amount");
        return { status: 422, outcome: "missing_amount" };
      }

      const existingEffective =
        existingRecord?.effectiveAmount ?? existingRecord?.amount ?? gross ?? 0;

      const mutation = anedotGiftMutationForEvent({
        eventType,
        paymentSource,
        grossAmount: gross,
        netAmount,
        existingGivingRecordId: existingRecordId,
        existingEffectiveAmount: existingEffective,
      });

      let givingRecordId = existingRecordId;
      let ledgerEffective = existingLedger?.effectiveAmount ?? (existingRecord ? existingEffective : null);
      let ledgerReversed = existingLedger?.reversedAmount ?? 0;

      const reversalNote = (detail: string) =>
        `${existingRecord?.notes ?? "Anedot hosted checkout."} ${detail}`.trim();

      if (mutation.kind === "create" && confirmedFund) {
        const record = await txCreateAnedotGivingRecord(tx, {
          anedotDonationId: donationId,
          grossAmount: mutation.grossAmount,
          effectiveAmount: mutation.effectiveAmount,
          currency,
          fund: confirmedFund,
          donorName: anedotDonorName(envelope),
          donorEmail: anedotDonorEmail(envelope),
          userId: ownerUserId ?? undefined,
          givenOn: anedotGivenOnDateKey(envelope),
          notes: reversalNote(
            feeAmount ? `Processing fees withheld: $${feeAmount.toFixed(2)}.` : "",
          ),
        });
        givingRecordId = record.id;
        ledgerEffective = mutation.effectiveAmount;
        thankYouRecordId = record.id;
        outcome = "gift_confirmed";
      } else if (mutation.kind === "confirm_settlement" && givingRecordId) {
        outcome = "gift_already_confirmed";
      } else if (mutation.kind === "full_reversal" && givingRecordId) {
        const prior = existingEffective;
        await txApplyAnedotFullReversal(tx, {
          givingRecordId,
          anedotDonationId: donationId,
          eventType,
          requestId,
          priorEffective: prior,
          note: reversalNote(`Reversed (${eventType.replace("donation_", "")}). Original gift retained for audit.`),
        });
        ledgerEffective = 0;
        ledgerReversed = (existingLedger?.reversedAmount ?? 0) + prior;
        outcome = "gift_reversed";
      } else if (mutation.kind === "partial_reversal" && givingRecordId) {
        await txApplyAnedotPartialReversal(tx, {
          givingRecordId,
          anedotDonationId: donationId,
          eventType,
          requestId,
          nextEffective: mutation.effectiveAmount,
          reversedDelta: mutation.reversedDelta,
          note: reversalNote(
            `Adjusted (${eventType.replace("donation_", "")}). Effective amount $${mutation.effectiveAmount.toFixed(2)}.`,
          ),
        });
        ledgerEffective = mutation.effectiveAmount;
        ledgerReversed = (existingLedger?.reversedAmount ?? 0) + mutation.reversedDelta;
        outcome = "gift_adjusted";
      } else if (eventType === "donation_completed" && paymentSource === "bank_account") {
        outcome = "awaiting_settlement";
      }

      const settlementAt = donation?.settlement_date ? new Date(donation.settlement_date) : null;
      const commitmentUid =
        typeof envelope.payload?.commitment_uid === "string"
          ? envelope.payload.commitment_uid
          : existingLedger?.commitmentUid ?? null;

      await txUpsertAnedotLedger(tx, {
        anedotDonationId: donationId,
        intentId: reconciled.intentId || existingLedger?.intentId || null,
        userId: ownerUserId,
        fund: reconciled.fund,
        grossAmount: gross,
        netAmount,
        feeAmount,
        effectiveAmount: ledgerEffective,
        reversedAmount: ledgerReversed,
        currency,
        paymentSource,
        lifecycleStatus: nextLifecycle,
        lifecycleRank: nextRank,
        givingRecordId,
        commitmentUid,
        actionPageId: payloadPageId ?? existingLedger?.actionPageId ?? null,
        settlementAt,
        lastEventType: eventType,
        lastEventAt: new Date(eventAtMs),
      });

      if (intentRow && reconciled.intentId && !intentRow.consumedAt) {
        await tx.givingAnedotIntent.update({
          where: { id: intentRow.id },
          data: { consumedAt: new Date() },
        });
      }

      await txFinalizeAnedotWebhookDelivery(tx, requestId, outcome);
      return { status: 200, outcome };
    });

    if (thankYouRecordId) {
      void queueAnedotThankYou(prisma, thankYouRecordId);
    }

    return { ...result, anedotDonationId: donationId };
  } catch (error) {
    console.error("Anedot webhook ledger error:", error);
    return { status: 500, outcome: "ledger_error" };
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
      action_page_id: "test-page",
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
