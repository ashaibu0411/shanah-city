import assert from "node:assert/strict";
import {
  anedotGiftMutationForEvent,
  anedotLifecycleRank,
  anedotShouldApplyLifecycleTransition,
} from "../src/lib/anedot-lifecycle";
import { reconcileAnedotIntent } from "../src/lib/anedot-intent-reconcile";
import { anedotLifecycleStatusForEvent } from "../src/lib/anedot-payload";

assert.equal(anedotLifecycleStatusForEvent("donation_completed", "bank_account"), "processing");
assert.equal(anedotLifecycleRank("processing"), 10);
assert.equal(anedotLifecycleRank("settled"), 30);
assert.equal(anedotLifecycleRank("ach_returned"), 60);

const terminalBlock = anedotShouldApplyLifecycleTransition({
  currentStatus: "ach_returned",
  currentRank: 60,
  nextStatus: "completed",
  nextRank: 20,
  eventType: "donation_completed",
  eventAtMs: Date.now(),
  lastEventAtMs: Date.now() - 86_400_000,
});
assert.equal(terminalBlock.apply, false);
assert.equal(terminalBlock.reason, "terminal_locked");

const stale = anedotShouldApplyLifecycleTransition({
  currentStatus: "settled",
  currentRank: 30,
  nextStatus: "completed",
  nextRank: 20,
  eventType: "donation_completed",
  eventAtMs: Date.now() - 86_400_000,
  lastEventAtMs: Date.now(),
});
assert.equal(stale.apply, false);

const cardCreate = anedotGiftMutationForEvent({
  eventType: "donation_completed",
  paymentSource: "credit_card",
  grossAmount: 75,
  netAmount: 72,
  existingGivingRecordId: null,
  existingEffectiveAmount: null,
});
assert.deepEqual(cardCreate, { kind: "create", grossAmount: 75, effectiveAmount: 75 });

const achPending = anedotGiftMutationForEvent({
  eventType: "donation_completed",
  paymentSource: "bank_account",
  grossAmount: 75,
  netAmount: null,
  existingGivingRecordId: null,
  existingEffectiveAmount: null,
});
assert.deepEqual(achPending, { kind: "none" });

const achSettle = anedotGiftMutationForEvent({
  eventType: "donation_settled",
  paymentSource: "bank_account",
  grossAmount: 75,
  netAmount: null,
  existingGivingRecordId: null,
  existingEffectiveAmount: null,
});
assert.deepEqual(achSettle, { kind: "create", grossAmount: 75, effectiveAmount: 75 });

const partial = anedotGiftMutationForEvent({
  eventType: "donation_partially_refunded",
  paymentSource: "credit_card",
  grossAmount: 100,
  netAmount: 40,
  existingGivingRecordId: "rec-1",
  existingEffectiveAmount: 100,
});
assert.equal(partial.kind, "partial_reversal");
if (partial.kind === "partial_reversal") {
  assert.equal(partial.effectiveAmount, 40);
  assert.equal(partial.reversedDelta, 60);
}

const lateIntent = reconcileAnedotIntent({
  intent: {
    id: "i1",
    userId: "u1",
    amount: 50,
    fund: "tithe",
    expiresAt: new Date(Date.now() - 86_400_000),
    consumedAt: new Date(),
  },
  existingLedger: {
    userId: "u1",
    fund: "tithe",
    grossAmount: 50,
    currency: "USD",
  },
  webhookAmount: null,
  webhookFund: "tithe",
  bindNewDonation: false,
  requireVerifiedAmount: false,
});
assert.equal(lateIntent.ok, true);

const missingAmount = reconcileAnedotIntent({
  intent: null,
  existingLedger: null,
  webhookAmount: null,
  webhookFund: "tithe",
  bindNewDonation: true,
  requireVerifiedAmount: true,
});
assert.equal(missingAmount.ok, false);

console.log("anedot-giving-lifecycle.test.ts OK");
