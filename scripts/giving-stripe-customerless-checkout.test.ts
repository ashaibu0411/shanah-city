import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  checkoutSessionDualCorroboratedForMember,
  corroboratedOwnershipBasis,
} from "../src/lib/giving-stripe-checkout-ownership";
import { stripeCheckoutCustomerVerifiedForMember } from "../src/lib/giving-stripe-member-sync-policy";
import { resolveVerifiedCheckoutGiftAmounts } from "../src/lib/giving-stripe-recovery-amounts";
import { verifyTargetedCheckoutRecovery } from "../src/lib/giving-stripe-recovery-server";
import { checkoutSettlementPaidAtUnix } from "../src/lib/giving-stripe-checkout-settlement";

const MEMBER = "user-1786578251521";
const INCIDENT_PI = "pi_3URO4jLmBWhgE7VM1r0q61Kx";
const INCIDENT_SESSION = "cs_live_b11H0HstqRpM0Y75dQGBXSFsnfAuaitgjeImefYHljAc2TKfCn02v72ZGX";
const INCIDENT_SUCCESS_UNIX = 1_792_675_443;

function oct2026IncidentSession(overrides: Record<string, unknown> = {}) {
  return {
    id: INCIDENT_SESSION,
    mode: "payment",
    payment_status: "paid",
    status: "complete",
    customer: null,
    client_reference_id: MEMBER,
    payment_intent: INCIDENT_PI,
    amount_total: 7560,
    currency: "usd",
    metadata: {
      fund: "offering",
      giftAmount: "75",
      feeAmount: "0.6",
      userId: MEMBER,
      coverFees: "true",
    },
    ...overrides,
  } as never;
}

assert.equal(checkoutSessionDualCorroboratedForMember(oct2026IncidentSession(), MEMBER), true);
assert.equal(
  corroboratedOwnershipBasis(oct2026IncidentSession(), MEMBER),
  "verified_dual_reference_without_stripe_customer",
);

assert.equal(
  stripeCheckoutCustomerVerifiedForMember(oct2026IncidentSession(), { id: MEMBER }, "cus_VR8r4k73xPRJp5"),
  true,
);
assert.equal(
  stripeCheckoutCustomerVerifiedForMember(
    oct2026IncidentSession({ client_reference_id: MEMBER, metadata: { fund: "offering", giftAmount: "75" } }),
    { id: MEMBER },
    "cus_VR8r4k73xPRJp5",
  ),
  false,
  "null customer with only metadata gift fields rejects",
);
assert.equal(
  stripeCheckoutCustomerVerifiedForMember(
    oct2026IncidentSession({
      client_reference_id: "",
      metadata: { fund: "offering", giftAmount: "75", userId: MEMBER },
    }),
    { id: MEMBER },
    "cus_VR8r4k73xPRJp5",
  ),
  false,
  "null customer missing client_reference_id rejects",
);
assert.equal(
  stripeCheckoutCustomerVerifiedForMember(
    oct2026IncidentSession({ customer: "cus_other" }),
    { id: MEMBER },
    "cus_VR8r4k73xPRJp5",
  ),
  false,
  "conflicting Stripe customer rejects",
);

const amounts = resolveVerifiedCheckoutGiftAmounts(oct2026IncidentSession());
assert.equal(amounts.ok, true);
if (amounts.ok) {
  assert.equal(amounts.giftAmount, 75);
  assert.equal(amounts.feeAmount, 0.6);
  assert.equal(amounts.giftAmount + (amounts.feeAmount ?? 0), 75.6);
}

const verifiedEventSettlement = {
  status: "verified" as const,
  paidAtUnix: INCIDENT_SUCCESS_UNIX,
  source: "stripe_success_event" as const,
  eventType: "payment_intent.succeeded",
  paymentSucceededVerified: true,
  successAtVerified: true,
  chargeCreatedAtUnix: INCIDENT_SUCCESS_UNIX,
  financeManualDateReviewRecommended: false,
};
assert.equal(checkoutSettlementPaidAtUnix(verifiedEventSettlement), INCIDENT_SUCCESS_UNIX);

const memberSyncSource = readFileSync(
  join(process.cwd(), "src/lib/giving-stripe-member-sync.ts"),
  "utf8",
);
assert.doesNotMatch(memberSyncSource, /listCustomerless/i);
assert.doesNotMatch(memberSyncSource, /CustomerlessDualCorroborated/i);

async function run() {
  const recovery = await verifyTargetedCheckoutRecovery({
    session: oct2026IncidentSession(),
    member: { id: MEMBER, email: "zaqnombre@yahoo.com" },
    memberStripeCustomerId: "cus_VR8r4k73xPRJp5",
  });
  assert.equal(recovery.ok, true);
  if (recovery.ok) {
    assert.equal(recovery.ownershipBasis, "verified_dual_reference_without_stripe_customer");
  }

  const singleMarker = await verifyTargetedCheckoutRecovery({
    session: oct2026IncidentSession({
      client_reference_id: "",
      metadata: { fund: "offering", giftAmount: "75", userId: MEMBER },
    }),
    member: { id: MEMBER, email: "zaqnombre@yahoo.com" },
    memberStripeCustomerId: "cus_VR8r4k73xPRJp5",
  });
  assert.equal(singleMarker.ok, false);

  console.log("giving-stripe-customerless-checkout.test.ts OK");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
