import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  isPaidCheckoutSession,
  isPaidStripeInvoice,
} from "../src/lib/giving-reconcile-server";
import { resolveStripeInvoiceSubscriptionId, resolveStripeCustomerId } from "../src/lib/giving-stripe-invoice";
import { metadataUserId } from "../src/lib/giving-stripe-identity";

assert.equal(metadataUserId("  "), undefined);
assert.equal(metadataUserId("member-1"), "member-1");

assert.equal(
  isPaidCheckoutSession({ mode: "payment", payment_status: "paid" }),
  true,
);
assert.equal(
  isPaidCheckoutSession({ mode: "payment", payment_status: "unpaid" }),
  false,
);
assert.equal(
  isPaidCheckoutSession({ mode: "subscription", payment_status: "paid" }),
  false,
);

assert.equal(isPaidStripeInvoice({ status: "paid", amount_paid: 1000 }), true);
assert.equal(isPaidStripeInvoice({ status: "open", amount_paid: 0 }), false);

const subId = resolveStripeInvoiceSubscriptionId({
  id: "in_test",
  subscription: "sub_legacy",
} as never);
assert.equal(subId, "sub_legacy");

const subFromParent = resolveStripeInvoiceSubscriptionId({
  id: "in_test",
  parent: { subscription_details: { subscription: "sub_parent" } },
} as never);
assert.equal(subFromParent, "sub_parent");

assert.equal(resolveStripeCustomerId("cus_abc"), "cus_abc");
assert.equal(resolveStripeCustomerId({ id: "cus_obj" } as never), "cus_obj");

const webhookSource = readFileSync(
  path.join(process.cwd(), "src/app/api/giving/webhook/route.ts"),
  "utf8",
);
assert.match(webhookSource, /resolveStripeInvoiceSubscriptionId/);
assert.match(webhookSource, /checkout\.session\.async_payment_succeeded/);

const historyRoute = readFileSync(
  path.join(process.cwd(), "src/app/api/giving/history/route.ts"),
  "utf8",
);
assert.match(historyRoute, /listGivingRecordsForMember/);
assert.match(historyRoute, /no-store/);

const profileSource = readFileSync(
  path.join(process.cwd(), "src/components/give/MemberGivingHistory.tsx"),
  "utf8",
);
assert.match(profileSource, /giving-history-refresh/);
assert.match(profileSource, /visibilitychange/);

const checkoutSource = readFileSync(
  path.join(process.cwd(), "src/lib/giving-checkout-server.ts"),
  "utf8",
);
assert.match(checkoutSource, /resolveDonorIdentityFromInvoice/);
assert.match(checkoutSource, /confirmCheckoutGiftForMember/);

const reconcileRoute = readFileSync(
  path.join(process.cwd(), "src/app/api/admin/giving/reconcile/route.ts"),
  "utf8",
);
assert.match(reconcileRoute, /APPLY_STRIPE_GIVING_BACKFILL/);
assert.match(reconcileRoute, /reportMissingStripeGifts/);

console.log("giving-stripe-history.test.ts OK");
