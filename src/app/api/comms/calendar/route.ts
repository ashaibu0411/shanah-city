import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { canManageAsAdmin } from "@/lib/admin-access-server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { commsChannelMeta } from "@/lib/comms-constants";
import {
  deleteCommsCalendarItem,
  listCommsCalendarItems,
  saveCommsCalendarItem,
} from "@/lib/comms-server";
import type { CommsCalendarStatus, CommsChannelId } from "@/lib/comms-types";
import { weekStartIso } from "@/lib/comms-week-utils";

function parseChannel(value: unknown): CommsChannelId {
  const allowed: CommsChannelId[] = [
    "service_announcement",
    "instagram",
    "facebook",
    "email",
    "newsletter",
    "app_banner",
    "push",
  ];
  return allowed.includes(value as CommsChannelId)
    ? (value as CommsChannelId)
    : "service_announcement";
}

function parseStatus(value: unknown): CommsCalendarStatus {
  const allowed: CommsCalendarStatus[] = ["planned", "draft", "scheduled", "published"];
  return allowed.includes(value as CommsCalendarStatus)
    ? (value as CommsCalendarStatus)
    : "planned";
}

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user || !(await canManageAsAdmin(user))) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const weekStart = new URL(request.url).searchParams.get("weekStart") ?? weekStartIso();
  const items = await listCommsCalendarItems(weekStart);
  return NextResponse.json({ items, weekStart });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user || !(await canManageAsAdmin(user))) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const body = await request.json();
  const title = String(body.title ?? "").trim();
  const channel = parseChannel(body.channel);
  const weekStart = String(body.weekStart ?? weekStartIso());
  const meta = commsChannelMeta(channel);

  if (!title) {
    return NextResponse.json({ error: "Title is required." }, { status: 400 });
  }

  const item = await saveCommsCalendarItem({
    title,
    channel,
    weekStart,
    scheduledDate: body.scheduledDate ? String(body.scheduledDate) : undefined,
    status: body.scheduledDate ? "scheduled" : "planned",
    color: String(body.color ?? meta.color),
    body: String(body.body ?? "").trim() || undefined,
    requestId: body.requestId ? String(body.requestId) : undefined,
    assigneeId: body.assigneeId ? String(body.assigneeId) : undefined,
    assigneeName: body.assigneeName ? String(body.assigneeName).trim() : undefined,
    dueDate: body.dueDate ? String(body.dueDate) : undefined,
    createdBy: user.id,
    createdByName: user.name,
  });

  return NextResponse.json({ item });
}

export async function PATCH(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user || !(await canManageAsAdmin(user))) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const body = await request.json();
  const id = String(body.id ?? "").trim();
  if (!id) {
    return NextResponse.json({ error: "Item id is required." }, { status: 400 });
  }

  const existing = (await listCommsCalendarItems()).find((entry) => entry.id === id);
  if (!existing) {
    return NextResponse.json({ error: "Calendar item not found." }, { status: 404 });
  }

  const nextScheduledDate =
    body.scheduledDate !== undefined
      ? String(body.scheduledDate).trim() || undefined
      : existing.scheduledDate;
  const nextStatus = body.status
    ? parseStatus(body.status)
    : body.scheduledDate !== undefined
      ? nextScheduledDate
        ? "scheduled"
        : "planned"
      : existing.status;

  const item = await saveCommsCalendarItem({
    ...existing,
    title: body.title ? String(body.title).trim() : existing.title,
    channel: body.channel ? parseChannel(body.channel) : existing.channel,
    weekStart: body.weekStart ? String(body.weekStart) : existing.weekStart,
    scheduledDate: nextScheduledDate,
    status: nextStatus,
    body: body.body !== undefined ? String(body.body).trim() || undefined : existing.body,
    assigneeId:
      body.assigneeId !== undefined ? String(body.assigneeId) || undefined : existing.assigneeId,
    assigneeName:
      body.assigneeName !== undefined
        ? String(body.assigneeName).trim() || undefined
        : existing.assigneeName,
    dueDate: body.dueDate !== undefined ? String(body.dueDate) || undefined : existing.dueDate,
  });

  return NextResponse.json({ item });
}

export async function DELETE(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user || !(await canManageAsAdmin(user))) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const id = new URL(request.url).searchParams.get("id")?.trim();
  if (!id) {
    return NextResponse.json({ error: "Item id is required." }, { status: 400 });
  }

  const ok = await deleteCommsCalendarItem(id);
  if (!ok) {
    return NextResponse.json({ error: "Calendar item not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
