/**
 * Read-only probe for a single PaymentIntent + Checkout Session (redacted stdout).
 * Usage: PAYMENT_INTENT_ID=pi_... npx tsx scripts/giving-incident-pi-probe.ts
 */
import Stripe from "stripe";
import { config } from "dotenv";
import { prisma } from "../src/lib/db";
import { redactEmailForLogs, redactStripeId, redactUserIdForLogs } from "../src/lib/giving-privacy-redact";
import { isShanahGivingCheckoutSession } from "../src/lib/giving-stripe-eligibility";
import { resolveStripeCustomerId } from "../src/lib/giving-stripe-invoice";
import { getGivingRecordByStripeSessionId } from "../src/lib/giving-server";

config({ path: ".env.local" });

const piId = process.env.PAYMENT_INTENT_ID?.trim();
const memberUserId = process.env.MEMBER_USER_ID?.trim() ?? "user-1786578251521";

if (!piId) {
  console.error("PAYMENT_INTENT_ID required");
  process.exit(1);
}

const stripeKey = process.env.STRIPE_SECRET_KEY?.trim();
if (!stripeKey) {
  console.error("STRIPE_SECRET_KEY required");
  process.exit(1);
}

const stripe = new Stripe(stripeKey);

function metaSummary(md: Stripe.Metadata | null | undefined) {
  if (!md || Object.keys(md).length === 0) return null;
  return {
    fund: md.fund ?? null,
    userId: md.userId ? redactUserIdForLogs(md.userId) : null,
    giftAmount: md.giftAmount ?? null,
    feeAmount: md.feeAmount ?? null,
    coverFees: md.coverFees ?? null,
    keys: Object.keys(md),
  };
}

async function listCheckoutSessionsForPaymentIntent(paymentIntentId: string) {
  // Stripe has no direct filter; search recent completed sessions (bounded).
  const createdGte = Math.floor(Date.now() / 1000) - 90 * 86_400;
  const matches: Stripe.Checkout.Session[] = [];
  let startingAfter: string | undefined;
  for (let page = 0; page < 10 && matches.length < 5; page++) {
    const list = await stripe.checkout.sessions.list({
      limit: 100,
      created: { gte: createdGte },
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });
    for (const s of list.data) {
      const ref = s.payment_intent;
      const id = typeof ref === "string" ? ref : ref?.id;
      if (id === paymentIntentId) matches.push(s);
    }
    if (!list.has_more) break;
    startingAfter = list.data[list.data.length - 1]?.id;
  }
  return matches;
}

async function main() {
  const paymentIntentId = piId as string;
  let member: { id: string; email: string; stripeCustomerId: string | null; name: string } | null =
    null;
  try {
    member = await prisma.user.findUnique({
      where: { id: memberUserId },
      select: { id: true, email: true, stripeCustomerId: true, name: true },
    });
  } catch {
    member = null;
  }

  const pi = await stripe.paymentIntents.retrieve(paymentIntentId, {
    expand: ["latest_charge", "customer"],
  });

  const charge =
    typeof pi.latest_charge === "object" && pi.latest_charge ? pi.latest_charge : null;
  const customerId = resolveStripeCustomerId(pi.customer);

  const sessionsByPi = await listCheckoutSessionsForPaymentIntent(pi.id);
  let sessionsByCustomer: Stripe.Checkout.Session[] = [];
  if (customerId) {
    const list = await stripe.checkout.sessions.list({
      customer: customerId,
      limit: 100,
      created: { gte: Math.floor((Date.now() - 90 * 86_400_000) / 1000) },
    });
    sessionsByCustomer = list.data.filter((s) => {
      const ref = s.payment_intent;
      const id = typeof ref === "string" ? ref : ref?.id;
      return id === pi.id;
    });
  }

  const sessionIds = new Set<string>();
  const sessions = [...sessionsByPi, ...sessionsByCustomer].filter((s) => {
    if (sessionIds.has(s.id)) return false;
    sessionIds.add(s.id);
    return true;
  });

  const eventTypeFilter = new Set([
    "checkout.session.completed",
    "checkout.session.async_payment_succeeded",
    "checkout.session.async_payment_failed",
    "payment_intent.succeeded",
    "payment_intent.payment_failed",
    "charge.succeeded",
  ]);
  const events = await stripe.events.list({ limit: 50, created: { gte: (pi.created ?? 0) - 86_400 } });
  const eventsForPi = events.data.filter((e) => {
    if (!eventTypeFilter.has(e.type)) return false;
    const obj = e.data.object as { id?: string; payment_intent?: string };
    return obj.id === pi.id || obj.payment_intent === pi.id;
  });

  const sessionReports = [];
  for (const session of sessions) {
    const full = await stripe.checkout.sessions.retrieve(session.id, {
      expand: ["line_items", "payment_intent"],
    });
    let db: Awaited<ReturnType<typeof getGivingRecordByStripeSessionId>> = null;
    try {
      db = await getGivingRecordByStripeSessionId(full.id);
    } catch {
      db = null;
    }
    sessionReports.push({
      sessionId: redactStripeId(full.id),
      mode: full.mode,
      status: full.status,
      paymentStatus: full.payment_status,
      amountTotalUsd: (full.amount_total ?? 0) / 100,
      created: full.created ? new Date(full.created * 1000).toISOString() : null,
      customer: redactStripeId(resolveStripeCustomerId(full.customer)),
      clientReferenceId: full.client_reference_id
        ? redactUserIdForLogs(full.client_reference_id)
        : null,
      customerEmail: redactEmailForLogs(
        full.customer_details?.email ?? full.customer_email ?? undefined,
      ),
      customerName: full.customer_details?.name ? "[present]" : null,
      metadata: metaSummary(full.metadata),
      isShanahGiving: isShanahGivingCheckoutSession(full),
      lineItemCount: full.line_items?.data?.length ?? null,
      dbRecord: db
        ? { id: db.id, userId: redactUserIdForLogs(db.userId ?? undefined), amount: db.amount, givenOn: db.givenOn }
        : null,
    });
  }

  const memberMatch = member
    ? {
        userId: redactUserIdForLogs(member.id),
        email: redactEmailForLogs(member.email),
        linkedCustomer: redactStripeId(member.stripeCustomerId),
        customerMatchesLinked: Boolean(
          member.stripeCustomerId && customerId && member.stripeCustomerId === customerId,
        ),
      }
    : null;

  console.log(
    JSON.stringify(
      {
        paymentIntent: {
          id: redactStripeId(pi.id),
          status: pi.status,
          amountUsd: (pi.amount ?? 0) / 100,
          created: pi.created ? new Date(pi.created * 1000).toISOString() : null,
          metadata: metaSummary(pi.metadata),
          customer: redactStripeId(customerId),
          paymentMethodTypes: pi.payment_method_types,
        },
        charge: charge
          ? {
              id: redactStripeId(charge.id),
              status: charge.status,
              created: charge.created ? new Date(charge.created * 1000).toISOString() : null,
              paymentMethodType: charge.payment_method_details?.type ?? null,
              last4:
                charge.payment_method_details?.us_bank_account?.last4 ??
                charge.payment_method_details?.card?.last4 ??
                null,
            }
          : null,
        member: memberMatch,
        checkoutSessions: sessionReports,
        webhookEventsForPi: eventsForPi.map((e) => ({
          id: redactStripeId(e.id),
          type: e.type,
          created: new Date(e.created * 1000).toISOString(),
          livemode: e.livemode,
        })),
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : "probe_failed");
  process.exit(1);
});
