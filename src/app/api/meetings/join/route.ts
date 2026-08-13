import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import {
  logMeetingClick,
  parseMeetingClickSource,
} from "@/lib/meeting-click-server";
import { resolveMeetingJoinTarget } from "@/lib/meeting-join";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const meetingId = searchParams.get("meetingId");
    const groupId = searchParams.get("groupId");
    const source = parseMeetingClickSource(searchParams.get("source")) ?? "meetings_page";

    if (!meetingId && !groupId) {
      return NextResponse.json({ error: "Meeting or group id required." }, { status: 400 });
    }

    const target = await resolveMeetingJoinTarget({ meetingId, groupId });
    if (!target) {
      return NextResponse.json({ error: "Meeting link not found." }, { status: 404 });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    const user = await getUserFromSession(token);

    if (!user) {
      const next = `${searchParams.toString() ? `/api/meetings/join?${searchParams.toString()}` : "/meetings"}`;
      return NextResponse.redirect(new URL(`/sign-in?next=${encodeURIComponent(next)}`, request.url));
    }

    await logMeetingClick({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      meetingId: target.meetingId,
      meetingTitle: target.meetingTitle,
      groupId: target.groupId,
      groupName: target.groupName,
      campusId: target.campusId,
      platform: target.platform,
      source,
      joinUrl: target.joinUrl,
    });

    return NextResponse.redirect(target.joinUrl);
  } catch {
    return NextResponse.json({ error: "Could not open meeting link." }, { status: 500 });
  }
}
