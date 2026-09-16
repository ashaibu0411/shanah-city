/** Stripe US standard card pricing (2.9% + $0.30). Override via env for nonprofit or custom rates. */
const CARD_RATE = Number(process.env.STRIPE_CARD_FEE_RATE ?? "0.029");
const CARD_FIXED = Number(process.env.STRIPE_CARD_FEE_FIXED ?? "0.30");
/** US bank account (ACH) direct debit — 0.8% capped at $5. */
const ACH_RATE = Number(process.env.STRIPE_ACH_FEE_RATE ?? "0.008");
const ACH_CAP = Number(process.env.STRIPE_ACH_FEE_CAP ?? "5");

export type GivingFeePaymentMethod = "card" | "ach";

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function stripeAchFeeOnTotal(total: number) {
  return Math.min(total * ACH_RATE, ACH_CAP);
}

/** Gross-up so the church receives about `giftAmount` after card fees. */
export function calculateCardFeeCoverage(giftAmount: number) {
  if (!Number.isFinite(giftAmount) || giftAmount <= 0) {
    return { fee: 0, total: 0 };
  }

  const gross = (giftAmount + CARD_FIXED) / (1 - CARD_RATE);
  const fee = roundMoney(gross - giftAmount);
  return { fee, total: roundMoney(giftAmount + fee) };
}

/** Gross-up so the church receives about `giftAmount` after ACH fees (0.8%, $5 cap). */
export function calculateAchFeeCoverage(giftAmount: number) {
  if (!Number.isFinite(giftAmount) || giftAmount <= 0) {
    return { fee: 0, total: 0 };
  }

  const uncappedTotal = giftAmount / (1 - ACH_RATE);
  if (stripeAchFeeOnTotal(uncappedTotal) <= ACH_CAP + 0.000_001) {
    const fee = roundMoney(uncappedTotal - giftAmount);
    return { fee, total: roundMoney(giftAmount + fee) };
  }

  const fee = roundMoney(ACH_CAP);
  return { fee, total: roundMoney(giftAmount + fee) };
}

export function processingFeeCoverage(giftAmount: number, method: GivingFeePaymentMethod) {
  return method === "ach"
    ? calculateAchFeeCoverage(giftAmount)
    : calculateCardFeeCoverage(giftAmount);
}

/** Fee estimate for “cover processing fees” (card is the default when method is unknown). */
export function estimateProcessingFeeCoverage(
  giftAmount: number,
  method: GivingFeePaymentMethod = "card",
) {
  return processingFeeCoverage(giftAmount, method);
}

export function formatGivingFeeHint(giftAmount: number) {
  const card = calculateCardFeeCoverage(giftAmount);
  const ach = calculateAchFeeCoverage(giftAmount);
  if (card.fee <= 0 && ach.fee <= 0) return "";
  if (ach.fee < card.fee) {
    return `Card ~${formatUsd(card.fee)}; bank (ACH) ~${formatUsd(ach.fee)}.`;
  }
  return `Card ~${formatUsd(card.fee)}; bank (ACH) ~${formatUsd(ach.fee)}.`;
}

function formatUsd(amount: number) {
  return amount.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

export function isGivingFeePaymentMethod(value: unknown): value is GivingFeePaymentMethod {
  return value === "card" || value === "ach";
}
