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

export function checkoutSessionCorroboratedForMember(
  session: Pick<Stripe.Checkout.Session, "client_reference_id" | "metadata">,
  memberId: string,
) {
  const id = checkoutSessionCorroboratedMemberId(session);
  return Boolean(id && id === memberId);
}

export type CorroboratedOwnershipBasis =
  | "verified_customer_and_client_reference"
  | "verified_customer_and_metadata_userId"
  | "verified_customer_and_corroborated_reference_and_metadata";

export function corroboratedOwnershipBasis(
  session: Pick<Stripe.Checkout.Session, "client_reference_id" | "metadata">,
  memberId: string,
): CorroboratedOwnershipBasis | null {
  if (!checkoutSessionCorroboratedForMember(session, memberId)) return null;
  const ref = session.client_reference_id?.trim();
  const meta = metadataUserId(session.metadata?.userId);
  if (ref === memberId && meta === memberId) {
    return "verified_customer_and_corroborated_reference_and_metadata";
  }
  if (ref === memberId) return "verified_customer_and_client_reference";
  if (meta === memberId) return "verified_customer_and_metadata_userId";
  return null;
}
