import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import {
  getParticipantHomeworkWorkspace,
  saveParticipantHomeworkDraft,
} from "@/lib/marriage-homework-server";

type Params = { params: Promise<{ homeworkId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const { homeworkId } = await params;
  try {
    const workspace = await getParticipantHomeworkWorkspace(user, homeworkId);
    return NextResponse.json(workspace, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed.";
    const status = message.includes("not available") ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const { homeworkId } = await params;
  const body = await request.json();
  const patch =
    body.answers && typeof body.answers === "object"
      ? (body.answers as Record<string, string>)
      : {};
  try {
    const result = await saveParticipantHomeworkDraft(user, homeworkId, patch);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
