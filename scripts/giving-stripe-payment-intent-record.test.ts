import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { resolveVerifiedCheckoutGiftAmounts } from "../src/lib/giving-stripe-recovery-amounts";
import { checkoutSessionHasCorroboratedMemberIdentity } from "../src/lib/giving-stripe-checkout-ownership";

const metaSession = {
  metadata: { fund: "offering", giftAmount: "75", userId: "u1" },
  client_reference_id: "u1",
  amount_total: 7560,
} as never;
assert.equal(checkoutSessionHasCorroboratedMemberIdentity(metaSession), true);
const amounts = resolveVerifiedCheckoutGiftAmounts(metaSession);
assert.equal(amounts.ok && amounts.giftAmount === 75, true);
assert.equal(resolveVerifiedCheckoutGiftAmounts({ metadata: {}, amount_total: 7560 } as never).ok, false);

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
