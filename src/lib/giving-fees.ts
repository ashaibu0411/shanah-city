/** Estimated Stripe US card pricing (2.9% + $0.30). Override via env if your church has nonprofit rates. */
const CARD_RATE = Number(process.env.STRIPE_CARD_FEE_RATE ?? "0.029");
const CARD_FIXED = Number(process.env.STRIPE_CARD_FEE_FIXED ?? "0.30");
const ACH_RATE = Number(process.env.STRIPE_ACH_FEE_RATE ?? "0.008");
const ACH_CAP = Number(process.env.STRIPE_ACH_FEE_CAP ?? "5");

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
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

export function calculateAchFeeCoverage(giftAmount: number) {
  if (!Number.isFinite(giftAmount) || giftAmount <= 0) {
    return { fee: 0, total: 0 };
  }

  const fee = roundMoney(Math.min(giftAmount * ACH_RATE, ACH_CAP));
  return { fee, total: roundMoney(giftAmount + fee) };
}

/** Default estimate shown on the give form (card is the higher / safer estimate). */
export function estimateProcessingFeeCoverage(giftAmount: number) {
  return calculateCardFeeCoverage(giftAmount);
}

export function formatGivingFeeHint(giftAmount: number) {
  const card = calculateCardFeeCoverage(giftAmount);
  const ach = calculateAchFeeCoverage(giftAmount);
  if (card.fee <= 0) return "";
  if (ach.fee < card.fee) {
    return `Card ~$${card.fee.toFixed(2)}; bank ~$${ach.fee.toFixed(2)}.`;
  }
  return `Estimated ~$${card.fee.toFixed(2)} on card/Apple Pay.`;
}
