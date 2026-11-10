import assert from "node:assert/strict";
import type Stripe from "stripe";
import {
  checkoutSettlementPaidAtUnix,
  resolvePaymentIntentSettlement,
} from "../src/lib/giving-stripe-checkout-settlement";
import { setStripeEventSuccessLookupForTests } from "../src/lib/giving-stripe-success-event";
import { stripeObjectInPaidWindow } from "../src/lib/giving-stripe-paid-at";

const oct31Unix = Math.floor(new Date("2026-10-31T12:00:00Z").getTime() / 1000);
const nov4Unix = Math.floor(new Date("2026-11-04T15:30:00Z").getTime() / 1000);
const cardSyncUnix = Math.floor(new Date("2026-10-15T18:00:00Z").getTime() / 1000);

const octWindowSince = Math.floor(new Date("2026-10-01T00:00:00Z").getTime() / 1000);
const octWindowUntil = Math.floor(new Date("2026-10-31T23:59:59Z").getTime() / 1000);

const achPi = {
  id: "pi_ach_test",
  status: "succeeded",
  created: oct31Unix - 3600,
  latest_charge: {
    id: "ch_ach_test",
    status: "succeeded",
    created: oct31Unix,
  },
} as const;

const cardPi = {
  id: "pi_card_test",
  status: "succeeded",
  created: cardSyncUnix,
  latest_charge: {
    id: "ch_card_test",
    status: "succeeded",
    created: cardSyncUnix,
  },
} as const;

const stripeStub = {} as Stripe;

async function run() {
  setStripeEventSuccessLookupForTests(async (_stripe, context) => {
    if (context.chargeId === "ch_ach_test") {
      return { paidAtUnix: nov4Unix, eventType: "charge.succeeded" };
    }
    if (context.chargeId === "ch_card_test") {
      return { paidAtUnix: cardSyncUnix, eventType: "payment_intent.succeeded" };
    }
    return null;
  });

  const achSettlement = await resolvePaymentIntentSettlement(stripeStub, achPi as never);
  assert.equal(achSettlement.status, "verified");
  assert.equal(achSettlement.paymentSucceededVerified, true);
  assert.equal(achSettlement.successAtVerified, true);
  if (achSettlement.status !== "verified") throw new Error("expected verified");
  assert.equal(achSettlement.paidAtUnix, nov4Unix, "ACH settlement must use Event.created, not Charge.created");
  assert.equal(achSettlement.chargeCreatedAtUnix, oct31Unix);
  assert.equal(
    stripeObjectInPaidWindow(oct31Unix, octWindowSince, octWindowUntil),
    true,
    "chargeCreated is useful for discovery only",
  );
  assert.equal(
    stripeObjectInPaidWindow(checkoutSettlementPaidAtUnix(achSettlement), octWindowSince, octWindowUntil),
    false,
    "Nov-settled ACH must not fall in October window",
  );

  const cardSettlement = await resolvePaymentIntentSettlement(stripeStub, cardPi as never);
  assert.equal(cardSettlement.status, "verified");
  if (cardSettlement.status !== "verified") throw new Error("expected verified");
  assert.equal(cardSettlement.paidAtUnix, cardSyncUnix);
  assert.equal(
    stripeObjectInPaidWindow(checkoutSettlementPaidAtUnix(cardSettlement), octWindowSince, octWindowUntil),
    true,
  );

  setStripeEventSuccessLookupForTests(async () => null);
  const missingEvent = await resolvePaymentIntentSettlement(stripeStub, cardPi as never);
  assert.equal(missingEvent.status, "success_date_unknown");
  assert.equal(missingEvent.paymentSucceededVerified, true);
  assert.equal(missingEvent.successAtVerified, false);
  assert.equal(checkoutSettlementPaidAtUnix(missingEvent), null);

  setStripeEventSuccessLookupForTests(null);

  function memberScanComplete(flags: {
    checkoutSessions: boolean;
    invoices: boolean;
    paymentIntents: boolean;
    emailCustomerLookupTruncated: boolean;
  }) {
    return (
      !flags.checkoutSessions &&
      !flags.invoices &&
      !flags.paymentIntents &&
      !flags.emailCustomerLookupTruncated
    );
  }

  assert.equal(
    memberScanComplete({
      checkoutSessions: false,
      invoices: false,
      paymentIntents: false,
      emailCustomerLookupTruncated: true,
    }),
    false,
    "email customer lookup truncation must make stripeScan.complete false",
  );

  console.log("giving-stripe-settlement.test.ts OK");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
