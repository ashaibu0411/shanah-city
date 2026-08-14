import { NextResponse } from "next/server";
import { completePasswordReset } from "@/lib/password-reset-server";
import {
  enforceRateLimit,
  getClientIp,
  rateLimitResponse,
} from "@/lib/rate-limit-server";

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const rateLimit = await enforceRateLimit(`auth:reset:${ip}`, {
      limit: 10,
      windowSeconds: 60 * 60,
    });
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.retryAfterSeconds);
    }

    const body = await request.json();
    await completePasswordReset(String(body.token ?? ""), String(body.password ?? ""));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not reset password." },
      { status: 400 },
    );
  }
}
