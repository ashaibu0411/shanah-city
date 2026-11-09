import type Stripe from "stripe";

/** Resolve subscription id from Stripe Invoice across API versions. */
export function resolveStripeInvoiceSubscriptionId(invoice: Stripe.Invoice): string | undefined {
  const legacy = (invoice as Stripe.Invoice & { subscription?: string | Stripe.Subscription | null })
    .subscription;
  if (typeof legacy === "string" && legacy.trim()) return legacy.trim();
  if (legacy && typeof legacy === "object" && "id" in legacy && legacy.id) {
    return String(legacy.id);
  }

  const parentRef = invoice.parent?.subscription_details?.subscription;
  if (typeof parentRef === "string" && parentRef.trim()) return parentRef.trim();

  for (const line of invoice.lines?.data ?? []) {
    const lineSub = (line as Stripe.InvoiceLineItem & {
      subscription?: string | Stripe.Subscription | null;
    }).subscription;
    if (typeof lineSub === "string" && lineSub.trim()) return lineSub.trim();
    if (lineSub && typeof lineSub === "object" && "id" in lineSub && lineSub.id) {
      return String(lineSub.id);
    }
  }

  return undefined;
}

export function resolveStripeCustomerId(
  customer: Stripe.Invoice["customer"] | Stripe.Checkout.Session["customer"],
): string | undefined {
  if (typeof customer === "string" && customer.trim()) return customer.trim();
  if (customer && typeof customer === "object" && "id" in customer && customer.id) {
    return String(customer.id);
  }
  return undefined;
}
