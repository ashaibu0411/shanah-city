import assert from "node:assert/strict";
import {
  checkoutSessionCorroboratedForMember,
  checkoutSessionCorroboratedMemberId,
  checkoutSessionHasCorroboratedMemberIdentity,
  corroboratedOwnershipBasis,
} from "../src/lib/giving-stripe-checkout-ownership";
import {
  giftAmountFromMetadata,
  resolveVerifiedCheckoutGiftAmounts,
} from "../src/lib/giving-stripe-recovery-amounts";
import { verifyTargetedCheckoutRecovery } from "../src/lib/giving-stripe-recovery-server";

const MEMBER = "user-1786578251521";

function sessionFixture(overrides: Record<string, unknown> = {}) {
  return {
    mode: "payment",
    payment_status: "paid",
    metadata: {
      fund: "offering",
      giftAmount: "75",
      feeAmount: "0.60",
      userId: MEMBER,
      coverFees: "true",
    },
    client_reference_id: MEMBER,
    customer: "cus_linked",
    amount_total: 7560,
    line_items: {
      data: [
        {
          amount_total: 7500,
          quantity: 1,
          description: "Shanah City Offering",
          price: { product: { name: "Shanah City Offering" } },
        },
        {
          amount_total: 60,
          quantity: 1,
          description: "Processing fee contribution",
          price: { product: { name: "Processing fee contribution" } },
        },
      ],
    },
    ...overrides,
  } as never;
}

assert.equal(checkoutSessionHasCorroboratedMemberIdentity(sessionFixture()), true);
assert.equal(
  checkoutSessionCorroboratedForMember(sessionFixture(), MEMBER),
  true,
);
assert.equal(
  corroboratedOwnershipBasis(sessionFixture(), MEMBER),
  "verified_customer_and_corroborated_reference_and_metadata",
);

assert.equal(
  checkoutSessionHasCorroboratedMemberIdentity(
    sessionFixture({ client_reference_id: "", metadata: { fund: "offering", giftAmount: "75" } }),
  ),
  false,
);

assert.equal(
  checkoutSessionCorroboratedMemberId(
    sessionFixture({
      client_reference_id: "user-other",
      metadata: { userId: MEMBER, fund: "offering", giftAmount: "75" },
    }),
  ),
  null,
);

const amounts = resolveVerifiedCheckoutGiftAmounts(sessionFixture());
assert.equal(amounts.ok, true);
if (amounts.ok) {
  assert.equal(amounts.giftAmount, 75);
  assert.equal(amounts.feeAmount, 0.6);
}

  const noMetaGift = resolveVerifiedCheckoutGiftAmounts(
    sessionFixture({
      metadata: { fund: "offering" },
      amount_total: 7500,
      line_items: {
        data: [
          {
            amount_total: 7500,
            quantity: 1,
            description: "Shanah City Offering",
            price: { product: { name: "Shanah City Offering" } },
          },
        ],
      },
    }),
  );
assert.equal(noMetaGift.ok, true);
if (noMetaGift.ok) {
  assert.equal(noMetaGift.giftAmount, 75);
  assert.equal(noMetaGift.source, "line_items");
}

assert.equal(giftAmountFromMetadata({ giftAmount: "75" }, 75.6), 75);
assert.equal(giftAmountFromMetadata({}, 75.6), null);

async function run() {
  const verified = await verifyTargetedCheckoutRecovery({
    session: sessionFixture(),
    member: { id: MEMBER, email: "donor@example.com" },
    memberStripeCustomerId: "cus_linked",
  });
  assert.equal(verified.ok, true);

  const customerOnly = await verifyTargetedCheckoutRecovery({
    session: sessionFixture({
      client_reference_id: "",
      metadata: { fund: "offering", giftAmount: "75" },
    }),
    member: { id: MEMBER, email: "donor@example.com" },
    memberStripeCustomerId: "cus_linked",
  });
  assert.equal(customerOnly.ok, false);

  console.log("giving-stripe-recovery-safeguards.test.ts OK");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
