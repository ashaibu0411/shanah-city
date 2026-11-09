import type Stripe from "stripe";
import type { PublicMember } from "@/lib/auth-types";
import { getUserByEmail, getUserById } from "@/lib/auth-server";
import {
  fundLabel,
  isRecurringCheckoutFrequency,
  normalizeGivingEmail,
  recurringGiftNote,
  type GivingCheckoutFrequency,
  type GivingFund,
} from "@/lib/giving-types";
import {
  createGivingRecord,
  getGivingRecordByStripeInvoiceId,
  getGivingRecordByStripeSessionId,
  markThankYouSent,
} from "@/lib/giving-server";
import { sendGivingThankYou } from "@/lib/giving-notify-server";
import { getZonedDateParts } from "@/lib/denver-time";
import { formatPersonNameForDisplay, getFormattedAccountName } from "@/lib/member-display-name";
import {
  getAppBaseUrl,
  getStripe,
  isStripeGivingConfigured,
  STRIPE_CHECKOUT_PAYMENT_METHOD_OPTIONS,
} from "@/lib/stripe-server";
import { linkStripeCustomerFromCheckoutSession } from "@/lib/giving-billing-server";
import {
  estimateProcessingFeeCoverage,
  isGivingFeePaymentMethod,
  type GivingFeePaymentMethod,
} from "@/lib/giving-fees";
import {
  givingTodayDateKey,
  normalizeRecurringStartDateInput,
  stripeTrialEndForRecurringStart,
  validateRecurringStartDate,
} from "@/lib/giving-recurring-start";
import {
  metadataValue,
  resolveDonorIdentityFromCheckoutSession,
  resolveDonorIdentityFromInvoice,
} from "@/lib/giving-stripe-identity";

export { isStripeGivingConfigured };

function giftDateIso(date = new Date()) {
  return getZonedDateParts(date).dateKey;
}

function amountInDollars(cents: number | null | undefined) {
  if (!cents || cents <= 0) return 0;
  return Math.round(cents) / 100;
}

function parseFund(value: string | null | undefined): GivingFund {
  const fund = String(value ?? "offering") as GivingFund;
  return fund;
}

export async function createGivingCheckoutSession(input: {
  amount: number;
  fund: GivingFund;
  frequency: GivingCheckoutFrequency;
  coverFees?: boolean;
  paymentMethod?: GivingFeePaymentMethod;
  recurringStartDate?: string;
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
  const giftAmount = roundMoney(input.amount);
  const giftCents = Math.round(giftAmount * 100);
  const feePaymentMethod: GivingFeePaymentMethod =
    input.paymentMethod && isGivingFeePaymentMethod(input.paymentMethod)
      ? input.paymentMethod
      : "card";
  const feeCoverage = input.coverFees
    ? estimateProcessingFeeCoverage(giftAmount, feePaymentMethod)
    : { fee: 0, total: giftAmount };
  const feeCents = Math.round(feeCoverage.fee * 100);
  const fundLabelText = fundLabel(input.fund);
  let recurringStartDate: string | undefined;
  if (isRecurringCheckoutFrequency(input.frequency)) {
    const rawStart =
      input.recurringStartDate !== undefined && input.recurringStartDate !== ""
        ? normalizeRecurringStartDateInput(input.recurringStartDate)
        : givingTodayDateKey();
    recurringStartDate = validateRecurringStartDate(rawStart ?? givingTodayDateKey());
  }

  const metadata = {
    fund: input.fund,
    frequency: input.frequency,
    userId: input.user?.id ?? "",
    campusId: input.user?.campusId ?? "",
    donorName: input.user ? getFormattedAccountName(input.user) : "",
    giftAmount: String(giftAmount),
    feeAmount: String(feeCoverage.fee),
    coverFees: input.coverFees ? "true" : "false",
    feePaymentMethod,
    ...(recurringStartDate ? { recurringStartDate } : {}),
  };

  function giftLineItem(
    recurring?: Stripe.Checkout.SessionCreateParams.LineItem.PriceData.Recurring,
    description = "One-time gift to Shanah City",
  ) {
    return {
      price_data: {
        currency: "usd",
        product_data: {
          name: `Shanah City ${fundLabelText}`,
          description,
        },
        unit_amount: giftCents,
        ...(recurring ? { recurring } : {}),
      },
      quantity: 1,
    };
  }

  function feeLineItem(recurring?: Stripe.Checkout.SessionCreateParams.LineItem.PriceData.Recurring) {
    const feeDescription =
      feePaymentMethod === "ach"
        ? "Optional help covering bank (ACH) processing costs"
        : "Optional help covering card processing costs";
    return {
      price_data: {
        currency: "usd",
        product_data: {
          name: "Processing fee contribution",
          description: feeDescription,
        },
        unit_amount: feeCents,
        ...(recurring ? { recurring } : {}),
      },
      quantity: 1,
    };
  }

  const checkoutPaymentMethodTypes: Stripe.Checkout.SessionCreateParams["payment_method_types"] =
    feePaymentMethod === "ach" ? ["us_bank_account"] : ["card"];

  const common = {
    success_url: `${baseUrl}/give/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/give/cancel`,
    client_reference_id: input.user?.id,
    customer_email: input.user?.email,
    metadata,
    payment_method_types: checkoutPaymentMethodTypes,
    payment_method_options: STRIPE_CHECKOUT_PAYMENT_METHOD_OPTIONS,
  };

  if (isRecurringCheckoutFrequency(input.frequency)) {
    const recurring =
      input.frequency === "weekly"
        ? { interval: "week" as const }
        : input.frequency === "biweekly"
          ? { interval: "week" as const, interval_count: 2 }
          : { interval: "month" as const };

    const recurringLabel =
      input.frequency === "weekly"
        ? "Weekly"
        : input.frequency === "biweekly"
          ? "Every 2 weeks"
          : "Monthly";

    const trialEnd = stripeTrialEndForRecurringStart(recurringStartDate!);

    return stripe.checkout.sessions.create({
      mode: "subscription",
      ...common,
      line_items: [
        giftLineItem(recurring, `${recurringLabel} recurring gift to Shanah City`),
        ...(feeCents > 0 ? [feeLineItem(recurring)] : []),
      ],
      subscription_data: {
        metadata,
        ...(trialEnd ? { trial_end: trialEnd } : {}),
      },
    });
  }

  return stripe.checkout.sessions.create({
    mode: "payment",
    ...common,
    line_items: [
      giftLineItem(),
      ...(feeCents > 0 ? [feeLineItem()] : []),
    ],
  });
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

async function donorNameForGivingRecord(input: {
  userId?: string;
  donorEmail?: string;
  fallbackName: string;
}) {
  if (input.userId) {
    const member = await getUserById(input.userId);
    if (member?.name?.trim()) {
      return formatPersonNameForDisplay(member.name);
    }
  }

  if (input.donorEmail) {
    const member = await getUserByEmail(input.donorEmail);
    if (member?.name?.trim()) {
      return formatPersonNameForDisplay(member.name);
    }
  }

  const fallback = input.fallbackName.trim() || "Online donor";
  return formatPersonNameForDisplay(fallback) || fallback;
}

function giftAmountFromMetadata(metadata: Record<string, string> | null | undefined, fallbackTotal: number) {
  const gift = Number(metadata?.giftAmount);
  if (Number.isFinite(gift) && gift > 0) return roundMoney(gift);
  return roundMoney(fallbackTotal);
}

function giftNotesFromMetadata(
  metadata: Record<string, string> | null | undefined,
  baseNote: string,
) {
  const fee = Number(metadata?.feeAmount);
  if (metadata?.coverFees === "true" && Number.isFinite(fee) && fee > 0) {
    return `${baseNote} Donor added $${fee.toFixed(2)} to cover processing fees.`;
  }
  return baseNote;
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

  const record = await createGivingRecord({
    userId: input.userId,
    donorName: input.donorName,
    donorEmail: input.donorEmail,
    amount: input.amount,
    currency: input.currency.toUpperCase(),
    fund: input.fund,
    method: "stripe",
    givenOn: giftDateIso(),
    campusId: input.campusId,
    notes: input.notes,
    source: "stripe",
    stripeSessionId: input.stripeSessionId,
    stripeInvoiceId: input.stripeInvoiceId,
    recordedBy: input.userId ?? "stripe",
    recordedByName: "Online giving",
  });

  void sendGivingThankYou(record)
    .then(async (result) => {
      if (result.sent) {
        await markThankYouSent(record.id);
      }
    })
    .catch((error) => {
      console.error("Stripe giving thank-you failed:", error);
    });

  return record;
}

export async function recordGiftFromCheckoutSession(session: Stripe.Checkout.Session) {
  await linkStripeCustomerFromCheckoutSession(session);

  if (session.mode !== "payment") {
    return null;
  }

  if (session.payment_status !== "paid") {
    return null;
  }

  const totalPaid = amountInDollars(session.amount_total);
  if (totalPaid <= 0) return null;

  const metadata = session.metadata ?? {};
  const giftAmount = giftAmountFromMetadata(metadata, totalPaid);
  const fund = parseFund(metadata.fund);
  const donorEmail = normalizeGivingEmail(
    session.customer_details?.email ?? session.customer_email ?? undefined,
  );
  const stripeName =
    session.customer_details?.name?.trim() ||
    session.metadata?.donorName?.trim() ||
    donorEmail?.split("@")[0] ||
    "Online donor";

  const identity = await resolveDonorIdentityFromCheckoutSession(session);
  const userId = identity.userId;
  const campusId = identity.campusId;

  const donorName = await donorNameForGivingRecord({
    userId,
    donorEmail,
    fallbackName: stripeName,
  });

  const baseNote =
    metadata.frequency && metadata.frequency !== "once"
      ? `${recurringGiftNote(metadata.frequency)} (first payment via checkout)`
      : "One-time online gift";

  return recordStripeGift({
    amount: giftAmount,
    currency: session.currency ?? "usd",
    fund,
    donorName,
    donorEmail,
    userId,
    campusId,
    notes: giftNotesFromMetadata(metadata, baseNote),
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

  const totalPaid = amountInDollars(invoice.amount_paid);
  if (totalPaid <= 0) return null;

  const metadata = { ...(invoice.metadata ?? {}), ...extraMetadata };
  const giftAmount = giftAmountFromMetadata(metadata, totalPaid);
  const fund = parseFund(metadata.fund);
  const donorEmail = normalizeGivingEmail(invoice.customer_email ?? undefined);
  const stripeName =
    invoice.customer_name?.trim() ||
    metadata.donorName?.trim() ||
    donorEmail?.split("@")[0] ||
    "Online donor";

  const identity = await resolveDonorIdentityFromInvoice(invoice, extraMetadata);
  const userId = identity.userId;
  const donorName = await donorNameForGivingRecord({
    userId,
    donorEmail,
    fallbackName: stripeName,
  });

  const frequencyNote =
    invoice.billing_reason === "subscription_cycle"
      ? recurringGiftNote(metadata.frequency)
      : `${recurringGiftNote(metadata.frequency)} (initial)`;
  const startNote = metadata.recurringStartDate
    ? ` Scheduled start ${metadata.recurringStartDate}.`
    : "";

  return recordStripeGift({
    amount: giftAmount,
    currency: invoice.currency ?? "usd",
    fund,
    donorName,
    donorEmail,
    userId,
    campusId: identity.campusId ?? metadataValue(metadata.campusId),
    notes: giftNotesFromMetadata(metadata, `${frequencyNote}${startNote}`),
    stripeInvoiceId: invoice.id,
  });
}

export async function getCheckoutSessionForUser(
  sessionId: string,
  user?: { id: string; email: string },
) {
  if (!isStripeGivingConfigured()) return null;

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (user) {
    if (session.client_reference_id && session.client_reference_id !== user.id) {
      return null;
    }
    if (!session.client_reference_id) {
      const sessionEmail = normalizeGivingEmail(
        session.customer_details?.email ?? session.customer_email ?? undefined,
      );
      const userEmail = normalizeGivingEmail(user.email);
      if (sessionEmail && userEmail && sessionEmail !== userEmail) {
        return null;
      }
    }
  }

  return session;
}

export async function confirmCheckoutGiftForMember(
  sessionId: string,
  user: PublicMember,
) {
  const session = await getCheckoutSessionForUser(sessionId, {
    id: user.id,
    email: user.email,
  });
  if (!session) {
    return { ok: false as const, error: "forbidden" as const };
  }

  if (session.mode !== "payment") {
    return { ok: false as const, error: "not_payment" as const };
  }

  if (session.payment_status !== "paid") {
    return {
      ok: false as const,
      error: "unpaid" as const,
      paymentStatus: session.payment_status,
    };
  }

  const record = await recordGiftFromCheckoutSession(session);
  return { ok: true as const, record };
}
