import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import {
  acceptJourneyInvite,
  revokeJourneyInvite,
  startJourneyWithInvite,
} from "@/lib/marriage-counseling-invite-server";
import type { MarriageProgramType } from "@/lib/marriage-counseling-types";

async function readJsonBody(request: Request): Promise<
  | { ok: true; body: Record<string, unknown> }
  | { ok: false; response: NextResponse }
> {
  const raw = await request.text();
  if (!raw.trim()) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Request body required." }, { status: 400 }),
    };
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {
        ok: false,
        response: NextResponse.json({ error: "JSON body must be an object." }, { status: 400 }),
      };
    }
    return { ok: true, body: parsed as Record<string, unknown> };
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }),
    };
  }
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const parsed = await readJsonBody(request);
  if (!parsed.ok) return parsed.response;
  const body = parsed.body;
  const action = String(body.action ?? "");

  try {
    if (action === "create") {
      const programType = String(body.programType ?? "premarital") as MarriageProgramType;
      const result = await startJourneyWithInvite(user, programType, {
        intendedEmail: body.intendedEmail ? String(body.intendedEmail) : undefined,
      });
      return NextResponse.json({ ok: true, ...result });
    }
    if (action === "accept") {
      const journey = await acceptJourneyInvite(user, String(body.code ?? ""));
      return NextResponse.json({ ok: true, journey });
    }
    if (action === "revoke") {
      await revokeJourneyInvite(user, String(body.journeyId ?? ""));
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Request failed." },
      { status: 400 },
    );
  }
}
