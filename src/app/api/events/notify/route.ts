import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import {
  canManageChurchEvents,
  canManageGroupEvents,
} from "@/lib/group-permissions-server";
import { getEventById } from "@/lib/event-server";
import { notifyChurchEvent } from "@/lib/push-server";

async function assertCanManageEvent(
  user: Awaited<ReturnType<typeof getUserFromSession>>,
  groupId?: string | null,
) {
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  if (groupId) {
    if (!(await canManageGroupEvents(user, groupId))) {
      return NextResponse.json(
        { error: "Group admin or Admin Group access required." },
        { status: 403 },
      );
    }
    return null;
  }

  if (!(await canManageChurchEvents(user))) {
    return NextResponse.json({ error: "Admin Group access required." }, { status: 403 });
  }

  return null;
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  const body = await request.json();
  const id = String(body.id ?? "").trim();
  if (!id) {
    return NextResponse.json({ error: "Event id is required." }, { status: 400 });
  }

  const event = await getEventById(id);
  if (!event) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  const denied = await assertCanManageEvent(user, event.groupId ?? null);
  if (denied) return denied;

  const result = await notifyChurchEvent({
    title: event.title,
    authorId: user!.id,
    eventId: event.id,
  });

  return NextResponse.json({
    ok: true,
    sent: result.sent,
    skipped: result.skipped,
  });
}
