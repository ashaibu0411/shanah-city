import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { getPublicDisplayName } from "@/lib/member-display-name";
import {
  createLiveKitRoomToken,
  getLiveKitPublicUrl,
  isLiveKitConfigured,
} from "@/lib/livekit-server";
import {
  assertLiveStatusActive,
  isLiveCoHost,
} from "@/lib/community-live-social-server";

export async function POST(request: Request) {
  if (!isLiveKitConfigured()) {
    return NextResponse.json(
      { error: "Live streaming is not configured on this server." },
      { status: 503 },
    );
  }

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(sessionToken);

  if (!user) {
    return NextResponse.json({ error: "Sign in to join live." }, { status: 401 });
  }

  let statusId = "";
  let role: "viewer" | "cohost" | "host" = "viewer";
  try {
    const body = (await request.json()) as { statusId?: string; role?: string };
    statusId = String(body.statusId ?? "").trim();
    if (body.role === "cohost" || body.role === "host" || body.role === "viewer") {
      role = body.role;
    }
  } catch {
    statusId = "";
  }

  if (!statusId) {
    return NextResponse.json({ error: "Missing status id." }, { status: 400 });
  }

  try {
    const status = await assertLiveStatusActive(statusId);

    if (role === "host") {
      if (status.authorId !== user.id) {
        return NextResponse.json({ error: "Only the host can use a host token." }, { status: 403 });
      }
    } else if (role === "cohost") {
      const allowed = (await isLiveCoHost(statusId, user.id)) || status.authorId === user.id;
      if (!allowed) {
        return NextResponse.json(
          { error: "The host has not approved you as a co-host yet." },
          { status: 403 },
        );
      }
      role = "cohost";
    } else {
      role = "viewer";
    }

    const liveKitRole = role === "host" ? "host" : role === "cohost" ? "cohost" : "viewer";

    const roomToken = await createLiveKitRoomToken({
      roomName: status.mediaUrl,
      identity: user.id,
      name: getPublicDisplayName(user),
      role: liveKitRole,
    });

    return NextResponse.json({
      token: roomToken,
      serverUrl: getLiveKitPublicUrl(),
      roomName: status.mediaUrl,
      role: liveKitRole,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not join live.";
    const status = message.includes("ended") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
