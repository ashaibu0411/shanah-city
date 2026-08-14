import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  canManageDevotions,
  getUserFromSession,
  SESSION_COOKIE,
} from "@/lib/auth-server";
import {
  createEvent,
  deleteEvent,
  getEvents,
  updateEvent,
} from "@/lib/event-server";

function parseEventBody(body: Record<string, unknown>) {
  return {
    title: String(body.title ?? "").trim(),
    date: String(body.date ?? "").trim(),
    time: String(body.time ?? "").trim(),
    location: String(body.location ?? "").trim(),
    campusId: body.campusId ? String(body.campusId) : undefined,
    published: body.published === false ? false : true,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const includeUnpublished = searchParams.get("all") === "1";

  if (includeUnpublished) {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    const user = await getUserFromSession(token);
    if (!canManageDevotions(user)) {
      return NextResponse.json({ error: "Leader access required." }, { status: 403 });
    }
    const events = await getEvents({ includeUnpublished: true });
    return NextResponse.json({ events, canManage: true });
  }

  const events = await getEvents();
  return NextResponse.json({ events });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  const body = await request.json();

  if (!canManageDevotions(user, body.pin)) {
    return NextResponse.json({ error: "Leader access required." }, { status: 403 });
  }

  const input = parseEventBody(body);
  if (!input.title || !input.date || !input.time || !input.location) {
    return NextResponse.json(
      { error: "Title, date, time, and location are required." },
      { status: 400 },
    );
  }

  const event = await createEvent(input);
  return NextResponse.json({ event }, { status: 201 });
}

export async function PATCH(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  const body = await request.json();

  if (!canManageDevotions(user, body.pin)) {
    return NextResponse.json({ error: "Leader access required." }, { status: 403 });
  }

  const id = String(body.id ?? "");
  if (!id) {
    return NextResponse.json({ error: "Event id is required." }, { status: 400 });
  }

  const event = await updateEvent(id, {
    title: body.title ? String(body.title).trim() : undefined,
    date: body.date ? String(body.date).trim() : undefined,
    time: body.time ? String(body.time).trim() : undefined,
    location: body.location ? String(body.location).trim() : undefined,
    campusId: body.campusId ? String(body.campusId) : undefined,
    published: body.published === false ? false : body.published === true ? true : undefined,
  });

  if (!event) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  return NextResponse.json({ event });
}

export async function DELETE(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  const body = await request.json();

  if (!canManageDevotions(user, body.pin)) {
    return NextResponse.json({ error: "Leader access required." }, { status: 403 });
  }

  const id = String(body.id ?? "");
  const removed = await deleteEvent(id);
  if (!removed) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
