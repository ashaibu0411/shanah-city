import type { Prisma } from "@prisma/client";
import type Stripe from "stripe";
import { getUserById } from "@/lib/auth-server";
import type { PublicMember } from "@/lib/auth-types";
import { fundLabel, normalizeGivingEmail, recurringGiftNote, type GivingFund } from "@/lib/giving-types";
import {
  corroboratedOwnershipBasis,
  checkoutSessionCorroboratedForMember,
  type CorroboratedOwnershipBasis,
} from "@/lib/giving-stripe-checkout-ownership";
import { isShanahGivingCheckoutSession } from "@/lib/giving-stripe-eligibility";
import { getMemberStripeCustomerId } from "@/lib/giving-stripe-member-sync";
import { stripeCheckoutMetadataOwnerConflict, stripeCustomerVerifiedForMember } from "@/lib/giving-stripe-member-sync-policy";
import { resolveStripeCustomerId } from "@/lib/giving-stripe-invoice";
import { isPaidCheckoutSession } from "@/lib/giving-reconcile-server";
import {
  checkoutSettlementPaidAtUnix,
  resolveCheckoutSessionSettlement,
  stripeSettlementPaymentSucceeded,
} from "@/lib/giving-stripe-checkout-settlement";
import { createMemberReconcileEventScope } from "@/lib/giving-stripe-reconcile-event-scope";
import { giftDateKeyFromUnixSeconds } from "@/lib/giving-stripe-eligibility";
import { getStripe, isStripeGivingConfigured } from "@/lib/stripe-server";
import { prisma } from "@/lib/db";
import { useDatabase } from "@/lib/use-database";
import { resolveVerifiedCheckoutGiftAmounts } from "@/lib/giving-stripe-recovery-amounts";
import { formatPersonNameForDisplay } from "@/lib/member-display-name";

export type VerifiedCheckoutOwnershipBasis = CorroboratedOwnershipBasis;

export type TargetedCheckoutRecoveryResult =
  | {
      ok: true;
      outcome: "recorded" | "already_recorded_for_member";
      recordId: string;
      givenOn: string;
      giftAmount: number;
      successAtVerified: boolean;
      ownershipBasis: VerifiedCheckoutOwnershipBasis;
      auditId: string;
    }
  | {
      ok: false;
      outcome:
        | "rejected_not_paid"
        | "rejected_not_shanah_checkout"
        | "rejected_ownership"
        | "rejected_owner_conflict"
        | "rejected_other_member_record"
        | "rejected_payment_not_verified"
        | "rejected_success_date_unverified"
        | "rejected_amount_not_verified"
        | "record_failed";
      message: string;
      auditId?: string;
    };

export async function verifyTargetedCheckoutRecovery(input: {
  session: Stripe.Checkout.Session;
  member: Pick<PublicMember, "id" | "email">;
  memberStripeCustomerId: string;
}): Promise<
  { ok: true; ownershipBasis: VerifiedCheckoutOwnershipBasis } | { ok: false; message: string }
> {
  const { session, member, memberStripeCustomerId } = input;

  if (!isPaidCheckoutSession(session)) {
    return { ok: false, message: "Checkout session is not paid." };
  }
  if (!isShanahGivingCheckoutSession(session)) {
    return { ok: false, message: "Checkout session is not a Shanah giving checkout." };
  }

  const paymentCustomer = resolveStripeCustomerId(session.customer);
  if (!stripeCustomerVerifiedForMember(paymentCustomer, memberStripeCustomerId)) {
    return { ok: false, message: "Stripe customer on session does not match member linked customer." };
  }

  const ownerConflict = stripeCheckoutMetadataOwnerConflict(session, member);
  if (ownerConflict.conflict) {
    return { ok: false, message: `Metadata owner conflict: ${ownerConflict.reason}` };
  }

  if (!checkoutSessionCorroboratedForMember(session, member.id)) {
    return {
      ok: false,
      message:
        "Recovery requires corroborated client_reference_id or metadata.userId matching the member (customer link alone is insufficient).",
    };
  }

  const basis = corroboratedOwnershipBasis(session, member.id);
  if (!basis) {
    return { ok: false, message: "Could not derive corroborated ownership basis." };
  }

  return { ok: true, ownershipBasis: basis };
}

type RecoveryAuditInput = {
  memberUserId: string;
  stripeSessionId: string;
  stripePaymentIntentId: string | null;
  actor: Pick<PublicMember, "id" | "name">;
  ownershipBasis: VerifiedCheckoutOwnershipBasis | null;
  giftAmount: number;
  feeAmount: number | null;
  givenOn: string;
  successAtVerified: boolean;
  outcome: string;
  details: Record<string, unknown>;
};

function parseFund(value: string | null | undefined): GivingFund {
  return String(value ?? "offering") as GivingFund;
}

function giftNotesFromMetadata(metadata: Record<string, string>, baseNote: string) {
  const fee = Number(metadata.feeAmount);
  if (metadata.coverFees === "true" && Number.isFinite(fee) && fee > 0) {
    return `${baseNote} Donor added $${fee.toFixed(2)} to cover processing fees.`;
  }
  return baseNote;
}

export async function applyTargetedCheckoutGiftRecovery(input: {
  memberUserId: string;
  stripeSessionId: string;
  actor: Pick<PublicMember, "id" | "name" | "email">;
}): Promise<TargetedCheckoutRecoveryResult> {
  if (!isStripeGivingConfigured() || !useDatabase()) {
    throw new Error("Recovery requires Stripe and database.");
  }

  const memberRow = await getUserById(input.memberUserId);
  if (!memberRow) {
    throw new Error("Member not found.");
  }

  const member = { id: memberRow.id, email: memberRow.email, name: memberRow.name };
  const memberStripeCustomerId = await getMemberStripeCustomerId(member.id);
  if (!memberStripeCustomerId) {
    throw new Error("Member has no linked Stripe customer.");
  }

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(input.stripeSessionId, {
    expand: ["line_items.data.price.product"],
  });

  const eventScope = createMemberReconcileEventScope();
  const settlement = await resolveCheckoutSessionSettlement(stripe, session, eventScope);
  const paidAtUnix = checkoutSettlementPaidAtUnix(settlement);
  const successAtVerified = Boolean(paidAtUnix);

  const auditOnly = async (row: RecoveryAuditInput) => {
    const id = `grecover-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const created = await prisma.givingStripeGiftRecoveryAudit.create({
      data: {
        id,
        memberUserId: row.memberUserId,
        stripeSessionId: row.stripeSessionId,
        stripePaymentIntentId: row.stripePaymentIntentId,
        requestedByUserId: row.actor.id,
        requestedByName: row.actor.name,
        ownershipBasis: row.ownershipBasis,
        giftAmount: row.giftAmount,
        feeAmount: row.feeAmount,
        givenOn: row.givenOn,
        successAtVerified: row.successAtVerified,
        outcome: row.outcome,
        details: row.details as Prisma.InputJsonValue,
        createdAt: new Date(),
      },
    });
    return created.id;
  };

  const piId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  if (!stripeSettlementPaymentSucceeded(settlement)) {
    const auditId = await auditOnly({
      memberUserId: member.id,
      stripeSessionId: session.id,
      stripePaymentIntentId: piId,
      actor: input.actor,
      ownershipBasis: null,
      giftAmount: 0,
      feeAmount: null,
      givenOn: "rejected",
      successAtVerified: false,
      outcome: "rejected_payment_not_verified",
      details: { reason: settlement.status === "not_paid" ? settlement.reason : settlement.status },
    });
    return {
      ok: false,
      outcome: "rejected_payment_not_verified",
      message: "Payment success is not verified for this checkout.",
      auditId,
    };
  }

  if (!paidAtUnix) {
    const auditId = await auditOnly({
      memberUserId: member.id,
      stripeSessionId: session.id,
      stripePaymentIntentId: piId,
      actor: input.actor,
      ownershipBasis: null,
      giftAmount: 0,
      feeAmount: null,
      givenOn: "rejected",
      successAtVerified: false,
      outcome: "rejected_success_date_unverified",
      details: {
        reason: settlement.status === "success_date_unknown" ? settlement.reason : "no_verified_paid_at",
      },
    });
    return {
      ok: false,
      outcome: "rejected_success_date_unverified",
      message:
        "Verified Stripe success timestamp required before recovery (do not use Checkout created date for ACH).",
      auditId,
    };
  }

  const verified = await verifyTargetedCheckoutRecovery({
    session,
    member,
    memberStripeCustomerId,
  });
  if (!verified.ok) {
    const auditId = await auditOnly({
      memberUserId: member.id,
      stripeSessionId: session.id,
      stripePaymentIntentId: piId,
      actor: input.actor,
      ownershipBasis: null,
      giftAmount: 0,
      feeAmount: null,
      givenOn: "rejected",
      successAtVerified: false,
      outcome: verified.message.includes("conflict")
        ? "rejected_owner_conflict"
        : "rejected_ownership",
      details: { message: verified.message },
    });
    return {
      ok: false,
      outcome: verified.message.includes("conflict")
        ? "rejected_owner_conflict"
        : "rejected_ownership",
      message: verified.message,
      auditId,
    };
  }

  const amounts = resolveVerifiedCheckoutGiftAmounts(session);
  if (!amounts.ok) {
    const auditId = await auditOnly({
      memberUserId: member.id,
      stripeSessionId: session.id,
      stripePaymentIntentId: piId,
      actor: input.actor,
      ownershipBasis: verified.ownershipBasis,
      giftAmount: 0,
      feeAmount: null,
      givenOn: "rejected",
      successAtVerified: true,
      outcome: "rejected_amount_not_verified",
      details: { reason: amounts.reason },
    });
    return {
      ok: false,
      outcome: "rejected_amount_not_verified",
      message: "Gift and fee amounts must be verified from metadata or line items.",
      auditId,
    };
  }

  const givenOn = giftDateKeyFromUnixSeconds(paidAtUnix);
  const metadata = session.metadata ?? {};
  const donorEmail = normalizeGivingEmail(
    session.customer_details?.email ?? session.customer_email ?? undefined,
  );
  const donorName =
    formatPersonNameForDisplay(memberRow.name) ||
    session.customer_details?.name?.trim() ||
    "Online donor";
  const baseNote = "Finance-targeted Checkout recovery.";
  const notes = giftNotesFromMetadata(metadata, baseNote);

  const txResult = await prisma.$transaction(async (tx) => {
    const existing = await tx.givingRecord.findUnique({
      where: { stripeSessionId: session.id },
    });

    if (existing) {
      if (existing.userId && existing.userId !== member.id) {
        const auditId = await writeAuditInTx(tx, {
          memberUserId: member.id,
          stripeSessionId: session.id,
          stripePaymentIntentId: piId,
          actor: input.actor,
          ownershipBasis: verified.ownershipBasis,
          giftAmount: existing.amount,
          feeAmount: amounts.feeAmount,
          givenOn: existing.givenOn,
          successAtVerified: true,
          outcome: "rejected_other_member_record",
          details: { existingRecordId: existing.id, existingUserId: existing.userId },
        });
        return { kind: "other_member" as const, auditId, existing };
      }
      const auditId = await writeAuditInTx(tx, {
        memberUserId: member.id,
        stripeSessionId: session.id,
        stripePaymentIntentId: piId,
        actor: input.actor,
        ownershipBasis: verified.ownershipBasis,
        giftAmount: existing.amount,
        feeAmount: amounts.feeAmount,
        givenOn: existing.givenOn,
        successAtVerified: true,
        outcome: "already_recorded_for_member",
        details: { recordId: existing.id },
      });
      return { kind: "already" as const, auditId, existing };
    }

    const now = new Date();
    const record = await tx.givingRecord.create({
      data: {
        id: `give-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        userId: member.id,
        donorName,
        donorEmail: donorEmail ?? null,
        amount: amounts.giftAmount,
        currency: (session.currency ?? "usd").toUpperCase(),
        fund: parseFund(metadata.fund),
        method: "stripe",
        givenOn,
        campusId: metadata.campusId?.trim() || memberRow.campusId || null,
        notes,
        source: "stripe",
        stripeSessionId: session.id,
        stripeInvoiceId: null,
        recordedBy: input.actor.id,
        recordedByName: input.actor.name,
        createdAt: now,
        updatedAt: now,
      },
    });

    const auditId = await writeAuditInTx(tx, {
      memberUserId: member.id,
      stripeSessionId: session.id,
      stripePaymentIntentId: piId,
      actor: input.actor,
      ownershipBasis: verified.ownershipBasis,
      giftAmount: amounts.giftAmount,
      feeAmount: amounts.feeAmount,
      givenOn,
      successAtVerified: true,
      outcome: "recorded",
      details: {
        recordId: record.id,
        amountSource: amounts.source,
        fundLabel: fundLabel(parseFund(metadata.fund)),
      },
    });

    return { kind: "recorded" as const, auditId, record };
  });

  if (txResult.kind === "other_member") {
    return {
      ok: false,
      outcome: "rejected_other_member_record",
      message: "A giving record for this session belongs to another member.",
      auditId: txResult.auditId,
    };
  }

  if (txResult.kind === "already") {
    return {
      ok: true,
      outcome: "already_recorded_for_member",
      recordId: txResult.existing.id,
      givenOn: txResult.existing.givenOn,
      giftAmount: txResult.existing.amount,
      successAtVerified: true,
      ownershipBasis: verified.ownershipBasis,
      auditId: txResult.auditId,
    };
  }

  return {
    ok: true,
    outcome: "recorded",
    recordId: txResult.record.id,
    givenOn: txResult.record.givenOn,
    giftAmount: txResult.record.amount,
    successAtVerified: true,
    ownershipBasis: verified.ownershipBasis,
    auditId: txResult.auditId,
  };
}

async function writeAuditInTx(
  tx: Prisma.TransactionClient,
  row: RecoveryAuditInput,
) {
  const id = `grecover-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  await tx.givingStripeGiftRecoveryAudit.create({
    data: {
      id,
      memberUserId: row.memberUserId,
      stripeSessionId: row.stripeSessionId,
      stripePaymentIntentId: row.stripePaymentIntentId,
      requestedByUserId: row.actor.id,
      requestedByName: row.actor.name,
      ownershipBasis: row.ownershipBasis,
      giftAmount: row.giftAmount,
      feeAmount: row.feeAmount,
      givenOn: row.givenOn,
      successAtVerified: row.successAtVerified,
      outcome: row.outcome,
      details: row.details as Prisma.InputJsonValue,
      createdAt: new Date(),
    },
  });
  return id;
}
