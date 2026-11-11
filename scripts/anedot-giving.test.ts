import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { buildAnedotHostedCheckoutUrl } from "../src/lib/anedot-checkout-url";
import { reconcileAnedotIntent } from "../src/lib/anedot-intent-reconcile";
import {
  anedotConfirmPolicyForEvent,
  anedotGrossAmountDollars,
  parseAnedotWebhookJson,
} from "../src/lib/anedot-payload";
import { resolveAnedotFundToGivingFund } from "../src/lib/anedot-fund-map";
import {
  computeAnedotWebhookSignature,
  verifyAnedotWebhookSignature,
} from "../src/lib/anedot-webhook-signature";
import { anedotSampleDonationCompletedEnvelope } from "../src/lib/anedot-webhook-server";

const secret = "test-webhook-secret";
const body = JSON.stringify(anedotSampleDonationCompletedEnvelope());
const sig = computeAnedotWebhookSignature(body, secret);

assert.equal(verifyAnedotWebhookSignature(body, sig, secret), true);
assert.equal(verifyAnedotWebhookSignature(body, "deadbeef", secret), false);
assert.equal(verifyAnedotWebhookSignature(body, null, secret), false);

const envelope = parseAnedotWebhookJson(body);
assert.ok(envelope);
assert.equal(anedotGrossAmountDollars(envelope!), 50);

const allowlist = { "1001": "tithe", "General Fund": "offering" };
assert.equal(
  resolveAnedotFundToGivingFund({ identifier: "1001", name: "General Fund" }, allowlist),
  "tithe",
);

assert.equal(anedotConfirmPolicyForEvent("donation_completed", "credit_card"), "confirm_now");
assert.equal(anedotConfirmPolicyForEvent("donation_completed", "bank_account"), "wait_settlement");
assert.equal(anedotConfirmPolicyForEvent("donation_settled", "bank_account"), "confirm_now");
assert.equal(anedotConfirmPolicyForEvent("donation_refunded", "credit_card"), "reverse");

const intentOk = reconcileAnedotIntent({
  intent: {
    id: "intent-1",
    userId: "user-1",
    amount: 50,
    fund: "tithe",
    expiresAt: new Date(Date.now() + 60_000),
    consumedAt: null,
  },
  webhookAmount: 50,
  webhookFund: "tithe",
});
assert.equal(intentOk.ok, true);

const conflict = reconcileAnedotIntent({
  intent: {
    id: "intent-1",
    userId: "user-1",
    amount: 50,
    fund: "tithe",
    expiresAt: new Date(Date.now() + 60_000),
    consumedAt: null,
  },
  webhookAmount: 50,
  webhookFund: "missions",
});
assert.equal(conflict.ok, false);

const guestNoMap = reconcileAnedotIntent({
  intent: null,
  webhookAmount: 25,
  webhookFund: null,
});
assert.equal(guestNoMap.ok, false);

const url = buildAnedotHostedCheckoutUrl({
  actionPageUrl: "https://secure.anedot.com/shanah-city/donate",
  amount: 50,
  frequency: "monthly",
  intentReference: "intent-1.sig",
  fundAnedotIdentifier: "1001",
});
assert.match(url, /amount=50/);
assert.match(url, /frequency=monthly/);
assert.match(url, /utm_content=intent-1/);

const achSettled = JSON.stringify({
  event: "donation_settled",
  payload: {
    donation: { id: "d-ach-1", settlement_date: "2026-11-10 12:00:00 UTC" },
  },
});
assert.equal(verifyAnedotWebhookSignature(achSettled, createHmac("sha256", secret).update(achSettled).digest("hex"), secret), true);

console.log("anedot-giving.test.ts OK");
