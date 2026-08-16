import type Stripe from "stripe";
import type { PublicMember } from "@/lib/auth-types";
import {
  fundLabel,
  type GivingCheckoutFrequency,
  type GivingFund,
} from "@/lib/giving-types";
import {
  createGivingRecord,
  getGivingRecordByStripeInvoiceId,
  getGivingRecordByStripeSessionId,
} from "@/lib/giving-server";
import { getAppBaseUrl, getStripe, isStripeGivingConfigured } from "@/lib/stripe-server";

export { isStripeGivingConfigured };

function todayIso() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function amountInDollars(cents: number | null | undefined) {
  if (!cents || cents <= 0) return 0;
  return Math.round(cents) / 100;
}

function parseFund(value: string | null | undefined): GivingFund {
  const fund = String(value ?? "offering") as GivingFund;
  return fund;
}

function metadataUserId(value: string | null | undefined) {
  const id = value?.trim();
  return id || undefined;
}

function metadataValue(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

export async function createGivingCheckoutSession(input: {
  amount: number;
  fund: GivingFund;
  frequency: GivingCheckoutFrequency;
  user?: PublicMember | null;
}) {
  if (!isStripeGivingConfigured()) {
    throw new Error("Online giving is not configured yet.");
  }

  if (!Number.isFinite(input.amount) || input.amount < 1) {
    throw new Error("Enter an amount of at least $1.");
  }

  const stripe = getStripe();
  const baseUrl = getAppBaseUrl();
  const amountCents = Math.round(input.amount * 100);
  const fundLabelText = fundLabel(input.fund);
  const metadata = {
    fund: input.fund,
    frequency: input.frequency,
    userId: input.user?.id ?? "",
    campusId: input.user?.campusId ?? "",
    donorName: input.user?.name ?? "",
  };

  const common = {
    success_url: `${baseUrl}/give/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/give/cancel`,
    client_reference_id: input.user?.id,
    customer_email: input.user?.email,
    metadata,
    payment_method_types: ["card"] as Stripe.Checkout.SessionCreateParams["payment_method_types"],
  };

  if (input.frequency === "monthly") {
    return stripe.checkout.sessions.create({
      mode: "subscription",
      ...common,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Shanah City ${fundLabelText}`,
              description: "Monthly recurring gift to Shanah City",
            },
            unit_amount: amountCents,
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
      subscription_data: {
        metadata,
      },
    });
  }

  return stripe.checkout.sessions.create({
    mode: "payment",
    ...common,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `Shanah City ${fundLabelText}`,
            description: "One-time gift to Shanah City",
          },
          unit_amount: amountCents,
        },
        quantity: 1,
      },
    ],
  });
}

async function recordStripeGift(input: {
  amount: number;
  currency: string;
  fund: GivingFund;
  donorName: string;
  donorEmail?: string;
  userId?: string;
  campusId?: string;
  notes?: string;
  stripeSessionId?: string;
  stripeInvoiceId?: string;
}) {
  if (input.stripeSessionId) {
    const existing = await getGivingRecordByStripeSessionId(input.stripeSessionId);
    if (existing) return existing;
  }

  if (input.stripeInvoiceId) {
    const existing = await getGivingRecordByStripeInvoiceId(input.stripeInvoiceId);
    if (existing) return existing;
  }

  return createGivingRecord({
    userId: input.userId,
    donorName: input.donorName,
    donorEmail: input.donorEmail,
    amount: input.amount,
    currency: input.currency.toUpperCase(),
    fund: input.fund,
    method: "stripe",
    givenOn: todayIso(),
    campusId: input.campusId,
    notes: input.notes,
    source: "stripe",
    stripeSessionId: input.stripeSessionId,
    stripeInvoiceId: input.stripeInvoiceId,
    recordedBy: input.userId ?? "stripe",
    recordedByName: "Online giving",
  });
}

export async function recordGiftFromCheckoutSession(session: Stripe.Checkout.Session) {
  if (session.mode !== "payment") {
    return null;
  }

  if (session.payment_status !== "paid") {
    return null;
  }

  const amount = amountInDollars(session.amount_total);
  if (amount <= 0) return null;

  const fund = parseFund(session.metadata?.fund);
  const donorEmail =
    session.customer_details?.email ?? session.customer_email ?? undefined;
  const donorName =
    session.customer_details?.name?.trim() ||
    session.metadata?.donorName?.trim() ||
    donorEmail?.split("@")[0] ||
    "Online donor";

  return recordStripeGift({
    amount,
    currency: session.currency ?? "usd",
    fund,
    donorName,
    donorEmail,
    userId: session.client_reference_id || metadataUserId(session.metadata?.userId),
    campusId: metadataValue(session.metadata?.campusId),
    notes:
      session.metadata?.frequency === "monthly"
        ? "Recurring gift (first payment via checkout)"
        : "One-time online gift",
    stripeSessionId: session.id,
  });
}

export async function recordGiftFromInvoice(
  invoice: Stripe.Invoice,
  extraMetadata: Record<string, string> = {},
) {
  if (invoice.status !== "paid") {
    return null;
  }

  const amount = amountInDollars(invoice.amount_paid);
  if (amount <= 0) return null;

  const metadata = { ...(invoice.metadata ?? {}), ...extraMetadata };
  const fund = parseFund(metadata.fund);
  const donorEmail = invoice.customer_email ?? undefined;
  const donorName =
    invoice.customer_name?.trim() ||
    metadata.donorName?.trim() ||
    donorEmail?.split("@")[0] ||
    "Online donor";

  const frequencyNote =
    invoice.billing_reason === "subscription_cycle"
      ? "Monthly recurring gift"
      : "Monthly recurring gift (initial)";

  return recordStripeGift({
    amount,
    currency: invoice.currency ?? "usd",
    fund,
    donorName,
    donorEmail,
    userId: metadataUserId(metadata.userId),
    campusId: metadataValue(metadata.campusId),
    notes: frequencyNote,
    stripeInvoiceId: invoice.id,
  });
}

export async function getCheckoutSessionForUser(sessionId: string, userId?: string) {
  if (!isStripeGivingConfigured()) return null;

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (userId && session.client_reference_id && session.client_reference_id !== userId) {
    return null;
  }

  return session;
}
