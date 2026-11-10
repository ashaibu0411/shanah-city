import type Stripe from "stripe";

const INVOICE_LINE_PAGE_LIMIT = 100;
const INVOICE_LINE_MAX_PAGES = 10;

/** Load all invoice lines; returns truncated=true when pagination cap hit. */
export async function listAllInvoiceLineItems(
  stripe: Stripe,
  invoiceId: string,
): Promise<{ lines: Stripe.InvoiceLineItem[]; paginationComplete: boolean }> {
  const lines: Stripe.InvoiceLineItem[] = [];
  let startingAfter: string | undefined;
  let truncated = false;

  for (let page = 0; page < INVOICE_LINE_MAX_PAGES; page++) {
    const list = await stripe.invoices.listLineItems(invoiceId, {
      limit: INVOICE_LINE_PAGE_LIMIT,
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });
    lines.push(...list.data);
    if (!list.has_more) {
      return { lines, paginationComplete: true };
    }
    if (page === INVOICE_LINE_MAX_PAGES - 1) {
      truncated = true;
      break;
    }
    startingAfter = list.data[list.data.length - 1]?.id;
  }

  return { lines, paginationComplete: !truncated };
}
