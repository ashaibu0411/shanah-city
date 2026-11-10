import type Stripe from "stripe";
import { metadataUserId } from "@/lib/giving-stripe-identity";

/** Immutable Checkout pointers to a Shanah member (not email-only). */
export function checkoutSessionCorroboratedMemberId(
  session: Pick<Stripe.Checkout.Session, "client_reference_id" | "metadata">,
): string | null {
  const ref = session.client_reference_id?.trim() || null;
  const meta = metadataUserId(session.metadata?.userId) ?? null;
  if (ref && meta && ref !== meta) return null;
  return ref ?? meta;
}

export function checkoutSessionHasCorroboratedMemberIdentity(
  session: Pick<Stripe.Checkout.Session, "client_reference_id" | "metadata">,
) {
  return Boolean(checkoutSessionCorroboratedMemberId(session));
}

/** Member attribution for GivingRecord — corroborated IDs only (never email-only). */
export function givingRecordUserIdFromCheckoutSession(
  session: Pick<Stripe.Checkout.Session, "client_reference_id" | "metadata">,
): string | undefined {
  const id = checkoutSessionCorroboratedMemberId(session);
  return id ?? undefined;
}

export function checkoutMetadataOwnerConflictBlocksRecording(
  session: Pick<Stripe.Checkout.Session, "client_reference_id" | "metadata">,
): boolean {
  const ref = session.client_reference_id?.trim() || null;
  const meta = metadataUserId(session.metadata?.userId) ?? null;
  return Boolean(ref && meta && ref !== meta);
}

export function checkoutSessionCorroboratedForMember(
  session: Pick<Stripe.Checkout.Session, "client_reference_id" | "metadata">,
  memberId: string,
) {
  const id = checkoutSessionCorroboratedMemberId(session);
  return Boolean(id && id === memberId);
}

/** Both immutable Checkout member pointers agree (required when Stripe customer is absent). */
export function checkoutSessionDualCorroboratedForMember(
  session: Pick<Stripe.Checkout.Session, "client_reference_id" | "metadata">,
  memberId: string,
) {
  const ref = session.client_reference_id?.trim();
  const meta = metadataUserId(session.metadata?.userId);
  return ref === memberId && meta === memberId;
}

export type CorroboratedOwnershipBasis =
  | "verified_customer_and_client_reference"
  | "verified_customer_and_metadata_userId"
  | "verified_customer_and_corroborated_reference_and_metadata"
  | "verified_dual_reference_without_stripe_customer";

export function corroboratedOwnershipBasis(
  session: Pick<Stripe.Checkout.Session, "client_reference_id" | "metadata" | "customer">,
  memberId: string,
): CorroboratedOwnershipBasis | null {
  if (!checkoutSessionCorroboratedForMember(session, memberId)) return null;
  const ref = session.client_reference_id?.trim();
  const meta = metadataUserId(session.metadata?.userId);
  const hasLinkedCustomer = Boolean(
    typeof session.customer === "string"
      ? session.customer.trim()
      : session.customer?.id?.trim(),
  );
  if (ref === memberId && meta === memberId) {
    if (!hasLinkedCustomer) {
      return "verified_dual_reference_without_stripe_customer";
    }
    return "verified_customer_and_corroborated_reference_and_metadata";
  }
  if (ref === memberId) return "verified_customer_and_client_reference";
  if (meta === memberId) return "verified_customer_and_metadata_userId";
  return null;
}
