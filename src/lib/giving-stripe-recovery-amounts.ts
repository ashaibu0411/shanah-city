function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

/** Gift line only — excludes optional processing-fee line item (stored in notes via session metadata). */
export function giftAmountFromMetadata(metadata: Record<string, string> | null | undefined, fallbackTotal: number) {
  const gift = Number(metadata?.giftAmount);
  if (Number.isFinite(gift) && gift > 0) return roundMoney(gift);
  return roundMoney(fallbackTotal);
}
