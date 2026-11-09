import type Stripe from "stripe";
import { metadataUserId } from "@/lib/giving-stripe-identity";
import { resolveStripeCustomerId } from "@/lib/giving-stripe-invoice";
import { checkoutSessionAuthorizedForMember } from "@/lib/giving-stripe-eligibility";

export const MEMBER_STRIPE_SYNC_DAYS = 90;
export const MEMBER_STRIPE_SYNC_PAGE_LIMIT = 100;
export const MEMBER_STRIPE_SYNC_MAX_PAGES = 5;
export const MEMBER_STRIPE_SYNC_TIMEOUT_MS = 12_000;
export const MEMBER_STRIPE_SYNC_MIN_GAP_MS = 60_000;
export const MEMBER_STRIPE_SYNC_SUCCESS_COOLDOWN_MS = 15 * 60_000;
export const MEMBER_STRIPE_SYNC_ERROR_BASE_MS = 5 * 60_000;
export const MEMBER_STRIPE_SYNC_ERROR_MAX_MS = 30 * 60_000;

export type MemberStripeSyncTrigger = "signin" | "history";

export type StripeMetadataOwnerConflict =
  | { conflict: false }
  | {
      conflict: true;
      reason: string;
      metadataUserId?: string;
      clientReferenceId?: string;
    };

export function stripeCustomerVerifiedForMember(
  stripeCustomerOnPayment: string | null | undefined,
  memberStripeCustomerId: string | null | undefined,
) {
  const memberCustomer = memberStripeCustomerId?.trim();
  const paymentCustomer = stripeCustomerOnPayment?.trim();
  return Boolean(memberCustomer && paymentCustomer && memberCustomer === paymentCustomer);
}

export function stripeCheckoutMetadataOwnerConflict(
  session: Pick<Stripe.Checkout.Session, "metadata" | "client_reference_id">,
  member: { id: string },
): StripeMetadataOwnerConflict {
  const ref = session.client_reference_id?.trim();
  if (ref && ref !== member.id) {
    return {
      conflict: true,
      reason: "client_reference_id_conflict",
      clientReferenceId: ref,
    };
  }
  const metaUser = metadataUserId(session.metadata?.userId);
  if (metaUser && metaUser !== member.id) {
    return {
      conflict: true,
      reason: "metadata_userId_conflict",
      metadataUserId: metaUser,
      clientReferenceId: ref,
    };
  }
  return { conflict: false };
}

export function stripeInvoiceMetadataOwnerConflict(
  invoice: Pick<Stripe.Invoice, "metadata">,
  extraMetadata: Record<string, string>,
  member: { id: string },
): StripeMetadataOwnerConflict {
  const metadata = { ...extraMetadata, ...(invoice.metadata ?? {}) };
  const clientRef = metadata.clientReferenceId?.trim();
  if (clientRef && clientRef !== member.id) {
    return {
      conflict: true,
      reason: "invoice_client_reference_conflict",
      clientReferenceId: clientRef,
    };
  }
  const metaUser = metadataUserId(metadata.userId);
  if (metaUser && metaUser !== member.id) {
    return {
      conflict: true,
      reason: "invoice_metadata_userId_conflict",
      metadataUserId: metaUser,
    };
  }
  return { conflict: false };
}

/** Stripe customer sync: verified customer + no metadata owner conflict + fail-closed auth. */
export function checkoutSessionEligibleForMemberSync(
  session: Pick<
    Stripe.Checkout.Session,
    "metadata" | "client_reference_id" | "customer" | "customer_details" | "customer_email" | "mode"
  >,
  member: { id: string; email: string },
  memberStripeCustomerId: string | null | undefined,
) {
  const paymentCustomer = resolveStripeCustomerId(session.customer);
  if (!stripeCustomerVerifiedForMember(paymentCustomer, memberStripeCustomerId)) {
    return false;
  }
  if (stripeCheckoutMetadataOwnerConflict(session, member).conflict) {
    return false;
  }
  return checkoutSessionAuthorizedForMember(session, member, {
    memberStripeCustomerId,
  });
}

export function memberStripeSyncErrorBackoffMs(consecutiveFailures: number) {
  const failures = Math.max(0, consecutiveFailures);
  const backoff = MEMBER_STRIPE_SYNC_ERROR_BASE_MS * 2 ** Math.min(failures, 3);
  return Math.min(backoff, MEMBER_STRIPE_SYNC_ERROR_MAX_MS);
}

export function shouldAttemptMemberStripeSync(input: {
  nowMs: number;
  lastAttemptAtMs: number | null;
  lastSuccessAtMs: number | null;
  consecutiveFailures: number;
  trigger: MemberStripeSyncTrigger;
}) {
  const { nowMs, lastAttemptAtMs, lastSuccessAtMs, consecutiveFailures, trigger } = input;

  if (lastAttemptAtMs !== null && nowMs - lastAttemptAtMs < MEMBER_STRIPE_SYNC_MIN_GAP_MS) {
    return { run: false as const, reason: "debounce" as const };
  }

  if (
    lastSuccessAtMs !== null &&
    nowMs - lastSuccessAtMs < MEMBER_STRIPE_SYNC_SUCCESS_COOLDOWN_MS
  ) {
    return { run: false as const, reason: "success_cooldown" as const };
  }

  if (consecutiveFailures > 0 && lastAttemptAtMs !== null) {
    const backoff = memberStripeSyncErrorBackoffMs(consecutiveFailures);
    if (nowMs - lastAttemptAtMs < backoff) {
      return { run: false as const, reason: "error_backoff" as const };
    }
  }

  return { run: true as const };
}

export function isStripeMemberSyncTimeoutError(error: unknown) {
  return error instanceof Error && error.message === "stripe_member_sync_timeout";
}

export const MEMBER_STRIPE_SYNC_ATTEMPT_STATUSES = [
  "ok",
  "partial",
  "stripe_error",
  "timeout",
] as const;

export type MemberStripeSyncAttemptStatus = (typeof MEMBER_STRIPE_SYNC_ATTEMPT_STATUSES)[number];

export function isMemberStripeSyncAttemptStatus(
  status: string,
): status is MemberStripeSyncAttemptStatus {
  return (MEMBER_STRIPE_SYNC_ATTEMPT_STATUSES as readonly string[]).includes(status);
}

/** Cooldown/debounce use real Stripe attempts only — skipped_cooldown rows (if any) are ignored. */
export function summarizeMemberStripeSyncRuns(
  runs: Array<{ status: string; createdAt: Date; finishedAt: Date | null }>,
) {
  const attempts = runs.filter((row) => isMemberStripeSyncAttemptStatus(row.status));
  const lastAttemptAt = attempts[0]?.createdAt ?? null;
  const lastSuccess = attempts.find((row) => row.status === "ok");
  const lastSuccessAt = lastSuccess?.finishedAt ?? lastSuccess?.createdAt ?? null;

  let consecutiveFailures = 0;
  for (const row of attempts) {
    if (row.status === "ok") break;
    if (row.status === "stripe_error" || row.status === "timeout" || row.status === "partial") {
      consecutiveFailures += 1;
    }
  }

  return { lastAttemptAt, lastSuccessAt, consecutiveFailures };
}
