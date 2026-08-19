import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import {
  canViewMeetingClickReport,
  getMeetingClicks,
} from "@/lib/meeting-click-server";
import {
  SHIFT_YOUR_EVENING_ID,
  SHIFT_YOUR_MORNING_ID,
  isTrackedJoinMeeting,
} from "@/lib/meeting-catalog";

const PRAYER_MEETING_IDS = [SHIFT_YOUR_MORNING_ID, SHIFT_YOUR_EVENING_ID];

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    const user = await getUserFromSession(token);

    const { searchParams } = new URL(request.url);
    const meetingId = searchParams.get("meetingId") ?? undefined;
    const since = searchParams.get("since") ?? undefined;
    const limit = Number(searchParams.get("limit") ?? "100");

    if (!(await canViewMeetingClickReport(user))) {
      return NextResponse.json({ error: "Leader or group admin access required." }, { status: 403 });
    }

    if (meetingId && !isTrackedJoinMeeting(meetingId)) {
      return NextResponse.json({ clicks: [] });
    }

    const clicks = await getMeetingClicks({
      meetingId,
      meetingIds: meetingId ? undefined : PRAYER_MEETING_IDS,
      since,
      limit: Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 500) : 100,
    });

    return NextResponse.json({ clicks });
  } catch {
    return NextResponse.json({ error: "Could not load join report." }, { status: 500 });
  }
}
