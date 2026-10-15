import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import {
  requestAssessmentRevision,
  resolveRevisionRequest,
} from "@/lib/marriage-counseling-counselor-server";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const body = await request.json();
  const action = String(body.action ?? "");

  try {
    if (action === "request") {
      const record = await requestAssessmentRevision(
        user,
        String(body.moduleId ?? ""),
        body.reason ? String(body.reason) : undefined,
      );
      return NextResponse.json({ ok: true, record });
    }
    if (action === "resolve") {
      const result = await resolveRevisionRequest(
        user,
        String(body.requestId ?? ""),
        body.decision === "denied" ? "denied" : "approved",
      );
      return NextResponse.json(result);
    }
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Request failed." },
      { status: 400 },
    );
  }
}
