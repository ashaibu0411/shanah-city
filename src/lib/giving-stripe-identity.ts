import type Stripe from "stripe";
import { getUserByEmail, getUserById } from "@/lib/auth-server";
import { normalizeGivingEmail } from "@/lib/giving-types";
import { prisma } from "@/lib/db";
import { useDatabase } from "@/lib/use-database";
import { resolveStripeCustomerId } from "@/lib/giving-stripe-invoice";

export function metadataUserId(value: string | null | undefined) {
  const id = value?.trim();
  return id || undefined;
}

export function metadataValue(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

export async function resolveUserIdFromStripeCustomerId(
  customerId: string | undefined,
): Promise<string | undefined> {
  if (!customerId || !useDatabase()) return undefined;

  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
    select: { id: true },
  });
  return user?.id;
}

export async function resolveDonorIdentity(input: {
  metadata?: Record<string, string> | null;
  clientReferenceId?: string | null;
  donorEmail?: string | null;
  stripeCustomerId?: string | null;
}): Promise<{ userId?: string; campusId?: string }> {
  let userId =
    input.clientReferenceId?.trim() || metadataUserId(input.metadata?.userId ?? undefined);
  let campusId = metadataValue(input.metadata?.campusId);

  if (!userId && input.stripeCustomerId) {
    userId = await resolveUserIdFromStripeCustomerId(input.stripeCustomerId);
  }

  const donorEmail = normalizeGivingEmail(input.donorEmail ?? undefined);
  if (!userId && donorEmail) {
    const member = await getUserByEmail(donorEmail);
    if (member) {
      userId = member.id;
      campusId = campusId ?? member.campusId;
    }
  }

  if (userId && !campusId) {
    const member = await getUserById(userId);
    if (member?.campusId) {
      campusId = member.campusId;
    }
  }

  return { userId, campusId };
}

export async function resolveDonorIdentityFromCheckoutSession(session: Stripe.Checkout.Session) {
  const donorEmail = normalizeGivingEmail(
    session.customer_details?.email ?? session.customer_email ?? undefined,
  );
  return resolveDonorIdentity({
    metadata: session.metadata ?? undefined,
    clientReferenceId: session.client_reference_id,
    donorEmail,
    stripeCustomerId: resolveStripeCustomerId(session.customer),
  });
}

export async function resolveDonorIdentityFromInvoice(
  invoice: Stripe.Invoice,
  extraMetadata: Record<string, string> = {},
) {
  const metadata = { ...(invoice.metadata ?? {}), ...extraMetadata };
  const donorEmail = normalizeGivingEmail(invoice.customer_email ?? undefined);
  return resolveDonorIdentity({
    metadata,
    clientReferenceId: metadata.clientReferenceId ?? metadata.userId,
    donorEmail,
    stripeCustomerId: resolveStripeCustomerId(invoice.customer),
  });
}
