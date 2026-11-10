import assert from "node:assert/strict";
import { recoveryRecordWithAuditInTransaction } from "../src/lib/giving-stripe-recovery-write";
import { resolveCheckoutGiftPaidAtUnix } from "../src/lib/giving-stripe-checkout-paid-at";
import { createMemberReconcileEventScope } from "../src/lib/giving-stripe-reconcile-event-scope";
import { checkoutLineItemCents, resolveVerifiedCheckoutGiftAmounts } from "../src/lib/giving-stripe-recovery-amounts";
import { resolveVerifiedInvoiceGiftAmounts } from "../src/lib/giving-stripe-invoice-amounts";

type Store = {
  records: Map<string, { id: string; userId: string | null; amount: number; givenOn: string }>;
  audits: Map<string, Record<string, unknown>>;
};

function makeTx(store: Store, options?: { auditFailsOnCreate?: boolean }) {
  return {
    givingRecord: {
      findUnique: async ({ where }: { where: { stripeSessionId: string } }) => {
        const rec = store.records.get(where.stripeSessionId);
        if (!rec) return null;
        return { id: rec.id, userId: rec.userId, amount: rec.amount, givenOn: rec.givenOn };
      },
      create: async ({ data }: { data: Record<string, unknown> }) => {
        const sessionId = String(data.stripeSessionId);
        const record = {
          id: String(data.id),
          userId: (data.userId as string | null) ?? null,
          amount: Number(data.amount),
          givenOn: String(data.givenOn),
        };
        store.records.set(sessionId, record);
        return { id: record.id };
      },
    },
    givingStripeGiftRecoveryAudit: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        if (options?.auditFailsOnCreate) {
          throw new Error("audit_write_failed");
        }
        const id = String(data.id);
        store.audits.set(id, data);
        return { id };
      },
    },
  };
}

async function runTransactionTests() {
  const store: Store = { records: new Map(), audits: new Map() };
  const tx = makeTx(store);

  const first = await recoveryRecordWithAuditInTransaction(tx, {
    memberUserId: "member-a",
    record: {
      recordId: "give-1",
      memberUserId: "member-a",
      donorName: "Donor",
      donorEmail: "a@example.com",
      giftAmount: 75,
      currency: "USD",
      fund: "offering",
      givenOn: "2026-10-22",
      campusId: null,
      notes: "n",
      stripeSessionId: "cs_test_1",
      recordedByUserId: "finance",
      recordedByName: "Finance",
    },
    audit: {
      auditId: "audit-1",
      memberUserId: "member-a",
      stripeSessionId: "cs_test_1",
      stripePaymentIntentId: "pi_1",
      requestedByUserId: "finance",
      requestedByName: "Finance",
      ownershipBasis: "verified_customer_and_client_reference",
      giftAmount: 75,
      feeAmount: 0.6,
      givenOn: "2026-10-22",
      successAtVerified: true,
      outcome: "recorded",
      details: {},
    },
  });
  assert.equal(first.kind, "recorded");
  assert.equal(store.records.size, 1);
  assert.equal(store.audits.size, 1);

  const duplicate = await recoveryRecordWithAuditInTransaction(tx, {
    memberUserId: "member-a",
    record: {
      recordId: "give-2",
      memberUserId: "member-a",
      donorName: "Donor",
      donorEmail: "a@example.com",
      giftAmount: 75,
      currency: "USD",
      fund: "offering",
      givenOn: "2026-10-22",
      campusId: null,
      notes: "n",
      stripeSessionId: "cs_test_1",
      recordedByUserId: "finance",
      recordedByName: "Finance",
    },
    audit: {
      auditId: "audit-2",
      memberUserId: "member-a",
      stripeSessionId: "cs_test_1",
      stripePaymentIntentId: "pi_1",
      requestedByUserId: "finance",
      requestedByName: "Finance",
      ownershipBasis: "verified_customer_and_client_reference",
      giftAmount: 75,
      feeAmount: 0.6,
      givenOn: "2026-10-22",
      successAtVerified: true,
      outcome: "recorded",
      details: {},
    },
  });
  assert.equal(duplicate.kind, "already_recorded");
  assert.equal(store.records.size, 1);

  store.records.set("cs_other", {
    id: "give-other",
    userId: "member-b",
    amount: 75,
    givenOn: "2026-10-22",
  });
  const tx2 = makeTx(store);
  const cross = await recoveryRecordWithAuditInTransaction(tx2, {
    memberUserId: "member-a",
    record: {
      recordId: "give-3",
      memberUserId: "member-a",
      donorName: "Donor",
      donorEmail: "a@example.com",
      giftAmount: 75,
      currency: "USD",
      fund: "offering",
      givenOn: "2026-10-22",
      campusId: null,
      notes: "n",
      stripeSessionId: "cs_other",
      recordedByUserId: "finance",
      recordedByName: "Finance",
    },
    audit: {
      auditId: "audit-3",
      memberUserId: "member-a",
      stripeSessionId: "cs_other",
      stripePaymentIntentId: null,
      requestedByUserId: "finance",
      requestedByName: "Finance",
      ownershipBasis: "verified_customer_and_client_reference",
      giftAmount: 75,
      feeAmount: null,
      givenOn: "2026-10-22",
      successAtVerified: true,
      outcome: "recorded",
      details: {},
    },
  });
  assert.equal(cross.kind, "other_member");

  const rollbackStore: Store = { records: new Map(), audits: new Map() };
  const rollbackTx = makeTx(rollbackStore, { auditFailsOnCreate: true });
  const snapshotRecords = new Map(rollbackStore.records);
  const snapshotAudits = new Map(rollbackStore.audits);
  await assert.rejects(async () => {
    try {
      await recoveryRecordWithAuditInTransaction(rollbackTx, {
      memberUserId: "member-a",
      record: {
        recordId: "give-rb",
        memberUserId: "member-a",
        donorName: "Donor",
        donorEmail: null,
        giftAmount: 25,
        currency: "USD",
        fund: "offering",
        givenOn: "2026-10-22",
        campusId: null,
        notes: "n",
        stripeSessionId: "cs_rb",
        recordedByUserId: "finance",
        recordedByName: "Finance",
      },
      audit: {
        auditId: "audit-rb",
        memberUserId: "member-a",
        stripeSessionId: "cs_rb",
        stripePaymentIntentId: null,
        requestedByUserId: "finance",
        requestedByName: "Finance",
        ownershipBasis: "verified_customer_and_client_reference",
        giftAmount: 25,
        feeAmount: null,
        givenOn: "2026-10-22",
        successAtVerified: true,
        outcome: "recorded",
        details: {},
      },
    });
    } catch (error) {
      rollbackStore.records = snapshotRecords;
      rollbackStore.audits = snapshotAudits;
      throw error;
    }
  });
  assert.equal(rollbackStore.records.size, 0);

  const concurrentStore: Store = { records: new Map(), audits: new Map() };
  const concurrentTx = makeTx(concurrentStore);
  const [a, b] = await Promise.all([
    recoveryRecordWithAuditInTransaction(concurrentTx, {
      memberUserId: "member-a",
      record: {
        recordId: "give-ca",
        memberUserId: "member-a",
        donorName: "Donor",
        donorEmail: null,
        giftAmount: 50,
        currency: "USD",
        fund: "offering",
        givenOn: "2026-10-22",
        campusId: null,
        notes: "n",
        stripeSessionId: "cs_concurrent",
        recordedByUserId: "finance",
        recordedByName: "Finance",
      },
      audit: {
        auditId: "audit-ca",
        memberUserId: "member-a",
        stripeSessionId: "cs_concurrent",
        stripePaymentIntentId: null,
        requestedByUserId: "finance",
        requestedByName: "Finance",
        ownershipBasis: "verified_customer_and_client_reference",
        giftAmount: 50,
        feeAmount: null,
        givenOn: "2026-10-22",
        successAtVerified: true,
        outcome: "recorded",
        details: {},
      },
    }),
    recoveryRecordWithAuditInTransaction(concurrentTx, {
      memberUserId: "member-a",
      record: {
        recordId: "give-cb",
        memberUserId: "member-a",
        donorName: "Donor",
        donorEmail: null,
        giftAmount: 50,
        currency: "USD",
        fund: "offering",
        givenOn: "2026-10-22",
        campusId: null,
        notes: "n",
        stripeSessionId: "cs_concurrent",
        recordedByUserId: "finance",
        recordedByName: "Finance",
      },
      audit: {
        auditId: "audit-cb",
        memberUserId: "member-a",
        stripeSessionId: "cs_concurrent",
        stripePaymentIntentId: null,
        requestedByUserId: "finance",
        requestedByName: "Finance",
        ownershipBasis: "verified_customer_and_client_reference",
        giftAmount: 50,
        feeAmount: null,
        givenOn: "2026-10-22",
        successAtVerified: true,
        outcome: "recorded",
        details: {},
      },
    }),
  ]);
  const recorded = [a, b].filter((row) => row.kind === "recorded");
  const duped = [a, b].filter((row) => row.kind === "already_recorded");
  assert.equal(recorded.length + duped.length, 2);
  assert.equal(concurrentStore.records.size, 1);
}

async function runPaidAtTests() {
  const scope = createMemberReconcileEventScope();
  const session = {
    id: "cs_1",
    mode: "payment",
    payment_status: "paid",
    payment_intent: "pi_1",
  } as never;

  const stripe = {
    checkout: { sessions: { retrieve: async () => session } },
    paymentIntents: {
      retrieve: async () => ({
        id: "pi_1",
        status: "succeeded",
        latest_charge: { id: "ch_1", status: "succeeded", created: 1_000 },
        created: 1_000,
      }),
    },
    events: { list: async () => ({ data: [], has_more: false }) },
  } as never;

  const withWebhook = await resolveCheckoutGiftPaidAtUnix(stripe, session, scope, {
    trustedWebhookSettlement: { paidAtUnix: 1_762_920_000, eventType: "payment_intent.succeeded", eventId: "evt_1" },
  });
  assert.equal(withWebhook, 1_762_920_000);

  const strict = await resolveCheckoutGiftPaidAtUnix(stripe, session, scope, {
    requireEventListSuccessDate: true,
    trustedWebhookSettlement: { paidAtUnix: 1_762_920_000, eventType: "payment_intent.succeeded", eventId: "evt_1" },
  });
  assert.equal(strict, null);
}

function runAmountTests() {
  const qtySession = {
    metadata: { fund: "offering", giftAmount: "50" },
    amount_total: 5000,
    line_items: {
      data: [
        {
          amount_total: 5000,
          quantity: 2,
          description: "Shanah City Offering",
          price: { unit_amount: 2500, product: { name: "Shanah City Offering" } },
        },
      ],
    },
  } as never;
  assert.equal(checkoutLineItemCents(qtySession.line_items.data[0]), 5000);

  const mismatch = resolveVerifiedCheckoutGiftAmounts({
    metadata: { fund: "offering", giftAmount: "75", feeAmount: "0.60" },
    amount_total: 8000,
    line_items: { data: [] },
  } as never);
  assert.equal(mismatch.ok, false);

  const invoice = resolveVerifiedInvoiceGiftAmounts(
    {
      amount_paid: 5000,
      lines: {
        data: [
          { amount: 5000, quantity: 1, description: "Shanah City Offering", price: { product: { name: "Offering" } } },
        ],
      },
    } as never,
    { fund: "offering" },
  );
  assert.equal(invoice.ok && invoice.giftAmount === 50, true);
}

async function main() {
  runAmountTests();
  await runTransactionTests();
  await runPaidAtTests();
  console.log("giving-stripe-recovery-transaction.test.ts OK");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
