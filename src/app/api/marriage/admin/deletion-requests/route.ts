import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import {
  archiveJourneyAfterDeletionReview,
  dismissJourneyDeletionRequest,
  listPendingJourneyDeletionRequests,
} from "@/lib/marriage-deletion-request-admin";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  try {
    const rows = await listPendingJourneyDeletionRequests(user);
    return NextResponse.json({ rows });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Access denied." },
      { status: 403 },
    );
  }
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const body = await request.json();
  const action = String(body.action ?? "");
  const journeyId = String(body.journeyId ?? "");

  if (!journeyId) {
    return NextResponse.json({ error: "journeyId required." }, { status: 400 });
  }

  try {
    if (action === "archive") {
      await archiveJourneyAfterDeletionReview(user, journeyId);
      return NextResponse.json({ ok: true });
    }
    if (action === "dismiss") {
      await dismissJourneyDeletionRequest(user, journeyId);
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
