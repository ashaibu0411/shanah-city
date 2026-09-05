import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { canManageAsAdmin } from "@/lib/admin-access-server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { commsTemplateMeta } from "@/lib/comms-constants";
import { addApprovedRequestToCalendar } from "@/lib/comms-promote-server";
import { getCommsRequestById, listCommsRequests, saveCommsRequest } from "@/lib/comms-server";
import type { CommsChannelId, CommsRequestStatus, CommsRequestTemplate } from "@/lib/comms-types";
import { weekStartIso } from "@/lib/comms-week-utils";

function parseTemplate(value: unknown): CommsRequestTemplate {
  if (value === "media" || value === "worship" || value === "communications" || value === "general") {
    return value;
  }
  return "general";
}

function parseStatus(value: unknown): CommsRequestStatus {
  const allowed: CommsRequestStatus[] = [
    "submitted",
    "pending_approval",
    "approved",
    "in_progress",
    "done",
    "on_hold",
  ];
  return allowed.includes(value as CommsRequestStatus)
    ? (value as CommsRequestStatus)
    : "submitted";
}

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const isAdmin = await canManageAsAdmin(user);
  const requests = await listCommsRequests();
  const visible = isAdmin
    ? requests
    : requests.filter((request) => request.requesterId === user.id);

  return NextResponse.json({ requests: visible, isAdmin });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const body = await request.json();
  const template = parseTemplate(body.template);
  const meta = commsTemplateMeta(template);
  const title = String(body.title ?? "").trim();
  const description = String(body.description ?? "").trim();

  if (!title || !description) {
    return NextResponse.json({ error: "Title and description are required." }, { status: 400 });
  }

  const deliverables = Array.isArray(body.deliverables)
    ? body.deliverables.map(String).filter(Boolean)
    : meta.deliverables;

  const record = await saveCommsRequest({
    template,
    title,
    department: String(body.department ?? meta.department).trim(),
    description,
    targetAudience: String(body.targetAudience ?? "").trim() || undefined,
    deliverables,
    dueDate: body.dueDate ? String(body.dueDate) : undefined,
    status: "submitted",
    requesterId: user.id,
    requesterName: user.name,
    requesterEmail: user.email,
  });

  return NextResponse.json({ request: record });
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
    return NextResponse.json({ error: "Request id is required." }, { status: 400 });
  }

  const existing = await getCommsRequestById(id);
  if (!existing) {
    return NextResponse.json({ error: "Request not found." }, { status: 404 });
  }

  if (body.action === "schedule") {
    const channel = String(body.channel ?? "app_banner") as CommsChannelId;
    const item = await addApprovedRequestToCalendar(
      id,
      user,
      channel,
      String(body.weekStart ?? weekStartIso()),
      body.scheduledDate ? String(body.scheduledDate) : undefined,
    );
    const request = await getCommsRequestById(id);
    return NextResponse.json({ item, request });
  }

  const record = await saveCommsRequest({
    ...existing,
    status: body.status ? parseStatus(body.status) : existing.status,
    assigneeId: body.assigneeId ? String(body.assigneeId) : existing.assigneeId,
    assigneeName: body.assigneeName ? String(body.assigneeName).trim() : existing.assigneeName,
    notes: body.notes !== undefined ? String(body.notes).trim() : existing.notes,
    dueDate: body.dueDate !== undefined ? String(body.dueDate) || undefined : existing.dueDate,
  });

  return NextResponse.json({ request: record });
}
