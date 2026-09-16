import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import {
  approveLiveJoinRequest,
  leaveLiveCoHost,
  rejectLiveJoinRequest,
  removeLiveCoHost,
} from "@/lib/community-live-social-server";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  let statusId = "";
  let guestUserId = "";
  let action = "approve";
  try {
    const body = (await request.json()) as {
      statusId?: string;
      guestUserId?: string;
      action?: "approve" | "reject" | "remove" | "leave";
    };
    statusId = String(body.statusId ?? "").trim();
    guestUserId = String(body.guestUserId ?? "").trim();
    action = body.action ?? "approve";
  } catch {
    statusId = "";
  }

  if (!statusId) {
    return NextResponse.json({ error: "Missing live id." }, { status: 400 });
  }

  try {
    if (action === "leave") {
      await leaveLiveCoHost({ statusId, userId: user.id });
      return NextResponse.json({ ok: true, state: "left" });
    }
    if (!guestUserId) {
      return NextResponse.json({ error: "Missing guest id." }, { status: 400 });
    }
    if (action === "reject") {
      await rejectLiveJoinRequest({
        statusId,
        hostUserId: user.id,
        guestUserId,
      });
      return NextResponse.json({ ok: true, state: "rejected" });
    }
    if (action === "remove") {
      await removeLiveCoHost({
        statusId,
        hostUserId: user.id,
        guestUserId,
      });
      return NextResponse.json({ ok: true, state: "removed" });
    }
    await approveLiveJoinRequest({
      statusId,
      hostUserId: user.id,
      guestUserId,
    });
    return NextResponse.json({ ok: true, state: "approved" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update co-host.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
