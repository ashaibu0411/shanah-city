import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { getPublicDisplayName } from "@/lib/member-display-name";
import {
  createLiveJoinRequest,
  getLiveSessionMeta,
  listPendingLiveJoinRequests,
} from "@/lib/community-live-social-server";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const statusId = new URL(request.url).searchParams.get("statusId")?.trim() ?? "";
  if (!statusId) {
    return NextResponse.json({ error: "Missing status id." }, { status: 400 });
  }

  try {
    const meta = await getLiveSessionMeta(statusId, user.id);
    const pending =
      meta.isHost ? await listPendingLiveJoinRequests(statusId, user.id) : [];
    return NextResponse.json({
      ...meta,
      pendingRequests: pending.map((entry: { userId: string; userName: string; createdAt: Date }) => ({
        userId: entry.userId,
        userName: entry.userName,
        createdAt: entry.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Live unavailable.";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) {
    return NextResponse.json({ error: "Sign in to request joining live." }, { status: 401 });
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

  try {
    await createLiveJoinRequest({
      statusId,
      userId: user.id,
      userName: getPublicDisplayName(user),
    });
    return NextResponse.json({ ok: true, state: "pending" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not send request.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
