import assert from "node:assert/strict";
import type Stripe from "stripe";
import { MEMBER_RECONCILE_EVENT_LIST_BUDGET } from "../src/lib/giving-stripe-event-budget";
import {
  createMemberReconcileEventScope,
  lookupStripeSuccessEventCreated,
} from "../src/lib/giving-stripe-reconcile-event-scope";

const mockStripe = {
  events: {
    list: async () => ({ data: [], has_more: false }),
  },
} as unknown as Stripe;

async function runConcurrentIsolation() {
  const scopeA = createMemberReconcileEventScope({ budgetMax: 1, nowUnix: 1_900_000_000 });
  const scopeB = createMemberReconcileEventScope({ budgetMax: 5, nowUnix: 1_900_000_100 });

  await lookupStripeSuccessEventCreated(
    mockStripe,
    { chargeId: "ch_a1", paymentIntentId: "pi_a1" },
    scopeA,
  );
  await lookupStripeSuccessEventCreated(mockStripe, { chargeId: "ch_b1" }, scopeB);

  assert.equal(scopeA.listCallsRemaining, 0, "scope A exhausted its own budget");
  assert.equal(scopeB.listCallsRemaining, 4, "scope B budget is independent of scope A");

  await lookupStripeSuccessEventCreated(mockStripe, { chargeId: "ch_b1" }, scopeB);
  assert.equal(scopeB.stats.cacheHits, 1, "scope B cache is request-local");
  assert.equal(scopeB.listCallsRemaining, 4, "cache hit does not consume budget");
}

async function runIndependentBudgets() {
  const scope = createMemberReconcileEventScope({ budgetMax: 1, nowUnix: 1_900_000_200 });
  const stripe = {
    events: {
      list: async () => ({ data: [], has_more: false }),
    },
  } as unknown as Stripe;
  await lookupStripeSuccessEventCreated(stripe, { chargeId: "ch_1", paymentIntentId: "pi_1" }, scope);
  const second = await lookupStripeSuccessEventCreated(stripe, { chargeId: "ch_2" }, scope);
  assert.equal(second.outcome, "budget_exhausted");
}

async function main() {
  assert.equal(MEMBER_RECONCILE_EVENT_LIST_BUDGET, 24);
  await runConcurrentIsolation();
  await runIndependentBudgets();
  console.log("giving-stripe-event-scope.test.ts OK");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
