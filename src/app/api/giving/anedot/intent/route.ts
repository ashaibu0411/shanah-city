import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { anedotPublicCheckoutAvailable, parseAnedotFundAllowlist } from "@/lib/anedot-env";
import { createAnedotGivingIntent } from "@/lib/anedot-intent-server";
import {
  GIVING_CHECKOUT_FUNDS,
  GIVING_CHECKOUT_FREQUENCIES,
  isRecurringCheckoutFrequency,
  type GivingCheckoutFrequency,
  type GivingFund,
} from "@/lib/giving-types";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import {
  enforceRateLimit,
  getClientIp,
  rateLimitResponse,
} from "@/lib/rate-limit-server";

export const runtime = "nodejs";

function invertFundMap(map: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [anedotKey, shanahFund] of Object.entries(map)) {
    if (!out[shanahFund]) out[shanahFund] = anedotKey;
  }
  return out;
}

export async function POST(request: Request) {
  if (!anedotPublicCheckoutAvailable()) {
    return NextResponse.json(
      { error: "Anedot giving is not available yet." },
      { status: 503 },
    );
  }

  const ip = getClientIp(request);
  const rateLimit = await enforceRateLimit(`giving:anedot:intent:${ip}`, {
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
  const coverFees = body.coverFees === true;

  if (!GIVING_CHECKOUT_FUNDS.some((option) => option.value === fund)) {
    return NextResponse.json({ error: "Choose a valid fund." }, { status: 400 });
  }
  if (!GIVING_CHECKOUT_FREQUENCIES.some((option) => option.value === frequency)) {
    return NextResponse.json({ error: "Choose a valid giving frequency." }, { status: 400 });
  }
  if (isRecurringCheckoutFrequency(frequency) && amount < 1) {
    return NextResponse.json({ error: "Enter a valid recurring amount." }, { status: 400 });
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  const fundMap = invertFundMap(parseAnedotFundAllowlist());
  const fundAnedotIdentifier = fundMap[fund];

  const result = await createAnedotGivingIntent({
    userId: user?.id,
    amount,
    fund,
    frequency,
    coverFees,
    fundAnedotIdentifier,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    redirectUrl: result.redirectUrl,
    intentId: result.intentId,
    expiresAt: result.expiresAt,
  });
}
