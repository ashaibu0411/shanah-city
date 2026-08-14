import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import {
  canManageChurchEvents,
  canManageGroupEvents,
} from "@/lib/group-permissions-server";
import { getGroups } from "@/lib/group-server";
import { isGroupMember } from "@/lib/group-admin-utils";
import { canManageAsAdmin } from "@/lib/admin-access-server";
import {
  createEvent,
  deleteEvent,
  getEvents,
  updateEvent,
} from "@/lib/event-server";

function parseEventBody(body: Record<string, unknown>) {
  const groupId = body.groupId ? String(body.groupId).trim() : undefined;
  const groupName = body.groupName ? String(body.groupName).trim() : undefined;

  return {
    title: String(body.title ?? "").trim(),
    date: String(body.date ?? "").trim(),
    time: String(body.time ?? "").trim(),
    location: String(body.location ?? "").trim(),
    campusId: body.campusId ? String(body.campusId) : undefined,
    groupId: groupId || undefined,
    groupName: groupName || undefined,
    published: body.published === false ? false : true,
  };
}

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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const includeUnpublished = searchParams.get("all") === "1";
  const groupParam = searchParams.get("groupId");
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  const isAdmin = await canManageAsAdmin(user);

  if (includeUnpublished) {
    if (!isAdmin) {
      return NextResponse.json({ error: "Admin Group access required." }, { status: 403 });
    }
    const events = await getEvents({ includeUnpublished: true });
    return NextResponse.json({ events, canManage: true });
  }

  if (groupParam && groupParam !== "church") {
    if (!user) {
      return NextResponse.json({ error: "Sign in to view group events." }, { status: 401 });
    }

    if (!isAdmin) {
      const groups = await getGroups();
      const group = groups.find((entry) => entry.id === groupParam);
      if (!group || !isGroupMember(group, user.id)) {
        return NextResponse.json({ error: "Group membership required." }, { status: 403 });
      }
    }

    const events = await getEvents({ groupId: groupParam });
    const canManage = await canManageGroupEvents(user, groupParam);
    return NextResponse.json({ events, canManage });
  }

  const events = await getEvents({ groupId: null });
  const canManage = await canManageChurchEvents(user);
  return NextResponse.json({ events, canManage });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  const body = await request.json();
  const input = parseEventBody(body);

  if (!input.title || !input.date || !input.time || !input.location) {
    return NextResponse.json(
      { error: "Title, date, time, and location are required." },
      { status: 400 },
    );
  }

  const denied = await assertCanManageEvent(user, input.groupId ?? null);
  if (denied) return denied;

  if (input.groupId) {
    const groups = await getGroups();
    const group = groups.find((entry) => entry.id === input.groupId);
    if (!group) {
      return NextResponse.json({ error: "Group not found." }, { status: 404 });
    }
    input.groupName = group.name;
  }

  const event = await createEvent(input);
  return NextResponse.json({ event }, { status: 201 });
}

export async function PATCH(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  const body = await request.json();
  const id = String(body.id ?? "");

  if (!id) {
    return NextResponse.json({ error: "Event id is required." }, { status: 400 });
  }

  const existingEvents = await getEvents({ includeUnpublished: true });
  const existing = existingEvents.find((event) => event.id === id);
  if (!existing) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  const denied = await assertCanManageEvent(user, existing.groupId ?? null);
  if (denied) return denied;

  const event = await updateEvent(id, {
    title: body.title ? String(body.title).trim() : undefined,
    date: body.date ? String(body.date).trim() : undefined,
    time: body.time ? String(body.time).trim() : undefined,
    location: body.location ? String(body.location).trim() : undefined,
    campusId: body.campusId ? String(body.campusId) : undefined,
    groupId: body.groupId === null ? null : body.groupId ? String(body.groupId) : undefined,
    groupName:
      body.groupName === null ? null : body.groupName ? String(body.groupName) : undefined,
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
  const id = String(body.id ?? "");

  const existingEvents = await getEvents({ includeUnpublished: true });
  const existing = existingEvents.find((event) => event.id === id);
  if (!existing) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  const denied = await assertCanManageEvent(user, existing.groupId ?? null);
  if (denied) return denied;

  const removed = await deleteEvent(id);
  if (!removed) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
