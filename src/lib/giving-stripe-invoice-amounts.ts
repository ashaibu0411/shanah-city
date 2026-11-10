import type Stripe from "stripe";
import { isKnownGivingFund } from "@/lib/giving-stripe-eligibility";

const FEE_NAME_HINTS = ["processing fee", "fee contribution"];

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function invoiceLineLabel(line: Stripe.InvoiceLineItem) {
  return (line.description ?? "").toLowerCase();
}

function isFeeInvoiceLine(line: Stripe.InvoiceLineItem) {
  return FEE_NAME_HINTS.some((hint) => invoiceLineLabel(line).includes(hint));
}

function invoiceLineCents(line: Stripe.InvoiceLineItem) {
  if (line.amount != null) return line.amount;
  const extended = line as Stripe.InvoiceLineItem & {
    price?: { unit_amount?: number | null };
  };
  const unit = extended.price?.unit_amount ?? 0;
  const qty = line.quantity ?? 1;
  return unit * qty;
}

export type VerifiedInvoiceGiftAmounts =
  | {
      ok: true;
      giftAmount: number;
      feeAmount: number | null;
      source: "metadata" | "invoice_lines";
    }
  | {
      ok: false;
      reason:
        | "missing_gift_amount"
        | "lines_ambiguous"
        | "amount_mismatch"
        | "missing_fund"
        | "lines_pagination_incomplete";
    };

export function isShanahGivingInvoiceEligible(
  metadata: Record<string, string>,
  invoice: Pick<Stripe.Invoice, "lines" | "amount_paid">,
  options?: { linesPaginationComplete?: boolean },
) {
  if (!isKnownGivingFund(metadata.fund)) return false;
  const metaGift = Number(metadata.giftAmount);
  if (Number.isFinite(metaGift) && metaGift > 0) return true;
  if (options?.linesPaginationComplete === false) return false;
  const lines = invoice.lines?.data ?? [];
  return lines.some((line) => invoiceLineCents(line) > 0);
}

export function resolveVerifiedInvoiceGiftAmounts(
  invoice: Pick<Stripe.Invoice, "amount_paid" | "lines">,
  metadata: Record<string, string>,
  options?: { linesPaginationComplete?: boolean },
): VerifiedInvoiceGiftAmounts {
  if (!isKnownGivingFund(metadata.fund)) {
    return { ok: false, reason: "missing_fund" };
  }

  const metaGift = Number(metadata.giftAmount);
  const metaFee = Number(metadata.feeAmount);
  const gross = invoice.amount_paid ?? 0;

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

  if (options?.linesPaginationComplete === false) {
    return { ok: false, reason: "lines_pagination_incomplete" };
  }

  const lines = invoice.lines?.data ?? [];
  if (lines.length === 0) {
    return { ok: false, reason: "missing_gift_amount" };
  }

  let giftCents = 0;
  let feeCents = 0;
  let giftLines = 0;
  let feeLines = 0;

  for (const line of lines) {
    const cents = invoiceLineCents(line);
    if (cents <= 0) continue;
    if (isFeeInvoiceLine(line)) {
      feeCents += cents;
      feeLines += 1;
    } else {
      giftCents += cents;
      giftLines += 1;
    }
  }

  if (giftLines < 1 || giftCents <= 0) {
    return { ok: false, reason: "lines_ambiguous" };
  }

  if (gross > 0 && giftCents + feeCents !== gross) {
    return { ok: false, reason: "amount_mismatch" };
  }

  return {
    ok: true,
    giftAmount: roundMoney(giftCents / 100),
    feeAmount: feeLines > 0 ? roundMoney(feeCents / 100) : null,
    source: "invoice_lines",
  };
}
