import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import {
  adminArchiveJourney,
  exportJourneyData,
  requestJourneyDeletion,
  revokeCounselorAccess,
} from "@/lib/marriage-counseling-privacy-server";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const journeyId = new URL(request.url).searchParams.get("journeyId")?.trim();
  if (!journeyId) return NextResponse.json({ error: "journeyId required." }, { status: 400 });

  try {
    const data = await exportJourneyData(user, journeyId);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Export denied." },
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

  try {
    if (action === "request_deletion") {
      return NextResponse.json(await requestJourneyDeletion(user, journeyId));
    }
    if (action === "revoke_counselor") {
      return NextResponse.json(await revokeCounselorAccess(user, journeyId));
    }
    if (action === "admin_archive") {
      return NextResponse.json(await adminArchiveJourney(user, journeyId));
    }
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Request failed." },
      { status: 400 },
    );
  }
}
