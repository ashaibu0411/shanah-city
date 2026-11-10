import type Stripe from "stripe";

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

const FEE_NAME_HINTS = ["processing fee", "fee contribution"];

function lineItemLabel(item: Stripe.LineItem) {
  const product = item.price?.product;
  const productName =
    typeof product === "object" && product && "name" in product
      ? String(product.name ?? "")
      : "";
  return `${item.description ?? ""} ${productName}`.toLowerCase();
}

function isFeeLineItem(item: Stripe.LineItem) {
  const label = lineItemLabel(item);
  return FEE_NAME_HINTS.some((hint) => label.includes(hint));
}

/** Stripe Checkout LineItem total in cents (amount_total is already line gross). */
export function checkoutLineItemCents(item: Stripe.LineItem) {
  if (item.amount_total != null) return item.amount_total;
  const unit = item.price?.unit_amount ?? 0;
  return unit * (item.quantity ?? 1);
}

export type VerifiedCheckoutGiftAmounts =
  | {
      ok: true;
      giftAmount: number;
      feeAmount: number | null;
      source: "metadata" | "line_items";
    }
  | { ok: false; reason: "missing_gift_amount" | "line_items_ambiguous" | "amount_mismatch" };

/**
 * Gift dollars only — never fall back to Checkout gross (fee must not inflate charitable amount).
 */
export function resolveVerifiedCheckoutGiftAmounts(
  session: Pick<Stripe.Checkout.Session, "metadata" | "amount_total" | "line_items">,
): VerifiedCheckoutGiftAmounts {
  const metadata = session.metadata ?? {};
  const metaGift = Number(metadata.giftAmount);
  const metaFee = Number(metadata.feeAmount);
  const gross = session.amount_total ?? 0;

  if (Number.isFinite(metaGift) && metaGift > 0) {
    const giftCents = Math.round(metaGift * 100);
    const feeCents = Number.isFinite(metaFee) && metaFee >= 0 ? Math.round(metaFee * 100) : 0;
    if (gross > 0) {
      if (feeCents > 0 && giftCents + feeCents !== gross) {
        return { ok: false, reason: "amount_mismatch" };
      }
      if (feeCents === 0 && giftCents !== gross) {
        return { ok: false, reason: "amount_mismatch" };
      }
    }
    return {
      ok: true,
      giftAmount: roundMoney(metaGift),
      feeAmount: Number.isFinite(metaFee) && metaFee >= 0 ? roundMoney(metaFee) : null,
      source: "metadata",
    };
  }

  const items = session.line_items?.data ?? [];
  if (items.length === 0) {
    return { ok: false, reason: "missing_gift_amount" };
  }

  let giftCents = 0;
  let feeCents = 0;
  let giftLines = 0;
  let feeLines = 0;

  for (const item of items) {
    const cents = checkoutLineItemCents(item);
    if (cents <= 0) continue;
    if (isFeeLineItem(item)) {
      feeCents += cents;
      feeLines += 1;
    } else {
      giftCents += cents;
      giftLines += 1;
    }
  }

  if (giftLines !== 1 || giftCents <= 0) {
    return { ok: false, reason: "line_items_ambiguous" };
  }

  if (gross > 0 && giftCents + feeCents !== gross) {
    return { ok: false, reason: "amount_mismatch" };
  }

  return {
    ok: true,
    giftAmount: roundMoney(giftCents / 100),
    feeAmount: feeLines > 0 ? roundMoney(feeCents / 100) : null,
    source: "line_items",
  };
}

/** @deprecated Use resolveVerifiedCheckoutGiftAmounts — no gross-total fallback. */
export function giftAmountFromMetadata(
  metadata: Record<string, string> | null | undefined,
  _fallbackTotal: number,
) {
  const gift = Number(metadata?.giftAmount);
  if (Number.isFinite(gift) && gift > 0) return roundMoney(gift);
  return null;
}
