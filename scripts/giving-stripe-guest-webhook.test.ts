import assert from "node:assert/strict";
import {
  checkoutMetadataOwnerConflictBlocksRecording,
  givingRecordUserIdFromCheckoutSession,
} from "../src/lib/giving-stripe-checkout-ownership";
import {
  trustedWebhookQualifiesForPaidAt,
  isAchPaymentIntent,
} from "../src/lib/giving-stripe-webhook-settlement";
import { resolveVerifiedInvoiceGiftAmounts } from "../src/lib/giving-stripe-invoice-amounts";

const GUEST_SESSION = {
  metadata: { fund: "offering", giftAmount: "25", userId: "" },
  client_reference_id: null,
  payment_status: "paid",
  payment_intent: "pi_guest",
  id: "cs_guest",
} as never;

assert.equal(givingRecordUserIdFromCheckoutSession(GUEST_SESSION), undefined);
assert.equal(checkoutMetadataOwnerConflictBlocksRecording(GUEST_SESSION), false);

assert.equal(
  checkoutMetadataOwnerConflictBlocksRecording({
    client_reference_id: "member-a",
    metadata: { userId: "member-b", fund: "offering", giftAmount: "25" },
  } as never),
  true,
);

const ACH_PI = { id: "pi_ach", status: "succeeded", payment_method_types: ["us_bank_account"] } as never;
assert.equal(isAchPaymentIntent(ACH_PI), true);

const OCT16_COMPLETED = {
  paidAtUnix: 1_760_601_600,
  eventType: "checkout.session.completed",
  eventId: "evt_completed_replay",
  checkoutSessionId: "cs_oct",
} as const;

assert.equal(
  trustedWebhookQualifiesForPaidAt(OCT16_COMPLETED, {
    id: "cs_oct",
    payment_intent: "pi_ach",
    payment_status: "paid",
  }, ACH_PI),
  false,
  "ACH must not use checkout.session.completed webhook time",
);

const OCT22_ASYNC = {
  paidAtUnix: 1_761_178_400,
  eventType: "checkout.session.async_payment_succeeded",
  eventId: "evt_async",
  checkoutSessionId: "cs_oct",
} as const;

assert.equal(
  trustedWebhookQualifiesForPaidAt(OCT22_ASYNC, {
    id: "cs_oct",
    payment_intent: "pi_ach",
    payment_status: "paid",
  }, ACH_PI),
  true,
);

const CARD_PI = { id: "pi_card", status: "succeeded", payment_method_types: ["card"] } as never;
assert.equal(
  trustedWebhookQualifiesForPaidAt(
    { ...OCT16_COMPLETED, eventType: "checkout.session.completed" },
    { id: "cs_oct", payment_intent: "pi_card", payment_status: "paid" },
    CARD_PI,
  ),
  true,
);

assert.equal(
  trustedWebhookQualifiesForPaidAt(
    { ...OCT16_COMPLETED, checkoutSessionId: undefined },
    { id: "cs_oct", payment_intent: "pi_card", payment_status: "paid" },
    CARD_PI,
  ),
  false,
  "checkout.session.completed requires explicit webhook checkoutSessionId",
);

assert.equal(
  trustedWebhookQualifiesForPaidAt(OCT16_COMPLETED, {
    id: "cs_oct",
    payment_intent: "pi_card",
    payment_status: "paid",
  }, null),
  false,
  "checkout.session.completed must not assume card when PI retrieval fails",
);

assert.equal(
  trustedWebhookQualifiesForPaidAt(OCT16_COMPLETED, {
    id: "cs_oct",
    payment_intent: "pi_ach",
    payment_status: "paid",
  }, null),
  false,
  "delayed ACH completion replay with missing PI must fail closed",
);

assert.equal(
  trustedWebhookQualifiesForPaidAt(
    { ...OCT22_ASYNC, checkoutSessionId: undefined },
    { id: "cs_oct", payment_intent: "pi_ach", payment_status: "paid" },
    ACH_PI,
  ),
  false,
  "async_payment_succeeded requires explicit webhook checkoutSessionId",
);

assert.equal(
  trustedWebhookQualifiesForPaidAt(
    { ...OCT22_ASYNC, checkoutSessionId: "cs_other" },
    { id: "cs_oct", payment_intent: "pi_ach", payment_status: "paid" },
    ACH_PI,
  ),
  false,
  "async_payment_succeeded rejects mismatched checkoutSessionId",
);

const OCT22_PI_SUCCEEDED = {
  paidAtUnix: 1_761_178_400,
  eventType: "payment_intent.succeeded",
  eventId: "evt_pi",
  paymentIntentId: "pi_ach",
} as const;

assert.equal(
  trustedWebhookQualifiesForPaidAt(OCT22_PI_SUCCEEDED, {
    id: "cs_oct",
    payment_intent: "pi_ach",
    payment_status: "paid",
  }, ACH_PI),
  true,
);

assert.equal(
  trustedWebhookQualifiesForPaidAt(
    { ...OCT22_PI_SUCCEEDED, paymentIntentId: undefined },
    { id: "cs_oct", payment_intent: "pi_ach", payment_status: "paid" },
    ACH_PI,
  ),
  false,
  "payment_intent.succeeded requires explicit webhook paymentIntentId",
);

assert.equal(
  trustedWebhookQualifiesForPaidAt(
    { ...OCT22_PI_SUCCEEDED, paymentIntentId: "pi_other" },
    { id: "cs_oct", payment_intent: "pi_ach", payment_status: "paid" },
    ACH_PI,
  ),
  false,
  "payment_intent.succeeded rejects mismatched paymentIntentId",
);

assert.equal(
  trustedWebhookQualifiesForPaidAt(OCT22_PI_SUCCEEDED, {
    id: "cs_oct",
    payment_intent: "pi_ach",
    payment_status: "paid",
  }, null),
  false,
  "payment_intent.succeeded requires retrieved PI status succeeded",
);

const paginated = resolveVerifiedInvoiceGiftAmounts(
  { amount_paid: 2500, lines: { data: [{ amount: 2500, quantity: 1, description: "Offering" }] } } as never,
  { fund: "offering" },
  { linesPaginationComplete: false },
);
assert.equal(paginated.ok, false);
if (!paginated.ok) {
  assert.equal(paginated.reason, "lines_pagination_incomplete");
}

console.log("giving-stripe-guest-webhook.test.ts OK");
