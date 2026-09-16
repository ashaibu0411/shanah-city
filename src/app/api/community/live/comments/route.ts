import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { getPublicDisplayName } from "@/lib/member-display-name";
import { addLiveComment, listLiveComments } from "@/lib/community-live-social-server";

export async function GET(request: Request) {
  const statusId = new URL(request.url).searchParams.get("statusId")?.trim() ?? "";
  const since = new URL(request.url).searchParams.get("since")?.trim() ?? undefined;

  if (!statusId) {
    return NextResponse.json({ error: "Missing status id." }, { status: 400 });
  }

  try {
    const comments = await listLiveComments(statusId, since);
    return NextResponse.json({ comments });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Live unavailable.";
    return NextResponse.json({ error: message, comments: [] }, { status: 404 });
  }
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) {
    return NextResponse.json({ error: "Sign in to comment." }, { status: 401 });
  }

  let statusId = "";
  let content = "";
  try {
    const body = (await request.json()) as { statusId?: string; content?: string };
    statusId = String(body.statusId ?? "").trim();
    content = String(body.content ?? "").trim();
  } catch {
    statusId = "";
  }

  if (!statusId) {
    return NextResponse.json({ error: "Missing status id." }, { status: 400 });
  }

  try {
    const comment = await addLiveComment({
      statusId,
      authorId: user.id,
      authorName: getPublicDisplayName(user),
      content,
    });
    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not post comment.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
