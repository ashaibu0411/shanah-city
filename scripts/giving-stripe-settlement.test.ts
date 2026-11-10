import assert from "node:assert/strict";
import type Stripe from "stripe";
import {
  MEMBER_RECONCILE_EVENT_LIST_BUDGET,
  resetMemberReconcileEventBudget,
  tryConsumeMemberReconcileEventListCall,
} from "../src/lib/giving-stripe-event-budget";
import {
  checkoutSettlementPaidAtUnix,
  resolvePaymentIntentSettlement,
  settlementUnknownMapsToSkipReason,
} from "../src/lib/giving-stripe-checkout-settlement";
import {
  clearStripeSuccessEventLookupCacheForTests,
  setStripeEventSuccessLookupForTests,
  setStripeReconcileNowUnixForTests,
  stripeEventListLikelyOutOfCoverage,
  stripeSuccessEventMatchesContext,
} from "../src/lib/giving-stripe-success-event";
import { stripeObjectInPaidWindow } from "../src/lib/giving-stripe-paid-at";

const oct31Unix = Math.floor(new Date("2026-10-31T12:00:00Z").getTime() / 1000);
const nov4Unix = Math.floor(new Date("2026-11-04T15:30:00Z").getTime() / 1000);
const oct5Unix = Math.floor(new Date("2026-10-05T08:00:00Z").getTime() / 1000);
const nov9Unix = Math.floor(new Date("2026-11-09T18:00:00Z").getTime() / 1000);
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

assert.equal(
  stripeSuccessEventMatchesContext(
    { type: "charge.succeeded", data: { object: { id: "ch_target" } } } as never,
    { chargeId: "ch_other" },
  ),
  false,
  "event object id must match exactly",
);
assert.equal(
  stripeSuccessEventMatchesContext(
    { type: "charge.succeeded", data: { object: { id: "ch_target" } } } as never,
    { chargeId: "ch_target" },
  ),
  true,
);
assert.equal(
  stripeSuccessEventMatchesContext(
    { type: "payment_intent.succeeded", data: { object: { id: "pi_1" } } } as never,
    { paymentIntentId: "pi_2" },
  ),
  false,
);

async function run() {
  resetMemberReconcileEventBudget();
  clearStripeSuccessEventLookupCacheForTests();
  setStripeReconcileNowUnixForTests(nov9Unix);

  assert.equal(
    stripeEventListLikelyOutOfCoverage(oct5Unix),
    true,
    "early-October activity is outside Stripe Event.list retention on Nov 9",
  );

  setStripeEventSuccessLookupForTests(null);
  const earlyOctoberPi = {
    ...achPi,
    latest_charge: { id: "ch_early_oct", status: "succeeded", created: oct5Unix },
  };
  const achRetention = await resolvePaymentIntentSettlement(stripeStub, earlyOctoberPi as never);
  assert.equal(achRetention.status, "success_date_unknown");
  assert.equal(achRetention.reason, "stripe_event_retention_out_of_coverage");
  assert.equal(achRetention.paymentSucceededVerified, true);
  assert.equal(achRetention.financeManualDateReviewRecommended, true);
  assert.equal(
    settlementUnknownMapsToSkipReason("stripe_event_retention_out_of_coverage"),
    "success_date_event_retention_expired",
  );
  assert.equal(checkoutSettlementPaidAtUnix(achRetention), null);

  setStripeReconcileNowUnixForTests(nov4Unix + 86_400);
  clearStripeSuccessEventLookupCacheForTests();
  resetMemberReconcileEventBudget();
  setStripeEventSuccessLookupForTests(async (_stripe, context) => {
    if (context.chargeId === "ch_ach_test") {
      return { outcome: "found", match: { paidAtUnix: nov4Unix, eventType: "charge.succeeded" } };
    }
    return { outcome: "not_found" };
  });
  const achSettlement = await resolvePaymentIntentSettlement(stripeStub, achPi as never);
  assert.equal(achSettlement.status, "verified");
  if (achSettlement.status !== "verified") throw new Error("expected verified ACH");
  assert.equal(achSettlement.paidAtUnix, nov4Unix);
  assert.equal(
    stripeObjectInPaidWindow(achSettlement.paidAtUnix, octWindowSince, octWindowUntil),
    false,
    "Nov-settled ACH must not fall in October window",
  );

  setStripeReconcileNowUnixForTests(cardSyncUnix + 86_400);
  clearStripeSuccessEventLookupCacheForTests();
  resetMemberReconcileEventBudget();
  setStripeEventSuccessLookupForTests(async (_stripe, context) => {
    if (context.chargeId === "ch_card_test") {
      return {
        outcome: "found",
        match: { paidAtUnix: cardSyncUnix, eventType: "payment_intent.succeeded" },
      };
    }
    return { outcome: "not_found" };
  });

  const cardSettlement = await resolvePaymentIntentSettlement(stripeStub, cardPi as never);
  assert.equal(cardSettlement.status, "verified");
  if (cardSettlement.status !== "verified") throw new Error("expected verified");
  assert.equal(cardSettlement.paidAtUnix, cardSyncUnix);
  assert.equal(
    stripeObjectInPaidWindow(checkoutSettlementPaidAtUnix(cardSettlement), octWindowSince, octWindowUntil),
    true,
  );

  setStripeReconcileNowUnixForTests(nov9Unix);
  clearStripeSuccessEventLookupCacheForTests();
  resetMemberReconcileEventBudget();
  setStripeEventSuccessLookupForTests(async () => ({ outcome: "pagination_limited" }));
  const paginated = await resolvePaymentIntentSettlement(stripeStub, cardPi as never);
  assert.equal(paginated.status, "success_date_unknown");
  assert.equal(paginated.reason, "event_lookup_pagination_limited");
  assert.equal(settlementUnknownMapsToSkipReason("event_lookup_pagination_limited"), "success_date_lookup_inconclusive");

  resetMemberReconcileEventBudget();
  setStripeReconcileNowUnixForTests(cardSyncUnix + 86_400);
  for (let i = 0; i < MEMBER_RECONCILE_EVENT_LIST_BUDGET; i++) {
    tryConsumeMemberReconcileEventListCall();
  }
  clearStripeSuccessEventLookupCacheForTests();
  setStripeEventSuccessLookupForTests(async () => ({ outcome: "budget_exhausted" }));
  const budgeted = await resolvePaymentIntentSettlement(stripeStub, cardPi as never);
  assert.equal(budgeted.reason, "event_lookup_budget_exhausted");

  setStripeEventSuccessLookupForTests(null);
  setStripeReconcileNowUnixForTests(null);
  clearStripeSuccessEventLookupCacheForTests();
  resetMemberReconcileEventBudget();

  console.log("giving-stripe-settlement.test.ts OK");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
