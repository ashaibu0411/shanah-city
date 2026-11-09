import type Stripe from "stripe";
import type { PublicMember } from "@/lib/auth-types";
import { prisma } from "@/lib/db";
import { useDatabase } from "@/lib/use-database";
import {
  recordGiftFromCheckoutSession,
  recordGiftFromInvoice,
} from "@/lib/giving-checkout-server";
import {
  getGivingRecordByStripeInvoiceId,
  getGivingRecordByStripeSessionId,
  updateGivingRecord,
} from "@/lib/giving-server";
import {
  canLinkGivingRecordToMember,
  checkoutSessionAuthorizedForMember,
  isShanahGivingCheckoutSession,
  isShanahGivingInvoiceMetadata,
} from "@/lib/giving-stripe-eligibility";
import { resolveStripeInvoiceSubscriptionId } from "@/lib/giving-stripe-invoice";
import {
  isEligibleReconcileGiftInvoice,
  isPaidCheckoutSession,
} from "@/lib/giving-reconcile-server";
import { getStripe, isStripeGivingConfigured } from "@/lib/stripe-server";

const MEMBER_SYNC_DAYS = 90;
const MEMBER_SYNC_PAGE_LIMIT = 100;
const MEMBER_SYNC_MAX_PAGES = 5;

export async function getMemberStripeCustomerId(userId: string) {
  if (!useDatabase()) return null;
  const row = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true },
  });
  return row?.stripeCustomerId?.trim() || null;
}

/** Stripe customer sync: same fail-closed rules as checkout confirm. */
export function checkoutSessionEligibleForMemberSync(
  session: Pick<
    Stripe.Checkout.Session,
    "metadata" | "client_reference_id" | "customer" | "customer_details" | "customer_email" | "mode"
  >,
  member: { id: string; email: string },
  memberStripeCustomerId: string | null | undefined,
) {
  return checkoutSessionAuthorizedForMember(session, member, {
    memberStripeCustomerId,
  });
}

function checkoutInvoiceEligibleForMemberSync(
  invoice: Pick<Stripe.Invoice, "customer" | "customer_email" | "metadata">,
  member: { id: string; email: string },
  memberStripeCustomerId: string | null,
) {
  const customer =
    typeof invoice.customer === "string"
      ? invoice.customer
      : invoice.customer && typeof invoice.customer === "object"
        ? invoice.customer.id
        : null;
  if (memberStripeCustomerId && customer && customer === memberStripeCustomerId) {
    return true;
  }
  const metaUser = invoice.metadata?.userId?.trim();
  if (metaUser && metaUser === member.id) return true;
  return false;
}

async function invoiceMetadataForSync(invoice: Stripe.Invoice) {
  let extraMetadata: Record<string, string> = { ...(invoice.metadata ?? {}) };
  const subscriptionId = resolveStripeInvoiceSubscriptionId(invoice);
  if (subscriptionId && isStripeGivingConfigured()) {
    const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
    extraMetadata = { ...subscription.metadata, ...extraMetadata };
  }
  return extraMetadata;
}

async function tryClaimOrphanForMember(
  record: Awaited<ReturnType<typeof getGivingRecordByStripeSessionId>>,
  member: Pick<PublicMember, "id" | "email">,
) {
  if (!record || record.userId) return false;
  if (!canLinkGivingRecordToMember(record, member)) return false;
  await updateGivingRecord(record.id, { userId: member.id });
  return true;
}

/**
 * Self-service: for the signed-in member's linked Stripe customer only, record missing
 * paid Shanah gifts or claim null-userId rows when identity is unambiguous — never
 * reassign gifts owned by another userId.
 */
export async function syncVerifiedStripeGiftsForMember(
  member: Pick<PublicMember, "id" | "email" | "name" | "campusId">,
) {
  if (!isStripeGivingConfigured() || !useDatabase()) return { recorded: 0, linked: 0 };

  const customerId = await getMemberStripeCustomerId(member.id);
  if (!customerId) return { recorded: 0, linked: 0 };

  const stripe = getStripe();
  const sinceUnix = Math.floor((Date.now() - MEMBER_SYNC_DAYS * 86_400_000) / 1000);
  let recorded = 0;
  let linked = 0;

  let sessionStartingAfter: string | undefined;
  for (let page = 0; page < MEMBER_SYNC_MAX_PAGES; page++) {
    const list = await stripe.checkout.sessions.list({
      customer: customerId,
      limit: MEMBER_SYNC_PAGE_LIMIT,
      created: { gte: sinceUnix },
      ...(sessionStartingAfter ? { starting_after: sessionStartingAfter } : {}),
    });
    if (list.data.length === 0) break;

    for (const session of list.data) {
      if (!isPaidCheckoutSession(session) || !isShanahGivingCheckoutSession(session)) continue;
      if (!checkoutSessionEligibleForMemberSync(session, member, customerId)) continue;

      const existing = await getGivingRecordByStripeSessionId(session.id);
      if (!existing) {
        const created = await recordGiftFromCheckoutSession(session);
        if (created) recorded += 1;
        continue;
      }
      if (await tryClaimOrphanForMember(existing, member)) {
        linked += 1;
      }
    }

    if (!list.has_more) break;
    sessionStartingAfter = list.data[list.data.length - 1]?.id;
  }

  let invoiceStartingAfter: string | undefined;
  for (let page = 0; page < MEMBER_SYNC_MAX_PAGES; page++) {
    const list = await stripe.invoices.list({
      customer: customerId,
      limit: MEMBER_SYNC_PAGE_LIMIT,
      created: { gte: sinceUnix },
      ...(invoiceStartingAfter ? { starting_after: invoiceStartingAfter } : {}),
    });
    if (list.data.length === 0) break;

    for (const invoice of list.data) {
      const extraMetadata = await invoiceMetadataForSync(invoice);
      if (!isEligibleReconcileGiftInvoice(invoice) || !isShanahGivingInvoiceMetadata(extraMetadata)) {
        continue;
      }
      if (!checkoutInvoiceEligibleForMemberSync(invoice, member, customerId)) continue;

      const existing = await getGivingRecordByStripeInvoiceId(invoice.id);
      if (!existing) {
        const created = await recordGiftFromInvoice(invoice, extraMetadata);
        if (created) recorded += 1;
        continue;
      }
      if (await tryClaimOrphanForMember(existing, member)) {
        linked += 1;
      }
    }

    if (!list.has_more) break;
    invoiceStartingAfter = list.data[list.data.length - 1]?.id;
  }

  return { recorded, linked };
}
