/**
 * Regression: shop Stripe checkouts must not create GivingRecord rows.
 * Run: npm run test:giving:stripe-webhook-recording
 */
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type Stripe from "stripe";

function paidCheckoutSession(
  overrides: Partial<Stripe.Checkout.Session> & { id: string },
): Stripe.Checkout.Session {
  return {
    object: "checkout.session",
    mode: "payment",
    payment_status: "paid",
    amount_total: 2500,
    currency: "usd",
    metadata: {},
    customer_details: { email: "donor@test.local", name: "Test Donor" },
    ...overrides,
  } as Stripe.Checkout.Session;
}

async function withIsolatedGivingStore<T>(fn: () => Promise<T>): Promise<T> {
  const dir = mkdtempSync(join(tmpdir(), "giving-webhook-recording-"));
  mkdirSync(join(dir, "data"), { recursive: true });
  writeFileSync(join(dir, "data", "giving-records.json"), "[]");

  const previousCwd = process.cwd();
  const previousDatabaseUrl = process.env.DATABASE_URL;
  delete process.env.DATABASE_URL;
  process.chdir(dir);

  try {
    return await fn();
  } finally {
    process.chdir(previousCwd);
    if (previousDatabaseUrl !== undefined) {
      process.env.DATABASE_URL = previousDatabaseUrl;
    } else {
      delete process.env.DATABASE_URL;
    }
    rmSync(dir, { recursive: true, force: true });
  }
}

function recordCountFromDisk(): number {
  const raw = readFileSync(join(process.cwd(), "data", "giving-records.json"), "utf8");
  const parsed = JSON.parse(raw) as unknown[];
  return parsed.length;
}

async function main() {
  await withIsolatedGivingStore(async () => {
    const { recordGiftFromCheckoutSession, recordGiftFromInvoice } = await import(
      "../src/lib/giving-checkout-server"
    );
    const { listGivingRecords } = await import("../src/lib/giving-server");

    const shopSession = paidCheckoutSession({
      id: "cs_test_shop_only",
      amount_total: 1500,
      metadata: { type: "shop", userId: "user-shop" },
    });
    const shopResult = await recordGiftFromCheckoutSession(shopSession);
    assert.equal(shopResult, null, "shop checkout must not return a GivingRecord");
    assert.equal(recordCountFromDisk(), 0, "shop checkout must not persist GivingRecord");
    assert.equal((await listGivingRecords()).length, 0);

    const giftSession = paidCheckoutSession({
      id: "cs_test_gift_once",
      metadata: {
        fund: "tithe",
        frequency: "once",
        giftAmount: "25",
        feeAmount: "0",
        coverFees: "false",
      },
    });
    const giftRecord = await recordGiftFromCheckoutSession(giftSession);
    assert.ok(giftRecord, "one-time gift should create a record");
    assert.equal(giftRecord?.fund, "tithe");
    assert.equal(recordCountFromDisk(), 1);
    assert.equal((await listGivingRecords()).length, 1);

    const duplicate = await recordGiftFromCheckoutSession(giftSession);
    assert.equal(duplicate?.id, giftRecord?.id, "duplicate webhook delivery reuses same record");
    assert.equal(recordCountFromDisk(), 1);

    const invoice = {
      object: "invoice",
      id: "in_test_recurring_1",
      status: "paid",
      amount_paid: 5000,
      currency: "usd",
      billing_reason: "subscription_cycle",
      customer_email: "recurring@test.local",
      customer_name: "Recurring Donor",
      metadata: {
        fund: "missions",
        frequency: "monthly",
        giftAmount: "50",
      },
    } as Stripe.Invoice;

    const invoiceRecord = await recordGiftFromInvoice(invoice);
    assert.ok(invoiceRecord, "recurring invoice should still create a gift record");
    assert.equal(invoiceRecord?.fund, "missions");
    assert.equal(recordCountFromDisk(), 2);

    const invoiceDup = await recordGiftFromInvoice(invoice);
    assert.equal(invoiceDup?.id, invoiceRecord?.id, "duplicate invoice webhook is idempotent");
    assert.equal(recordCountFromDisk(), 2);
  });

  console.log("giving-stripe-webhook-recording.test.ts: ok");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
