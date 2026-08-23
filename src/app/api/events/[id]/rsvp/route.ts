import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { getEventById } from "@/lib/event-server";
import { getEventRsvpViewById, submitEventRsvp } from "@/lib/event-rsvp-server";
import { isEventRsvpStatus } from "@/lib/event-rsvp-types";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  const event = await getEventById(id);
  if (!event) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  const rsvp = await getEventRsvpViewById(id, user);
  return NextResponse.json({ rsvp, eventId: id });
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return NextResponse.json({ error: "Sign in to RSVP." }, { status: 401 });
  }

  const body = await request.json();
  const status = String(body.status ?? "").trim();
  const note = body.note != null ? String(body.note).trim() : undefined;

  if (!isEventRsvpStatus(status)) {
    return NextResponse.json({ error: "Choose Going, Maybe, or Can't go." }, { status: 400 });
  }

  try {
    const result = await submitEventRsvp({
      eventId: id,
      viewer: user,
      status,
      note,
    });
    return NextResponse.json({ ok: true, rsvp: result.view });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not save RSVP." },
      { status: 400 },
    );
  }
}
