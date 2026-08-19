import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { canManageChurchEvents } from "@/lib/group-permissions-server";
import {
  createMeeting,
  deleteMeeting,
  getMeetings,
  updateMeeting,
} from "@/lib/meeting-server";
import type { MeetingPlatform } from "@/lib/types";
import { isProtectedMeetingId } from "@/lib/meeting-catalog";

function parseMeetingBody(body: Record<string, unknown>) {
  const platform = String(body.platform ?? "zoom").trim() as MeetingPlatform;
  const recurringWeekdayRaw = body.recurringWeekday;

  return {
    title: String(body.title ?? "").trim(),
    campusId: String(body.campusId ?? "colorado").trim(),
    host: String(body.host ?? "").trim(),
    schedule: String(body.schedule ?? "").trim(),
    platform,
    joinUrl: body.joinUrl ? String(body.joinUrl).trim() : undefined,
    location: body.location ? String(body.location).trim() : undefined,
    meetingId: body.meetingId ? String(body.meetingId).trim() : undefined,
    passcode: body.passcode ? String(body.passcode).trim() : undefined,
    startsOn: body.startsOn ? String(body.startsOn).trim() : undefined,
    endsOn: body.endsOn ? String(body.endsOn).trim() : undefined,
    recurringWeekday:
      recurringWeekdayRaw === "" || recurringWeekdayRaw == null
        ? undefined
        : Number(recurringWeekdayRaw),
    notifyEnabled: typeof body.notifyEnabled === "boolean" ? body.notifyEnabled : undefined,
    published: body.published === false ? false : true,
  };
}

function validateMeetingInput(input: ReturnType<typeof parseMeetingBody>) {
  if (!input.title || !input.host || !input.schedule) {
    return "Title, host, and schedule are required.";
  }

  if (!["in-person", "zoom", "teams"].includes(input.platform)) {
    return "Platform must be in-person, zoom, or teams.";
  }

  if (input.platform === "in-person") {
    if (!input.location) {
      return "Location is required for in-person meetings.";
    }
    return null;
  }

  if (input.platform !== "zoom" && input.platform !== "teams") {
    return "Platform must be in-person, zoom, or teams.";
  }

  return null;
}

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  const canManage = await canManageChurchEvents(user);
  const meetings = await getMeetings();

  return NextResponse.json({ meetings, canManage });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!(await canManageChurchEvents(user))) {
    return NextResponse.json({ error: "Admin Group access required." }, { status: 403 });
  }

  const body = await request.json();
  const input = parseMeetingBody(body);
  const validationError = validateMeetingInput(input);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const meeting = await createMeeting(input);
  return NextResponse.json({ meeting }, { status: 201 });
}

export async function PATCH(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!(await canManageChurchEvents(user))) {
    return NextResponse.json({ error: "Admin Group access required." }, { status: 403 });
  }

  const body = await request.json();
  const id = String(body.id ?? "");
  if (!id) {
    return NextResponse.json({ error: "Meeting id is required." }, { status: 400 });
  }

  if (typeof body.notifyEnabled === "boolean" && body.title == null) {
    const meeting = await updateMeeting(id, { notifyEnabled: body.notifyEnabled });
    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found." }, { status: 404 });
    }
    return NextResponse.json({ meeting });
  }

  const input = parseMeetingBody(body);
  const validationError = validateMeetingInput(input);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const meeting = await updateMeeting(id, input);
  if (!meeting) {
    return NextResponse.json({ error: "Meeting not found." }, { status: 404 });
  }

  return NextResponse.json({ meeting });
}

export async function DELETE(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!(await canManageChurchEvents(user))) {
    return NextResponse.json({ error: "Admin Group access required." }, { status: 403 });
  }

  const body = await request.json();
  const id = String(body.id ?? "");
  if (!id) {
    return NextResponse.json({ error: "Meeting id is required." }, { status: 400 });
  }

  if (isProtectedMeetingId(id)) {
    return NextResponse.json(
      { error: "This meeting is managed by the church calendar. Pause reminders instead of deleting it." },
      { status: 400 },
    );
  }

  const removed = await deleteMeeting(id);
  if (!removed) {
    return NextResponse.json({ error: "Meeting not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
