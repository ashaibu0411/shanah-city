import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import {
  markDiscussion,
  reopenDiscussion,
  saveDiscussionNote,
} from "@/lib/marriage-counseling-server";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  const body = await request.json();
  const moduleId = String(body.moduleId ?? "");
  const questionId = String(body.questionId ?? "");
  const action = body.action === "reopen" || body.action === "note" ? body.action : "mark";

  try {
    if (action === "reopen") {
      const result = await reopenDiscussion(user, moduleId, questionId);
      return NextResponse.json(result);
    }
    if (action === "note") {
      const mark = await saveDiscussionNote(user, moduleId, questionId, String(body.sharedNote ?? ""));
      return NextResponse.json({ ok: true, mark });
    }
    const mark = await markDiscussion(user, moduleId, questionId);
    return NextResponse.json({ ok: true, mark });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not save." },
      { status: 400 },
    );
  }
}
