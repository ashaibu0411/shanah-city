import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { createRecurringGivingPortalSession } from "@/lib/giving-billing-server";
import {
  enforceRateLimit,
  getClientIp,
  rateLimitResponse,
} from "@/lib/rate-limit-server";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return NextResponse.json({ error: "Sign in to manage recurring giving." }, { status: 401 });
  }

  const ip = getClientIp(request);
  const rateLimit = await enforceRateLimit(`giving:portal:${user.id}:${ip}`, {
    limit: 10,
    windowSeconds: 15 * 60,
  });
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.retryAfterSeconds);
  }

  try {
    const url = await createRecurringGivingPortalSession({
      userId: user.id,
      email: user.email,
    });
    return NextResponse.json({ url });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not open giving management." },
      { status: 400 },
    );
  }
}
