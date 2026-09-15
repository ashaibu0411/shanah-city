import type Stripe from "stripe";
import { getUserByEmail } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import {
  fundLabel,
  normalizeGivingEmail,
  type GivingCheckoutFrequency,
} from "@/lib/giving-types";
import { getZonedDateParts } from "@/lib/denver-time";
import { formatGivingDateKeyForDisplay } from "@/lib/giving-recurring-start";
import {
  getAppBaseUrl,
  getStripe,
  isStripeGivingConfigured,
} from "@/lib/stripe-server";
import { useDatabase } from "@/lib/use-database";

export type RecurringGivingSubscriptionView = {
  id: string;
  status: string;
  statusLabel: string;
  amount: number;
  currency: string;
  frequency: GivingCheckoutFrequency;
  frequencyLabel: string;
  fund: string;
  fundLabel: string;
  nextChargeLabel: string | null;
  cancelAtPeriodEnd: boolean;
};

export function isRecurringGivingManageConfigured() {
  return isStripeGivingConfigured() && useDatabase();
}

function frequencyLabel(frequency: string) {
  switch (frequency) {
    case "weekly":
      return "Weekly";
    case "biweekly":
      return "Every 2 weeks";
    case "monthly":
      return "Monthly";
    default:
      return "Recurring";
  }
}

function statusLabel(status: Stripe.Subscription.Status) {
  switch (status) {
    case "active":
      return "Active";
    case "trialing":
      return "Scheduled";
    case "past_due":
      return "Past due";
    case "canceled":
      return "Canceled";
    case "paused":
      return "Paused";
    default:
      return status.replace(/_/g, " ");
  }
}

function subscriptionAmount(subscription: Stripe.Subscription) {
  const total = subscription.items.data.reduce(
    (sum, item) => sum + (item.price?.unit_amount ?? 0) * (item.quantity ?? 1),
    0,
  );
  return total > 0 ? Math.round(total) / 100 : 0;
}

function dateKeyFromUnix(seconds: number) {
  return getZonedDateParts(new Date(seconds * 1000)).dateKey;
}

function subscriptionPeriodEnd(subscription: Stripe.Subscription) {
  const raw = subscription as Stripe.Subscription & { current_period_end?: number | null };
  return raw.current_period_end ?? null;
}

function mapSubscription(subscription: Stripe.Subscription): RecurringGivingSubscriptionView {
  const metadata = subscription.metadata ?? {};
  const frequency = (metadata.frequency as GivingCheckoutFrequency) || "monthly";
  const fund = String(metadata.fund ?? "offering");
  const recurringStart = metadata.recurringStartDate?.trim();

  let nextChargeLabel: string | null = null;
  if (subscription.status === "trialing" && subscription.trial_end) {
    nextChargeLabel = `First charge ${formatGivingDateKeyForDisplay(
      dateKeyFromUnix(subscription.trial_end),
    )}`;
  } else {
    const periodEnd = subscriptionPeriodEnd(subscription);
    if (periodEnd) {
      nextChargeLabel = `Next charge ${formatGivingDateKeyForDisplay(dateKeyFromUnix(periodEnd))}`;
    } else if (recurringStart) {
      nextChargeLabel = `Starts ${formatGivingDateKeyForDisplay(recurringStart)}`;
    }
  }

  return {
    id: subscription.id,
    status: subscription.status,
    statusLabel: statusLabel(subscription.status),
    amount: subscriptionAmount(subscription),
    currency: (subscription.currency ?? "usd").toUpperCase(),
    frequency,
    frequencyLabel: frequencyLabel(frequency),
    fund,
    fundLabel: fundLabel(fund),
    nextChargeLabel,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  };
}

export async function saveStripeCustomerForUser(userId: string, stripeCustomerId: string) {
  if (!useDatabase()) return;
  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId, updatedAt: new Date() },
  });
}

export async function linkStripeCustomerFromCheckoutSession(session: Stripe.Checkout.Session) {
  if (!useDatabase()) return;

  const customerId =
    typeof session.customer === "string" ? session.customer : session.customer?.id;
  if (!customerId) return;

  const userId = session.client_reference_id?.trim() || session.metadata?.userId?.trim();
  if (userId) {
    try {
      await saveStripeCustomerForUser(userId, customerId);
    } catch {
      // Member may have been deleted; still allow guest checkout.
    }
    return;
  }

  const email = normalizeGivingEmail(
    session.customer_details?.email ?? session.customer_email ?? undefined,
  );
  if (!email) return;

  const user = await getUserByEmail(email);
  if (user) {
    await saveStripeCustomerForUser(user.id, customerId);
  }
}

async function resolveStripeCustomerId(userId: string, email: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true },
  });

  if (user?.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  const stripe = getStripe();
  const normalizedEmail = normalizeGivingEmail(email);
  if (!normalizedEmail) {
    return null;
  }

  const customers = await stripe.customers.list({ email: normalizedEmail, limit: 10 });
  if (customers.data.length === 0) {
    return null;
  }

  for (const customer of customers.data) {
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: "all",
      limit: 1,
    });
    if (subscriptions.data.length > 0) {
      await saveStripeCustomerForUser(userId, customer.id);
      return customer.id;
    }
  }

  await saveStripeCustomerForUser(userId, customers.data[0].id);
  return customers.data[0].id;
}

export async function listRecurringGivingForUser(input: { userId: string; email: string }) {
  if (!isRecurringGivingManageConfigured()) {
    return { configured: false, subscriptions: [] as RecurringGivingSubscriptionView[] };
  }

  const customerId = await resolveStripeCustomerId(input.userId, input.email);
  if (!customerId) {
    return { configured: true, subscriptions: [] as RecurringGivingSubscriptionView[] };
  }

  const stripe = getStripe();
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: "all",
    limit: 20,
  });

  const active = subscriptions.data.filter((subscription) =>
    ["active", "trialing", "past_due", "paused"].includes(subscription.status),
  );

  return {
    configured: true,
    subscriptions: active.map(mapSubscription),
  };
}

export async function createRecurringGivingPortalSession(input: {
  userId: string;
  email: string;
}) {
  if (!isRecurringGivingManageConfigured()) {
    throw new Error("Recurring giving management is not available yet.");
  }

  const customerId = await resolveStripeCustomerId(input.userId, input.email);
  if (!customerId) {
    throw new Error(
      "We could not find a Stripe giving profile for your account. Use the same email you used when you set up recurring giving, or contact the finance team.",
    );
  }

  const stripe = getStripe();
  const baseUrl = getAppBaseUrl();
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${baseUrl}/profile`,
  });

  if (!session.url) {
    throw new Error("Could not open the giving management page.");
  }

  return session.url;
}
