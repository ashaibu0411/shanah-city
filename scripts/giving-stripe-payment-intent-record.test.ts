import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { giftAmountFromMetadata } from "../src/lib/giving-stripe-recovery-amounts";

assert.equal(giftAmountFromMetadata({ giftAmount: "75", feeAmount: "0.60" }, 75.6), 75);
assert.equal(giftAmountFromMetadata({}, 75.6), 75.6);

const webhookRoute = readFileSync(
  path.join(process.cwd(), "src/app/api/giving/webhook/route.ts"),
  "utf8",
);
assert.match(webhookRoute, /payment_intent\.succeeded/);
assert.match(webhookRoute, /recordGiftFromPaymentIntentSucceeded/);

const lookupLib = readFileSync(
  path.join(process.cwd(), "src/lib/giving-stripe-checkout-session-lookup.ts"),
  "utf8",
);
assert.match(lookupLib, /payment_intent:/);

console.log("giving-stripe-payment-intent-record.test.ts OK");
