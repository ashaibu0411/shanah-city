export type AnedotIntentSnapshot = {
  id: string;
  userId: string | null;
  amount: number;
  fund: string;
  expiresAt: Date;
  consumedAt: Date | null;
};

export type AnedotIntentReconcileResult =
  | { ok: true; userId: string | null; fund: string; amount: number; intentId: string }
  | { ok: false; reason: string };

export function reconcileAnedotIntent(input: {
  intent: AnedotIntentSnapshot | null;
  webhookAmount: number | null;
  webhookFund: string | null;
  now?: Date;
}): AnedotIntentReconcileResult {
  const now = input.now ?? new Date();
  if (!input.intent) {
    if (!input.webhookFund) {
      return { ok: false, reason: "unmapped_fund" };
    }
    if (input.webhookAmount === null || input.webhookAmount <= 0) {
      return { ok: false, reason: "missing_amount" };
    }
    return {
      ok: true,
      userId: null,
      fund: input.webhookFund,
      amount: input.webhookAmount,
      intentId: "",
    };
  }
  if (input.intent.expiresAt.getTime() < now.getTime()) {
    return { ok: false, reason: "intent_expired" };
  }
  const amount = input.webhookAmount ?? input.intent.amount;
  const centsIntent = Math.round(input.intent.amount * 100);
  const centsWebhook = Math.round(amount * 100);
  if (input.webhookAmount !== null && Math.abs(centsIntent - centsWebhook) > 1) {
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
    amount: amount || input.intent.amount,
    intentId: input.intent.id,
  };
}
