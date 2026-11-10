import type Stripe from "stripe";
import { getUserById } from "@/lib/auth-server";
import type { PublicMember } from "@/lib/auth-types";
import { recordGiftFromCheckoutSession } from "@/lib/giving-checkout-server";
import {
  checkoutSessionAuthorizedForMember,
  isShanahGivingCheckoutSession,
} from "@/lib/giving-stripe-eligibility";
import { getMemberStripeCustomerId } from "@/lib/giving-stripe-member-sync";
import {
  checkoutSessionEligibleForMemberSync,
  stripeCheckoutMetadataOwnerConflict,
  stripeCustomerVerifiedForMember,
} from "@/lib/giving-stripe-member-sync-policy";
import { getGivingRecordByStripeSessionId } from "@/lib/giving-server";
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
import { giftAmountFromMetadata } from "@/lib/giving-stripe-recovery-amounts";

export type VerifiedCheckoutOwnershipBasis =
  | "verified_customer_and_client_reference"
  | "verified_customer_and_metadata_userId"
  | "verified_customer_and_linked_customer";

export type TargetedCheckoutRecoveryResult =
  | {
      ok: true;
      outcome: "recorded" | "already_recorded_for_member";
      recordId: string;
      givenOn: string;
      giftAmount: number;
      successAtVerified: boolean;
      ownershipBasis: VerifiedCheckoutOwnershipBasis;
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
        | "record_failed";
      message: string;
    };

function ownershipBasisForSession(
  session: Stripe.Checkout.Session,
  memberId: string,
): VerifiedCheckoutOwnershipBasis | null {
  const ref = session.client_reference_id?.trim();
  if (ref === memberId) return "verified_customer_and_client_reference";
  const metaUser = session.metadata?.userId?.trim();
  if (metaUser === memberId) return "verified_customer_and_metadata_userId";
  return "verified_customer_and_linked_customer";
}

export async function verifyTargetedCheckoutRecovery(input: {
  session: Stripe.Checkout.Session;
  member: Pick<PublicMember, "id" | "email">;
  memberStripeCustomerId: string;
}): Promise<{ ok: true; ownershipBasis: VerifiedCheckoutOwnershipBasis } | { ok: false; message: string }> {
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

  if (!checkoutSessionAuthorizedForMember(session, member, { memberStripeCustomerId })) {
    return { ok: false, message: "Session failed checkout authorization for this member." };
  }
  if (!checkoutSessionEligibleForMemberSync(session, member, memberStripeCustomerId)) {
    return { ok: false, message: "Session is not eligible for verified member sync." };
  }

  const basis = ownershipBasisForSession(session, member.id);
  if (!basis) {
    return { ok: false, message: "Could not derive verified ownership basis." };
  }

  return { ok: true, ownershipBasis: basis };
}

export async function applyTargetedCheckoutGiftRecovery(input: {
  memberUserId: string;
  stripeSessionId: string;
  actor: Pick<PublicMember, "id" | "name" | "email">;
}) {
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
    expand: ["line_items"],
  });

  const eventScope = createMemberReconcileEventScope();
  const settlement = await resolveCheckoutSessionSettlement(stripe, session, eventScope);
  if (!stripeSettlementPaymentSucceeded(settlement)) {
    const audit = await writeRecoveryAudit({
      memberUserId: member.id,
      stripeSessionId: session.id,
      stripePaymentIntentId: null,
      actor: input.actor,
      ownershipBasis: null,
      giftAmount: 0,
      feeAmount: null,
      givenOn: "rejected",
      successAtVerified: false,
      outcome: "rejected_payment_not_verified",
      details: { reason: settlement.status === "not_paid" ? settlement.reason : settlement },
    });
    return {
      ok: false as const,
      outcome: "rejected_payment_not_verified" as const,
      message: "Payment success is not verified for this checkout.",
      auditId: audit.id,
    };
  }

  const verified = await verifyTargetedCheckoutRecovery({
    session,
    member,
    memberStripeCustomerId,
  });
  if (!verified.ok) {
    const audit = await writeRecoveryAudit({
      memberUserId: member.id,
      stripeSessionId: session.id,
      stripePaymentIntentId:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id ?? null,
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
      ok: false as const,
      outcome: verified.message.includes("conflict")
        ? ("rejected_owner_conflict" as const)
        : ("rejected_ownership" as const),
      message: verified.message,
      auditId: audit.id,
    };
  }

  const existing = await getGivingRecordByStripeSessionId(session.id);
  if (existing) {
    if (existing.userId && existing.userId !== member.id) {
      const audit = await writeRecoveryAudit({
        memberUserId: member.id,
        stripeSessionId: session.id,
        stripePaymentIntentId: null,
        actor: input.actor,
        ownershipBasis: verified.ownershipBasis,
        giftAmount: existing.amount,
        feeAmount: null,
        givenOn: existing.givenOn,
        successAtVerified: settlement.status === "verified",
        outcome: "rejected_other_member_record",
        details: { existingRecordId: existing.id, existingUserId: existing.userId },
      });
      return {
        ok: false as const,
        outcome: "rejected_other_member_record" as const,
        message: "A giving record for this session belongs to another member.",
        auditId: audit.id,
      };
    }
    const audit = await writeRecoveryAudit({
      memberUserId: member.id,
      stripeSessionId: session.id,
      stripePaymentIntentId: null,
      actor: input.actor,
      ownershipBasis: verified.ownershipBasis,
      giftAmount: existing.amount,
      feeAmount: null,
      givenOn: existing.givenOn,
      successAtVerified: settlement.status === "verified",
      outcome: "already_recorded_for_member",
      details: { recordId: existing.id },
    });
    return {
      ok: true as const,
      outcome: "already_recorded_for_member" as const,
      recordId: existing.id,
      givenOn: existing.givenOn,
      giftAmount: existing.amount,
      successAtVerified: settlement.status === "verified",
      ownershipBasis: verified.ownershipBasis,
      auditId: audit.id,
    };
  }

  const metadata = session.metadata ?? {};
  const totalPaid = Math.round(session.amount_total ?? 0) / 100;
  const giftAmount = giftAmountFromMetadata(metadata, totalPaid);
  const feeAmount = Number(metadata.feeAmount);
  const paidAtUnix = checkoutSettlementPaidAtUnix(settlement);
  const givenOn = paidAtUnix
    ? giftDateKeyFromUnixSeconds(paidAtUnix)
    : giftDateKeyFromUnixSeconds(session.created ?? undefined);

  const record = await recordGiftFromCheckoutSession(session, { eventScope });
  if (!record) {
    const audit = await writeRecoveryAudit({
      memberUserId: member.id,
      stripeSessionId: session.id,
      stripePaymentIntentId: null,
      actor: input.actor,
      ownershipBasis: verified.ownershipBasis,
      giftAmount,
      feeAmount: Number.isFinite(feeAmount) ? feeAmount : null,
      givenOn,
      successAtVerified: Boolean(paidAtUnix),
      outcome: "record_failed",
      details: {},
    });
    return {
      ok: false as const,
      outcome: "record_failed" as const,
      message: "Stripe session verified but record creation failed.",
      auditId: audit.id,
    };
  }

  const audit = await writeRecoveryAudit({
    memberUserId: member.id,
    stripeSessionId: session.id,
    stripePaymentIntentId:
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id ?? null,
    actor: input.actor,
    ownershipBasis: verified.ownershipBasis,
    giftAmount: record.amount,
    feeAmount: Number.isFinite(feeAmount) ? feeAmount : null,
    givenOn: record.givenOn,
    successAtVerified: Boolean(paidAtUnix),
    outcome: "recorded",
    details: { recordId: record.id },
  });

  return {
    ok: true as const,
    outcome: "recorded" as const,
    recordId: record.id,
    givenOn: record.givenOn,
    giftAmount: record.amount,
    successAtVerified: Boolean(paidAtUnix),
    ownershipBasis: verified.ownershipBasis,
    auditId: audit.id,
  };
}

async function writeRecoveryAudit(input: {
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
}) {
  const id = `grecover-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return prisma.givingStripeGiftRecoveryAudit.create({
    data: {
      id,
      memberUserId: input.memberUserId,
      stripeSessionId: input.stripeSessionId,
      stripePaymentIntentId: input.stripePaymentIntentId,
      requestedByUserId: input.actor.id,
      requestedByName: input.actor.name,
      ownershipBasis: input.ownershipBasis,
      giftAmount: input.giftAmount,
      feeAmount: input.feeAmount,
      givenOn: input.givenOn,
      successAtVerified: input.successAtVerified,
      outcome: input.outcome,
      details: input.details as object,
      createdAt: new Date(),
    },
  });
}
