import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { canManageChurchEvents } from "@/lib/group-permissions-server";
import { getMeetingById } from "@/lib/meeting-server";
import { meetingHasJoinLink } from "@/lib/meeting-utils";
import { notifyScheduledMeeting } from "@/lib/push-server";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!(await canManageChurchEvents(user))) {
    return NextResponse.json({ error: "Admin Group access required." }, { status: 403 });
  }

  const body = await request.json();
  const id = String(body.id ?? "").trim();
  if (!id) {
    return NextResponse.json({ error: "Meeting id is required." }, { status: 400 });
  }

  const meeting = await getMeetingById(id);
  if (!meeting || meeting.published === false) {
    return NextResponse.json({ error: "Meeting not found." }, { status: 404 });
  }

  if (!meetingHasJoinLink(meeting)) {
    return NextResponse.json(
      { error: "This meeting does not have a join link to notify." },
      { status: 400 },
    );
  }

  const result = await notifyScheduledMeeting({
    id: meeting.id,
    title: meeting.title,
    schedule: meeting.schedule,
    platform: meeting.platform,
  });

  return NextResponse.json({
    ok: true,
    sent: result.sent,
    skipped: result.skipped,
    configured: result.configured,
  });
}
