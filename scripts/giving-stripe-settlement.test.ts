import assert from "node:assert/strict";
import type Stripe from "stripe";
import {
  checkoutSettlementPaidAtUnix,
  resolvePaymentIntentSettlement,
  settlementUnknownMapsToSkipReason,
} from "../src/lib/giving-stripe-checkout-settlement";
import { createMemberReconcileEventScope } from "../src/lib/giving-stripe-reconcile-event-scope";
import { stripeSuccessEventMatchesContext } from "../src/lib/giving-stripe-success-event";
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

async function run() {
  const earlyOctoberPi = {
    ...achPi,
    latest_charge: { id: "ch_early_oct", status: "succeeded", created: oct5Unix },
  };

  const scopeOct = createMemberReconcileEventScope({ nowUnix: nov9Unix });
  scopeOct.eventLookup = async () => ({ outcome: "not_found" });
  const oldChargeNoRetentionSkip = await resolvePaymentIntentSettlement(
    stripeStub,
    earlyOctoberPi as never,
    scopeOct,
  );
  assert.equal(oldChargeNoRetentionSkip.status, "success_date_unknown");
  assert.equal(oldChargeNoRetentionSkip.reason, "no_matching_stripe_success_event");
  assert.equal(oldChargeNoRetentionSkip.paymentSucceededVerified, true);
  assert.equal(
    settlementUnknownMapsToSkipReason("no_matching_stripe_success_event"),
    "success_date_not_in_listable_events",
  );
  assert.equal(scopeOct.eventLookup != null, true, "old charge.created must not skip event lookup");

  const scopeAch = createMemberReconcileEventScope({ nowUnix: nov4Unix + 86_400 });
  scopeAch.eventLookup = async (_stripe, context) => {
    if (context.chargeId === "ch_ach_test") {
      return { outcome: "found", match: { paidAtUnix: nov4Unix, eventType: "charge.succeeded" } };
    }
    return { outcome: "not_found" };
  };
  const achSettlement = await resolvePaymentIntentSettlement(stripeStub, achPi as never, scopeAch);
  assert.equal(achSettlement.status, "verified");
  if (achSettlement.status !== "verified") throw new Error("expected verified ACH");
  assert.equal(achSettlement.paidAtUnix, nov4Unix);
  assert.equal(
    stripeObjectInPaidWindow(achSettlement.paidAtUnix, octWindowSince, octWindowUntil),
    false,
    "Nov-settled ACH must not fall in October window",
  );

  const scopeCard = createMemberReconcileEventScope({ nowUnix: cardSyncUnix + 86_400 });
  scopeCard.eventLookup = async (_stripe, context) => {
    if (context.chargeId === "ch_card_test") {
      return {
        outcome: "found",
        match: { paidAtUnix: cardSyncUnix, eventType: "payment_intent.succeeded" },
      };
    }
    return { outcome: "not_found" };
  };
  const cardSettlement = await resolvePaymentIntentSettlement(stripeStub, cardPi as never, scopeCard);
  assert.equal(cardSettlement.status, "verified");
  if (cardSettlement.status !== "verified") throw new Error("expected verified");
  assert.equal(
    stripeObjectInPaidWindow(checkoutSettlementPaidAtUnix(cardSettlement), octWindowSince, octWindowUntil),
    true,
  );

  const scopePaginated = createMemberReconcileEventScope({ nowUnix: nov9Unix });
  scopePaginated.eventLookup = async () => ({ outcome: "pagination_limited" });
  const paginated = await resolvePaymentIntentSettlement(stripeStub, cardPi as never, scopePaginated);
  assert.equal(paginated.reason, "event_lookup_pagination_limited");
  assert.equal(settlementUnknownMapsToSkipReason("event_lookup_pagination_limited"), "success_date_lookup_inconclusive");

  const scopeBudget = createMemberReconcileEventScope({
    nowUnix: cardSyncUnix + 86_400,
    budgetMax: 1,
  });
  scopeBudget.eventLookup = async (_stripe, _ctx, s) => {
    if (!s.listCallsRemaining) return { outcome: "budget_exhausted" };
    s.listCallsRemaining = 0;
    s.stats.budgetExhausted = true;
    return { outcome: "not_found" };
  };
  await resolvePaymentIntentSettlement(stripeStub, cardPi as never, scopeBudget);
  const budgeted = await resolvePaymentIntentSettlement(
    stripeStub,
    { ...cardPi, id: "pi_budget_2" } as never,
    scopeBudget,
  );
  assert.equal(budgeted.reason, "event_lookup_budget_exhausted");

  console.log("giving-stripe-settlement.test.ts OK");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
