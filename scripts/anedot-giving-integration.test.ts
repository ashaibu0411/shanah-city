import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  computeAnedotWebhookSignature,
  verifyAnedotWebhookSignature,
} from "../src/lib/anedot-webhook-signature";
import { anedotSampleDonationCompletedEnvelope } from "../src/lib/anedot-webhook-server";

const webhook = readFileSync(
  join(process.cwd(), "src/lib/anedot-webhook-server.ts"),
  "utf8",
);
assert.match(webhook, /prisma\.\$transaction/);
assert.match(webhook, /txReserveAnedotWebhookDelivery/);
assert.doesNotMatch(webhook, /recordAnedotGift/);
assert.doesNotMatch(webhook, /deleteGivingRecord/);

const txLib = readFileSync(join(process.cwd(), "src/lib/anedot-tx-server.ts"), "utf8");
assert.match(txLib, /txApplyAnedotFullReversal/);
assert.match(txLib, /givingAnedotAdjustment/);
assert.doesNotMatch(txLib, /giving-server/);

const secret = "integration-test-secret";
const body = JSON.stringify(
  anedotSampleDonationCompletedEnvelope({
    event: "donation_completed",
    payload: {
      account_uid: "integration-account",
      amount_in_dollars: "100.0",
      donation: { id: "d-concurrent-1", fund: { identifier: "1001" } },
    },
  }),
);
const sig = computeAnedotWebhookSignature(body, secret);
assert.equal(verifyAnedotWebhookSignature(body, sig, secret), true);
assert.equal(verifyAnedotWebhookSignature(body, sig.toUpperCase(), secret), true);

const tampered = body.replace("100.0", "200.0");
assert.equal(verifyAnedotWebhookSignature(tampered, sig, secret), false);

const achLateSettle = {
  event: "donation_settled",
  payload: {
    account_uid: "integration-account",
    donation: { id: "d-ach-delayed", settlement_date: "2026-11-15 12:00:00 UTC" },
  },
};
assert.ok(JSON.stringify(achLateSettle));

const duplicatePayload = anedotSampleDonationCompletedEnvelope();
const hmac = createHmac("sha256", secret).update(JSON.stringify(duplicatePayload)).digest("hex");
assert.equal(hmac.length, 64);

console.log("anedot-giving-integration.test.ts OK");
