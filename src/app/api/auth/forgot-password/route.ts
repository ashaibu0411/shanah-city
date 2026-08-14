import { NextResponse } from "next/server";
import { requestPasswordReset } from "@/lib/password-reset-server";
import {
  enforceRateLimit,
  getClientIp,
  rateLimitResponse,
} from "@/lib/rate-limit-server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const ip = getClientIp(request);

    const ipLimit = await enforceRateLimit(`auth:forgot:${ip}`, {
      limit: 5,
      windowSeconds: 60 * 60,
    });
    if (!ipLimit.allowed) {
      return rateLimitResponse(ipLimit.retryAfterSeconds);
    }

    if (email) {
      const emailLimit = await enforceRateLimit(`auth:forgot:email:${email}`, {
        limit: 3,
        windowSeconds: 60 * 60,
      });
      if (!emailLimit.allowed) {
        return rateLimitResponse(emailLimit.retryAfterSeconds);
      }
    }

    const result = await requestPasswordReset(email);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not request reset." },
      { status: 400 },
    );
  }
}
