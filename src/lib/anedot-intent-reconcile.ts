export type AnedotIntentSnapshot = {
  id: string;
  userId: string | null;
  amount: number;
  fund: string;
  expiresAt: Date;
  consumedAt: Date | null;
};

export type AnedotExistingLedgerSnapshot = {
  userId: string | null;
  fund: string | null;
  grossAmount: number | null;
  currency: string;
};

export type AnedotIntentReconcileResult =
  | { ok: true; userId: string | null; fund: string; amount: number; intentId: string }
  | { ok: false; reason: string };

export function reconcileAnedotIntent(input: {
  intent: AnedotIntentSnapshot | null;
  existingLedger: AnedotExistingLedgerSnapshot | null;
  webhookAmount: number | null;
  webhookFund: string | null;
  /** First-time donation binding only — not settlement/return/refund. */
  bindNewDonation: boolean;
  requireVerifiedAmount: boolean;
  now?: Date;
}): AnedotIntentReconcileResult {
  const now = input.now ?? new Date();

  if (input.existingLedger) {
    const fund = input.webhookFund ?? input.existingLedger.fund;
    if (!fund) return { ok: false, reason: "unmapped_fund" };
    const amount = input.requireVerifiedAmount
      ? (input.webhookAmount ?? input.existingLedger.grossAmount ?? null)
      : (input.webhookAmount ?? input.existingLedger.grossAmount ?? null);
    if (input.bindNewDonation && input.requireVerifiedAmount && (amount === null || amount <= 0)) {
      return { ok: false, reason: "missing_amount" };
    }
    return {
      ok: true,
      userId: input.existingLedger.userId,
      fund,
      amount: amount ?? 0,
      intentId: "",
    };
  }

  if (!input.intent) {
    if (!input.webhookFund) return { ok: false, reason: "unmapped_fund" };
    if (input.requireVerifiedAmount && (input.webhookAmount === null || input.webhookAmount <= 0)) {
      return { ok: false, reason: "missing_amount" };
    }
    if (!input.requireVerifiedAmount) {
      return { ok: false, reason: "missing_amount" };
    }
    return {
      ok: true,
      userId: null,
      fund: input.webhookFund,
      amount: input.webhookAmount ?? 0,
      intentId: "",
    };
  }

  if (input.bindNewDonation && input.intent.expiresAt.getTime() < now.getTime()) {
    return { ok: false, reason: "intent_expired" };
  }

  if (input.requireVerifiedAmount && (input.webhookAmount === null || input.webhookAmount <= 0)) {
    return { ok: false, reason: "missing_amount" };
  }

  const amount = input.webhookAmount as number;
  const centsIntent = Math.round(input.intent.amount * 100);
  const centsWebhook = Math.round(amount * 100);
  if (Math.abs(centsIntent - centsWebhook) > 1) {
    return { ok: false, reason: "amount_mismatch" };
  }
  const fund = input.webhookFund ?? input.intent.fund;
  if (input.webhookFund && input.webhookFund !== input.intent.fund) {
    return { ok: false, reason: "fund_mismatch" };
  }
  return {
    ok: true,
    userId: input.intent.userId,
    fund,
    amount,
    intentId: input.intent.id,
  };
}
