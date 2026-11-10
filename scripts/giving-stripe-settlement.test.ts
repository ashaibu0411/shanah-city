import assert from "node:assert/strict";
import {
  checkoutSettlementPaidAtUnix,
  settlementFromSucceededPaymentIntent,
} from "../src/lib/giving-stripe-checkout-settlement";
import { stripeObjectInPaidWindow } from "../src/lib/giving-stripe-paid-at";

const chargeCreated = 1_729_900_000;

const piSucceededFixture = {
  id: "pi_live_ok",
  status: "succeeded",
  created: 1_729_800_000,
  latest_charge: {
    id: "ch_live_ok",
    status: "succeeded",
    created: chargeCreated,
  },
} as const;

assert.deepEqual(settlementFromSucceededPaymentIntent(piSucceededFixture as never), {
  status: "verified",
  paidAtUnix: chargeCreated,
  source: "charge",
});

assert.deepEqual(
  settlementFromSucceededPaymentIntent({
    ...piSucceededFixture,
    latest_charge: "ch_unexpanded",
  } as never),
  { status: "unknown", reason: "no_verified_charge_timestamp" },
);

assert.deepEqual(
  settlementFromSucceededPaymentIntent({
    ...piSucceededFixture,
    status: "processing",
  } as never),
  { status: "not_paid", reason: "payment_intent_processing" },
);

assert.equal(checkoutSettlementPaidAtUnix({ status: "unknown", reason: "x" }), null);
assert.equal(
  stripeObjectInPaidWindow(chargeCreated, chargeCreated - 10, chargeCreated + 10),
  true,
);

console.log("giving-stripe-settlement.test.ts OK");
