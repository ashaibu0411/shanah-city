import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { canManageChurchEvents } from "@/lib/group-permissions-server";
import { clearMeetingLastNotified, getMeetingById } from "@/lib/meeting-server";
import { meetingHasJoinLink } from "@/lib/meeting-utils";
import { deliverMeetingReminderPush } from "@/lib/morning-prayer-notify-server";
import { getZonedDateParts } from "@/lib/denver-time";

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

  await clearMeetingLastNotified(meeting.id);
  const result = await deliverMeetingReminderPush(
    meeting,
    getZonedDateParts().dateKey,
  );

  return NextResponse.json({
    ok: result.sent > 0,
    sent: result.sent,
    skipped: result.skipped,
    configured: result.configured,
    error:
      result.sent === 0 && result.configured
        ? "No registered devices received the alert. Check Profile → Notifications on the phone app."
        : result.sent === 0
          ? "Push is not configured on the server."
          : undefined,
  });
}
