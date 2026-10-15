import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import {
  getCounselorJourneyDetail,
  saveCounselorPrivateNote,
} from "@/lib/marriage-counseling-counselor-server";

type Params = { params: Promise<{ journeyId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { journeyId } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  try {
    const detail = await getCounselorJourneyDetail(user, journeyId);
    return NextResponse.json(detail);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Access denied." },
      { status: 403 },
    );
  }
}

export async function POST(request: Request, { params }: Params) {
  const { journeyId } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const body = await request.json();
  if (String(body.action ?? "") !== "save_note") {
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }
  const noteBody = String(body.body ?? "").trim();
  if (!noteBody) {
    return NextResponse.json({ error: "Note cannot be empty." }, { status: 400 });
  }

  try {
    const note = await saveCounselorPrivateNote(user, journeyId, noteBody);
    return NextResponse.json({ ok: true, note });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Save failed." },
      { status: 403 },
    );
  }
}
