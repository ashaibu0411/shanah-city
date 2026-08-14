import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { canManageAsAdmin } from "@/lib/admin-access-server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import {
  approveJoinRequest,
  listPendingJoinRequests,
  listUserJoinRequests,
  rejectJoinRequest,
} from "@/lib/group-join-server";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const [pending, mine, isAdmin] = await Promise.all([
    listPendingJoinRequests(user.id),
    listUserJoinRequests(user.id),
    canManageAsAdmin(user),
  ]);

  return NextResponse.json({
    pending,
    mine,
    isAdmin,
    canReview: isAdmin || pending.length > 0,
  });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const body = await request.json();
  const action = String(body.action ?? "");
  const requestId = String(body.requestId ?? "");

  if (!requestId) {
    return NextResponse.json({ error: "Request id is required." }, { status: 400 });
  }

  try {
    if (action === "approve") {
      const updated = await approveJoinRequest(requestId, user.id);
      return NextResponse.json({ request: updated });
    }

    if (action === "reject") {
      const updated = await rejectJoinRequest(requestId, user.id);
      return NextResponse.json({ request: updated });
    }

    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update request." },
      { status: 400 },
    );
  }
}
