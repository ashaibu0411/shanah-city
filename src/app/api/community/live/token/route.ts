import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
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
  const sessionToken = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(sessionToken);

  if (!user) {
    return NextResponse.json({ error: "Sign in to watch live." }, { status: 401 });
  }

  let statusId = "";
  try {
    const body = (await request.json()) as { statusId?: string };
    statusId = String(body.statusId ?? "").trim();
  } catch {
    statusId = "";
  }

  if (!statusId) {
    return NextResponse.json({ error: "Missing status id." }, { status: 400 });
  }

  const status = await prisma.communityStatus.findUnique({ where: { id: statusId } });
  if (!status || status.mediaType !== "live" || status.expiresAt <= new Date()) {
    return NextResponse.json({ error: "This live has ended." }, { status: 404 });
  }

  try {
    const viewerToken = await createLiveKitRoomToken({
      roomName: status.mediaUrl,
      identity: user.id,
      name: getPublicDisplayName(user),
      role: "viewer",
    });

    return NextResponse.json({
      token: viewerToken,
      serverUrl: getLiveKitPublicUrl(),
      roomName: status.mediaUrl,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not join live.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
