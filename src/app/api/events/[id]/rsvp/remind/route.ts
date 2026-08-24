import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { canManageEventRsvpSettings } from "@/lib/event-rsvp-access-server";
import {
  canSendRsvpReminder,
  sendEventRsvpNotification,
} from "@/lib/event-rsvp-server";
import { getEventById } from "@/lib/event-server";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const event = await getEventById(id);
  if (!event) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  if (!(await canManageEventRsvpSettings(user, event))) {
    return NextResponse.json(
      { error: "Only event organizers can send RSVP reminders." },
      { status: 403 },
    );
  }

  if (!event.rsvpEnabled) {
    return NextResponse.json({ error: "RSVP is not enabled for this event." }, { status: 400 });
  }

  if (!canSendRsvpReminder(event)) {
    return NextResponse.json(
      { error: "A reminder was sent recently. Try again in 24 hours." },
      { status: 429 },
    );
  }

  try {
    const result = await sendEventRsvpNotification(event, user.id, { isReminder: true });
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
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not send reminder." },
      { status: 400 },
    );
  }
}
