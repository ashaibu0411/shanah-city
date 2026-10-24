import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import {
  savePremaritalSessionPrivateNotes,
  setPremaritalProgramPaused,
  updatePremaritalSessionChecklist,
  updatePremaritalSessionStatus,
} from "@/lib/marriage-premarital-program-server";
import type { MarriagePremaritalProgramSessionStatus } from "@/lib/marriage-counseling-types";
import {
  counselorRouteErrorBody,
  counselorRouteErrorStatus,
} from "@/lib/marriage-counselor-api-security";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const body = await request.json();
  const action = String(body.action ?? "");
  const journeyId = String(body.journeyId ?? "");
  const sessionKey = String(body.sessionKey ?? "");

  try {
    if (action === "update_session_status") {
      const status = String(body.status ?? "") as MarriagePremaritalProgramSessionStatus;
      if (!["not_started", "in_progress", "completed"].includes(status)) {
        throw new Error("Invalid status.");
      }
      const record = await updatePremaritalSessionStatus(user, journeyId, sessionKey, status);
      return NextResponse.json({ ok: true, record });
    }
    if (action === "save_session_notes") {
      const record = await savePremaritalSessionPrivateNotes(
        user,
        journeyId,
        sessionKey,
        String(body.privateNotes ?? ""),
      );
      return NextResponse.json({ ok: true, record });
    }
    if (action === "update_checklist") {
      const record = await updatePremaritalSessionChecklist(
        user,
        journeyId,
        sessionKey,
        Number(body.checklistIndex),
        Boolean(body.completed),
      );
      return NextResponse.json({ ok: true, record });
    }
    if (action === "set_paused") {
      const meta = await setPremaritalProgramPaused(user, journeyId, Boolean(body.paused));
      return NextResponse.json({ ok: true, meta });
    }
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed.";
    return NextResponse.json(counselorRouteErrorBody(message), {
      status: counselorRouteErrorStatus(message),
    });
  }
}
