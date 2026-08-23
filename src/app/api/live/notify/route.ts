import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { canPublishMediaClips } from "@/lib/group-permissions-server";
import { notifyLiveStreamNow } from "@/lib/push-server";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user || !(await canPublishMediaClips(user))) {
    return NextResponse.json(
      { error: "Only media team members or Admin Group can send live notifications." },
      { status: 403 },
    );
  }

  const body = await request.json();
  const title = String(body.title ?? "Shanah City is live").trim();
  const message = String(body.body ?? body.message ?? "").trim();

  if (!title) {
    return NextResponse.json({ error: "A notification title is required." }, { status: 400 });
  }

  const result = await notifyLiveStreamNow({
    authorId: user.id,
    title,
    body: message || undefined,
  });

  if (!result.configured) {
    return NextResponse.json(
      { error: "Push notifications are not configured on the server yet." },
      { status: 503 },
    );
  }

  return NextResponse.json({
    ok: true,
    sent: result.sent,
    skipped: result.skipped,
    errors: result.errors ?? [],
  });
}
