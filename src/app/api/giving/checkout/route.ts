import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  createGivingCheckoutSession,
  isStripeGivingConfigured,
} from "@/lib/giving-checkout-server";
import {
  GIVING_CHECKOUT_FUNDS,
  GIVING_CHECKOUT_FREQUENCIES,
  type GivingCheckoutFrequency,
  type GivingFund,
} from "@/lib/giving-types";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import {
  enforceRateLimit,
  getClientIp,
  rateLimitResponse,
} from "@/lib/rate-limit-server";

export async function GET() {
  return NextResponse.json({
    enabled: isStripeGivingConfigured(),
    funds: GIVING_CHECKOUT_FUNDS,
  });
}

export async function POST(request: Request) {
  if (!isStripeGivingConfigured()) {
    return NextResponse.json(
      { error: "Online giving is not configured yet. Use another option below." },
      { status: 503 },
    );
  }

  const ip = getClientIp(request);
  const rateLimit = await enforceRateLimit(`giving:checkout:${ip}`, {
    limit: 20,
    windowSeconds: 15 * 60,
  });
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.retryAfterSeconds);
  }

  const body = await request.json();
  const amount = Number(body.amount);
  const fund = String(body.fund ?? "offering") as GivingFund;
  const frequency = String(body.frequency ?? "once") as GivingCheckoutFrequency;

  if (!GIVING_CHECKOUT_FUNDS.some((option) => option.value === fund)) {
    return NextResponse.json({ error: "Choose a valid fund." }, { status: 400 });
  }

  if (!GIVING_CHECKOUT_FREQUENCIES.some((option) => option.value === frequency)) {
    return NextResponse.json({ error: "Choose a valid giving frequency." }, { status: 400 });
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  try {
    const session = await createGivingCheckoutSession({
      amount,
      fund,
      frequency,
      user,
    });

    if (!session.url) {
      return NextResponse.json({ error: "Could not start checkout." }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not start checkout." },
      { status: 400 },
    );
  }
}
