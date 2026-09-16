import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { assertLiveStatusActive } from "@/lib/community-live-social-server";
import { setRemoteParticipantSourceMuted } from "@/lib/livekit-server";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  let statusId = "";
  let guestUserId = "";
  let source: "microphone" | "camera" = "microphone";
  let muted = true;
  try {
    const body = (await request.json()) as {
      statusId?: string;
      guestUserId?: string;
      source?: string;
      muted?: boolean;
    };
    statusId = String(body.statusId ?? "").trim();
    guestUserId = String(body.guestUserId ?? "").trim();
    if (body.source === "camera" || body.source === "microphone") {
      source = body.source;
    }
    muted = body.muted !== false;
  } catch {
    statusId = "";
  }

  if (!statusId || !guestUserId) {
    return NextResponse.json({ error: "Missing live or guest id." }, { status: 400 });
  }

  try {
    const status = await assertLiveStatusActive(statusId);
    if (status.authorId !== user.id) {
      return NextResponse.json({ error: "Only the host can mute guests." }, { status: 403 });
    }
    if (guestUserId === user.id) {
      return NextResponse.json({ error: "Use the on-screen controls for your own mic and video." }, { status: 400 });
    }

    await setRemoteParticipantSourceMuted({
      roomName: status.mediaUrl,
      identity: guestUserId,
      source,
      muted,
    });

    return NextResponse.json({ ok: true, muted });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not mute guest.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
