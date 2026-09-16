import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { endCommunityStoryLive, startCommunityStoryLive } from "@/lib/community-live-server";
import { notifyStoryPosted } from "@/lib/community-status-viewer-server";
import { attachReactionsToStatuses } from "@/lib/community-status-reaction-server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { getPublicDisplayName } from "@/lib/member-display-name";
import {
  createLiveKitRoomToken,
  getLiveKitPublicUrl,
  isLiveKitConfigured,
} from "@/lib/livekit-server";

export async function POST(request: Request) {
  if (!isLiveKitConfigured()) {
    return NextResponse.json(
      { error: "Live streaming is not configured on this server." },
      { status: 503 },
    );
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return NextResponse.json({ error: "Sign in to go live." }, { status: 401 });
  }

  let caption = "";
  try {
    const body = (await request.json()) as { caption?: string };
    caption = String(body.caption ?? "").trim();
  } catch {
    caption = "";
  }

  try {
    const authorName = getPublicDisplayName(user);
    const { status, roomName } = await startCommunityStoryLive({
      authorId: user.id,
      authorName,
      caption,
    });

    const hostToken = await createLiveKitRoomToken({
      roomName,
      identity: user.id,
      name: authorName,
      role: "host",
    });

    const [enriched] = await attachReactionsToStatuses([status], user.id);

    void notifyStoryPosted({
      authorId: user.id,
      authorName,
      caption: caption || "Live now",
    });

    return NextResponse.json({
      status: enriched ?? status,
      roomName,
      token: hostToken,
      serverUrl: getLiveKitPublicUrl(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not start live.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  let statusId = "";
  try {
    const body = (await request.json()) as { statusId?: string };
    statusId = String(body.statusId ?? "").trim();
  } catch {
    statusId = "";
  }

  if (!statusId) {
    return NextResponse.json({ error: "Missing live story id." }, { status: 400 });
  }

  const result = await endCommunityStoryLive({ statusId, authorId: user.id });
  if (result === "forbidden") {
    return NextResponse.json({ error: "You can only end your own live." }, { status: 403 });
  }
  if (!result) {
    return NextResponse.json({ error: "Live not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
