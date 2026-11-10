import assert from "node:assert/strict";
import { Prisma } from "@prisma/client";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  isEligibleReconcileGiftInvoice,
  isPaidCheckoutSession,
  isPaidStripeInvoice,
} from "../src/lib/giving-reconcile-server";
import {
  stripeInvoicePaidAtUnknown,
  stripeInvoiceSettlementPaidAtUnix,
  stripeListCreatedGteWithPaidAtLookback,
  stripeObjectInPaidWindow,
} from "../src/lib/giving-stripe-paid-at";
import { parseGivingReconcileDateWindow } from "../src/lib/giving-reconcile-window";
import { mergeMemberVisibleGivingRecords } from "../src/lib/giving-member-merge";
import { resolveStripeInvoiceSubscriptionId, resolveStripeCustomerId } from "../src/lib/giving-stripe-invoice";
import { metadataUserId } from "../src/lib/giving-stripe-identity";
import { redactEmailForLogs, redactStripeId } from "../src/lib/giving-privacy-redact";
import { bumpSkipReason, emptyMemberStripeSyncReport } from "../src/lib/giving-stripe-member-sync-report";
import {
  canClaimMemberStripeSyncLease,
  isMemberStripeSyncLeaseExpired,
  isMissingLeaseTableError,
  memberStripeSyncLockAcquireDeniedReason,
  MEMBER_STRIPE_SYNC_LEASE_MS,
} from "../src/lib/giving-stripe-member-sync-lock";
import {
  GIVING_HISTORY_AFTER_AUTH_POLL_MS,
  GIVING_HISTORY_REFRESH_MAX_AGE_MS,
  parseGivingHistoryRefreshStamp,
} from "../src/lib/giving-history-client";
import {
  checkoutSessionEligibleForMemberSync,
  shouldAttemptMemberStripeSync,
  stripeCheckoutMetadataOwnerConflict,
  stripeInvoiceMetadataOwnerConflict,
  stripeCustomerVerifiedForMember,
  memberStripeSyncErrorBackoffMs,
  summarizeMemberStripeSyncRuns,
  MEMBER_STRIPE_SYNC_MIN_GAP_MS,
  MEMBER_STRIPE_SYNC_SUCCESS_COOLDOWN_MS,
} from "../src/lib/giving-stripe-member-sync-policy";
import {
  canLinkGivingRecordToMember,
  checkoutSessionAuthorizedForMember,
  giftGivenOnFromCheckoutSession,
  giftGivenOnFromInvoice,
  isShanahGivingCheckoutSession,
  isShanahGivingInvoiceMetadata,
  isShanahGivingStripeMetadata,
  stripeInvoiceIsFullyRefunded,
} from "../src/lib/giving-stripe-eligibility";
import type { GivingRecord } from "../src/lib/giving-types";

const GIVING_META = {
  fund: "offering",
  giftAmount: "50",
  frequency: "once",
  userId: "member-a",
};

function sessionFixture(overrides: Record<string, unknown> = {}) {
  return {
    mode: "payment",
    payment_status: "paid",
    metadata: GIVING_META,
    client_reference_id: "member-a",
    customer: "cus_linked",
    customer_details: { email: "donor@shanah.city" },
    created: 1_700_000_000,
    ...overrides,
  } as never;
}

assert.equal(metadataUserId("  "), undefined);
assert.equal(metadataUserId("member-1"), "member-1");

assert.equal(isShanahGivingStripeMetadata(GIVING_META), true);
assert.equal(isShanahGivingStripeMetadata({ fund: "offering" }), false);
assert.equal(isShanahGivingCheckoutSession(sessionFixture()), true);
assert.equal(
  isShanahGivingCheckoutSession(sessionFixture({ metadata: { shop: "1" } })),
  false,
);
assert.equal(isShanahGivingInvoiceMetadata(GIVING_META), true);

assert.equal(
  isPaidCheckoutSession({ mode: "payment", payment_status: "paid" }),
  true,
);
assert.equal(
  isPaidCheckoutSession({ mode: "payment", payment_status: "unpaid" }),
  false,
);
assert.equal(
  isPaidCheckoutSession({ mode: "subscription", payment_status: "paid" }),
  false,
);

assert.equal(isPaidStripeInvoice({ status: "paid", amount_paid: 1000 }), true);
assert.equal(isPaidStripeInvoice({ status: "open", amount_paid: 0 }), false);
assert.equal(
  isEligibleReconcileGiftInvoice({ status: "paid", amount_paid: 1000, amount_refunded: 1000 }),
  false,
);
assert.equal(stripeInvoiceIsFullyRefunded({ amount_paid: 5000, amount_refunded: 5000 }), true);

assert.equal(
  giftGivenOnFromCheckoutSession({
    created: 1_700_000_000,
    status_transitions: { paid_at: 1_731_000_000 },
  }),
  giftGivenOnFromCheckoutSession({
    created: 1_700_000_000,
    status_transitions: { paid_at: 1_731_000_000 },
  }),
);

assert.equal(
  checkoutSessionAuthorizedForMember(
    sessionFixture({ client_reference_id: "member-a" }),
    { id: "member-a", email: "a@shanah.city" },
  ),
  true,
);

assert.equal(
  checkoutSessionAuthorizedForMember(
    sessionFixture({ client_reference_id: "other-member" }),
    { id: "member-a", email: "a@shanah.city" },
  ),
  false,
  "wrong client_reference_id",
);

assert.equal(
  checkoutSessionAuthorizedForMember(
    sessionFixture({ client_reference_id: null, metadata: { ...GIVING_META, userId: "other" } }),
    { id: "member-a", email: "a@shanah.city" },
  ),
  false,
  "wrong metadata userId",
);

assert.equal(
  checkoutSessionAuthorizedForMember(
    sessionFixture({
      client_reference_id: null,
      metadata: { ...GIVING_META, userId: "" },
      customer_details: { email: "a@shanah.city" },
    }),
    { id: "member-a", email: "a@shanah.city" },
  ),
  true,
  "verified email match",
);

assert.equal(
  checkoutSessionAuthorizedForMember(
    sessionFixture({
      client_reference_id: null,
      metadata: { ...GIVING_META, userId: "" },
      customer_details: { email: "stranger@example.com" },
    }),
    { id: "member-a", email: "a@shanah.city" },
  ),
  false,
  "no owner id and no email match",
);

assert.equal(
  checkoutSessionAuthorizedForMember(
    sessionFixture({
      client_reference_id: null,
      metadata: { ...GIVING_META, userId: "" },
      customer_details: undefined,
      customer_email: null,
    }),
    { id: "member-a", email: "a@shanah.city" },
  ),
  false,
  "fail closed with no identity anchors",
);

assert.equal(
  checkoutSessionAuthorizedForMember(
    sessionFixture({ client_reference_id: null, customer: "cus_linked" }),
    { id: "member-a", email: "a@shanah.city" },
    { memberStripeCustomerId: "cus_linked" },
  ),
  true,
  "stripe customer linkage",
);

assert.equal(
  checkoutSessionAuthorizedForMember(
    sessionFixture({ metadata: { shop: "true" } }),
    { id: "member-a", email: "a@shanah.city" },
  ),
  false,
  "non-giving checkout rejected",
);

assert.equal(
  canLinkGivingRecordToMember(
    { userId: null, donorEmail: "a@shanah.city" },
    { id: "member-a", email: "a@shanah.city" },
  ),
  true,
);
assert.equal(
  canLinkGivingRecordToMember(
    { userId: "member-b", donorEmail: "a@shanah.city" },
    { id: "member-a", email: "a@shanah.city" },
  ),
  false,
);

const owned: GivingRecord[] = [
  {
    id: "g1",
    userId: "member-a",
    donorName: "A",
    amount: 10,
    currency: "USD",
    fund: "offering",
    method: "stripe",
    givenOn: "2026-01-01",
    recordedBy: "stripe",
    recordedByName: "Online",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];
const emailRows: GivingRecord[] = [
  {
    id: "g2",
    userId: null,
    donorEmail: "a@shanah.city",
    donorName: "A",
    amount: 20,
    currency: "USD",
    fund: "offering",
    method: "stripe",
    givenOn: "2026-01-02",
    recordedBy: "stripe",
    recordedByName: "Online",
    createdAt: "2026-01-02T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
  },
  {
    id: "g3",
    userId: "member-b",
    donorEmail: "a@shanah.city",
    donorName: "B",
    amount: 999,
    currency: "USD",
    fund: "offering",
    method: "stripe",
    givenOn: "2026-01-03",
    recordedBy: "stripe",
    recordedByName: "Online",
    createdAt: "2026-01-03T00:00:00.000Z",
    updatedAt: "2026-01-03T00:00:00.000Z",
  },
];

const merged = mergeMemberVisibleGivingRecords("member-a", owned, emailRows);
assert.equal(merged.length, 2);
assert.ok(merged.some((row) => row.id === "g1"));
assert.ok(merged.some((row) => row.id === "g2"));
assert.ok(!merged.some((row) => row.id === "g3"));

const stripeIndex = new Map<string, GivingRecord>();
function idempotentStripeCreate(
  stripeSessionId: string,
  create: () => GivingRecord,
): GivingRecord {
  const existing = stripeIndex.get(stripeSessionId);
  if (existing) return existing;
  const row = create();
  stripeIndex.set(stripeSessionId, row);
  return row;
}

const first = idempotentStripeCreate("cs_test", () => ({
  ...owned[0],
  id: "give-1",
  stripeSessionId: "cs_test",
}));
const second = idempotentStripeCreate("cs_test", () => ({
  ...owned[0],
  id: "give-2",
  stripeSessionId: "cs_test",
}));
assert.equal(first.id, second.id, "concurrent duplicate session collapses to one record");

const subId = resolveStripeInvoiceSubscriptionId({
  id: "in_test",
  subscription: "sub_legacy",
} as never);
assert.equal(subId, "sub_legacy");

const subFromParent = resolveStripeInvoiceSubscriptionId({
  id: "in_test",
  parent: { subscription_details: { subscription: "sub_parent" } },
} as never);
assert.equal(subFromParent, "sub_parent");

assert.equal(resolveStripeCustomerId("cus_abc"), "cus_abc");
assert.equal(resolveStripeCustomerId({ id: "cus_obj" } as never), "cus_obj");

assert.equal(
  giftGivenOnFromInvoice({
    created: 1_700_000_000,
    status_transitions: { paid_at: 1_731_500_000 },
  }),
  giftGivenOnFromCheckoutSession({
    created: 1_700_000_000,
    status_transitions: { paid_at: 1_731_500_000 },
  }),
);

const confirmRoute = readFileSync(
  path.join(process.cwd(), "src/app/api/giving/confirm/route.ts"),
  "utf8",
);
assert.match(confirmRoute, /confirmCheckoutGiftForMember/);

const checkoutSource = readFileSync(
  path.join(process.cwd(), "src/lib/giving-checkout-server.ts"),
  "utf8",
);
assert.match(checkoutSource, /getCheckoutSessionForMember/);
assert.match(checkoutSource, /checkoutSessionAuthorizedForMember/);

const dbSource = readFileSync(
  path.join(process.cwd(), "src/lib/stores/giving-db.ts"),
  "utf8",
);
assert.match(dbSource, /P2002/);

const reconcileSource = readFileSync(
  path.join(process.cwd(), "src/lib/giving-reconcile-server.ts"),
  "utf8",
);
assert.match(reconcileSource, /isShanahGivingCheckoutSession/);
assert.match(reconcileSource, /isShanahGivingInvoiceMetadata/);

assert.equal(redactEmailForLogs("pat@example.com"), "p***@example.com");
assert.equal(redactStripeId("cs_test_abcdefghij"), "cs_tes…ghij");

assert.equal(
  checkoutSessionEligibleForMemberSync(
    sessionFixture(),
    { id: "member-a", email: "donor@shanah.city" },
    "cus_linked",
  ),
  true,
);
assert.equal(
  checkoutSessionEligibleForMemberSync(
    sessionFixture({ client_reference_id: "other", customer: "cus_linked" }),
    { id: "member-a", email: "donor@shanah.city" },
    "cus_linked",
  ),
  false,
  "unauthorized session rejected for member sync",
);

assert.equal(
  stripeCustomerVerifiedForMember("cus_linked", "cus_linked"),
  true,
);
assert.equal(stripeCustomerVerifiedForMember("cus_other", "cus_linked"), false);

assert.deepEqual(
  stripeCheckoutMetadataOwnerConflict(
    sessionFixture({ metadata: { ...GIVING_META, userId: "member-b" } }),
    { id: "member-a" },
  ),
  {
    conflict: true,
    reason: "metadata_userId_conflict",
    metadataUserId: "member-b",
    clientReferenceId: "member-a",
  },
);

assert.deepEqual(
  stripeInvoiceMetadataOwnerConflict(
    { metadata: {} },
    { fund: "offering", giftAmount: "25", userId: "member-b" },
    { id: "member-a" },
  ),
  {
    conflict: true,
    reason: "invoice_metadata_userId_conflict",
    metadataUserId: "member-b",
  },
);

assert.equal(
  checkoutSessionEligibleForMemberSync(
    sessionFixture({
      client_reference_id: "member-a",
      metadata: { ...GIVING_META, userId: "member-b" },
      customer: "cus_linked",
    }),
    { id: "member-a", email: "donor@shanah.city" },
    "cus_linked",
  ),
  false,
  "metadata userId conflict blocks sync even when customer matches",
);

assert.equal(
  shouldAttemptMemberStripeSync({
    nowMs: 1_000_000,
    lastAttemptAtMs: 999_000,
    lastSuccessAtMs: null,
    consecutiveFailures: 0,
    trigger: "history",
  }).run,
  false,
  "debounce blocks rapid history refresh",
);

assert.equal(
  shouldAttemptMemberStripeSync({
    nowMs: 1_000_000,
    lastAttemptAtMs: 900_000,
    lastSuccessAtMs: 950_000,
    consecutiveFailures: 0,
    trigger: "history",
  }).run,
  false,
  "success cooldown skips Stripe within 15 minutes",
);

assert.equal(memberStripeSyncErrorBackoffMs(2), 20 * 60_000);

const profileViewBase = 1_700_000_000_000;
const runRows = [
  {
    status: "ok",
    createdAt: new Date(profileViewBase),
    finishedAt: new Date(profileViewBase),
  },
  {
    status: "skipped_cooldown",
    createdAt: new Date(profileViewBase + 30_000),
    finishedAt: new Date(profileViewBase + 30_000),
  },
  {
    status: "skipped_cooldown",
    createdAt: new Date(profileViewBase + 45_000),
    finishedAt: new Date(profileViewBase + 45_000),
  },
];
const cooldownState = summarizeMemberStripeSyncRuns(runRows);
assert.equal(
  cooldownState.lastAttemptAt?.getTime(),
  profileViewBase,
  "skipped_cooldown rows must not advance lastAttemptAt",
);
assert.equal(
  shouldAttemptMemberStripeSync({
    nowMs: profileViewBase + MEMBER_STRIPE_SYNC_MIN_GAP_MS + 1,
    lastAttemptAtMs: cooldownState.lastAttemptAt?.getTime() ?? null,
    lastSuccessAtMs: cooldownState.lastSuccessAt?.getTime() ?? null,
    consecutiveFailures: 0,
    trigger: "history",
  }).run,
  false,
  "success cooldown still applies after many profile views",
);
assert.equal(
  shouldAttemptMemberStripeSync({
    nowMs: profileViewBase + MEMBER_STRIPE_SYNC_SUCCESS_COOLDOWN_MS + 60_000,
    lastAttemptAtMs: cooldownState.lastAttemptAt?.getTime() ?? null,
    lastSuccessAtMs: cooldownState.lastSuccessAt?.getTime() ?? null,
    consecutiveFailures: 0,
    trigger: "history",
  }).run,
  true,
  "real sync allowed after cooldown even if profile was opened repeatedly",
);

assert.equal(
  isEligibleReconcileGiftInvoice({
    status: "paid",
    amount_paid: 5000,
    amount_refunded: 5000,
  }),
  false,
  "fully refunded invoice not eligible for recovery",
);

const diagnosticRoute = readFileSync(
  path.join(process.cwd(), "src/app/api/admin/giving/diagnostic/route.ts"),
  "utf8",
);
assert.match(diagnosticRoute, /buildGivingHistoryIncidentReport/);

const diagnosticServer = readFileSync(
  path.join(process.cwd(), "src/lib/giving-diagnostic-server.ts"),
  "utf8",
);
assert.match(diagnosticServer, /readOnly:\s*true/);
assert.match(diagnosticServer, /identityLinkCandidates/);

const memberSync = readFileSync(
  path.join(process.cwd(), "src/lib/giving-stripe-member-sync.ts"),
  "utf8",
);
assert.match(memberSync, /scheduleVerifiedStripeGiftsForMember/);
assert.match(memberSync, /MEMBER_STRIPE_SYNC_TIMEOUT_MS/);
assert.match(memberSync, /flagStripeMemberSyncForFinanceReview/);

const authRoute = readFileSync(path.join(process.cwd(), "src/app/api/auth/route.ts"), "utf8");
assert.match(authRoute, /afterAuthVerifiedStripeMemberSync/);
assert.match(authRoute, /givingStripeSyncAfter/);

const afterSync = readFileSync(
  path.join(process.cwd(), "src/lib/giving-stripe-member-sync-after.ts"),
  "utf8",
);
assert.match(afterSync, /from "next\/server"/);
assert.match(afterSync, /\bafter\(/);

const historyServer = readFileSync(
  path.join(process.cwd(), "src/lib/giving-member-history-server.ts"),
  "utf8",
);
assert.match(historyServer, /lastStripeSync/);
assert.doesNotMatch(historyServer, /scheduleVerifiedStripeGiftsForMember/);

const historyRoute = readFileSync(
  path.join(process.cwd(), "src/app/api/giving/history/route.ts"),
  "utf8",
);
assert.match(historyRoute, /afterHistoryVerifiedStripeMemberSync/);
assert.match(historyRoute, /listGivingRecordsForMember/);

const reportSource = readFileSync(
  path.join(process.cwd(), "src/lib/giving-stripe-member-sync-report.ts"),
  "utf8",
);
assert.match(reportSource, /alreadyRecorded/);
assert.match(reportSource, /skippedByReason/);

const sampleReport = emptyMemberStripeSyncReport();
sampleReport.alreadyRecorded = 2;
bumpSkipReason(sampleReport, "not_shanah_checkout", 3);
assert.equal(sampleReport.alreadyRecorded, 2);
assert.equal(sampleReport.skippedByReason.not_shanah_checkout, 3);

const policySource = readFileSync(
  path.join(process.cwd(), "src/lib/giving-stripe-member-sync-policy.ts"),
  "utf8",
);
assert.match(policySource, /stripeCheckoutMetadataOwnerConflict/);

const auditMigration = readFileSync(
  path.join(
    process.cwd(),
    "prisma/migrations/20261108200000_giving_stripe_member_sync_audit/migration.sql",
  ),
  "utf8",
);
assert.match(auditMigration, /GivingStripeMemberSyncReview/);

const leaseMigration = readFileSync(
  path.join(process.cwd(), "prisma/migrations/20261109160000_giving_stripe_sync_lease/migration.sql"),
  "utf8",
);
assert.match(leaseMigration, /GivingStripeMemberSyncLease/);

const lockSource = readFileSync(
  path.join(process.cwd(), "src/lib/giving-stripe-member-sync-lock.ts"),
  "utf8",
);
assert.doesNotMatch(lockSource, /pg_try_advisory_lock/);
assert.match(lockSource, /ON CONFLICT/);
assert.doesNotMatch(
  lockSource,
  /isMissingLeaseTableError\(error\)[\s\S]{0,200}acquired:\s*true/,
  "missing lease table must fail closed",
);
assert.equal(memberStripeSyncLockAcquireDeniedReason({ databaseEnabled: false }), "database_unavailable");
assert.equal(
  memberStripeSyncLockAcquireDeniedReason({ databaseEnabled: true, missingLeaseTable: true }),
  "lease_table_missing",
);
assert.equal(
  memberStripeSyncLockAcquireDeniedReason({ databaseEnabled: true, missingLeaseTable: false }),
  null,
);
assert.equal(
  isMissingLeaseTableError(
    new Prisma.PrismaClientKnownRequestError("table missing", {
      code: "P2021",
      clientVersion: "test",
    }),
  ),
  true,
  "P2021 must deny sync (fail closed)",
);

const syncSource = readFileSync(path.join(process.cwd(), "src/lib/giving-stripe-member-sync.ts"), "utf8");
assert.match(syncSource, /lock\.reason/);
assert.match(syncSource, /if \(!lock\.acquired\)/);

const historyUi = readFileSync(
  path.join(process.cwd(), "src/components/give/MemberGivingHistory.tsx"),
  "utf8",
);
assert.doesNotMatch(historyUi, /setTimeout\(\(\) => loadHistory\(\), 4000\)/);
assert.match(historyUi, /fetchInFlight/);
assert.match(historyUi, /GIVING_HISTORY_AFTER_AUTH_POLL_MS.length - 1/);

const now = Date.now();
assert.equal(
  canClaimMemberStripeSyncLease(
    { holderId: "holder-a", expiresAt: new Date(now + 60_000) },
    "holder-b",
    new Date(now),
  ),
  false,
  "active lease blocks concurrent sign-in/history",
);
assert.equal(
  canClaimMemberStripeSyncLease(
    { holderId: "holder-a", expiresAt: new Date(now - 1) },
    "holder-b",
    new Date(now),
  ),
  true,
  "expired lease can be reclaimed",
);
assert.equal(isMemberStripeSyncLeaseExpired(new Date(now - 1), new Date(now)), true);
assert.equal(MEMBER_STRIPE_SYNC_LEASE_MS >= 60_000, true);

assert.equal(GIVING_HISTORY_AFTER_AUTH_POLL_MS.length, 3);
assert.equal(
  parseGivingHistoryRefreshStamp(String(now - GIVING_HISTORY_REFRESH_MAX_AGE_MS - 1)).shouldPoll,
  false,
);
assert.equal(parseGivingHistoryRefreshStamp(String(now)).shouldPoll, true);

const sinceUnix = 1_761_000_000; // ~2025-10-21
assert.equal(stripeListCreatedGteWithPaidAtLookback(sinceUnix) < sinceUnix, true);
assert.equal(
  stripeObjectInPaidWindow(stripeInvoiceSettlementPaidAtUnix({
    status: "paid",
    status_transitions: { paid_at: sinceUnix + 100 },
  } as never), sinceUnix),
  true,
);
assert.equal(
  stripeInvoiceSettlementPaidAtUnix({
    status: "paid",
    status_transitions: {},
  } as never),
  null,
  "paid invoice without paid_at must not substitute created",
);
assert.equal(
  stripeInvoicePaidAtUnknown({
    status: "paid",
    status_transitions: {},
  } as never),
  true,
);
assert.equal(
  stripeObjectInPaidWindow(
    stripeInvoiceSettlementPaidAtUnix({
      status: "open",
      status_transitions: {},
    } as never),
    sinceUnix,
  ),
  false,
);
assert.equal(parseGivingReconcileDateWindow("2026-10-31", "2026-10-01").ok, false);
assert.equal(parseGivingReconcileDateWindow("2026-10-01", "2026-10-31").ok, true);

const syncTs = readFileSync(path.join(process.cwd(), "src/lib/giving-stripe-member-sync.ts"), "utf8");
assert.match(syncTs, /subscription_checkout_use_invoice/);
assert.match(syncTs, /stripeListCreatedGteWithPaidAtLookback/);

console.log("giving-stripe-history.test.ts OK");
