import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import {
  canViewMeetingClickReport,
  getMeetingClicks,
} from "@/lib/meeting-click-server";

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    const user = await getUserFromSession(token);

    const { searchParams } = new URL(request.url);
    const meetingId = searchParams.get("meetingId") ?? undefined;
    const groupId = searchParams.get("groupId") ?? undefined;
    const since = searchParams.get("since") ?? undefined;
    const limit = Number(searchParams.get("limit") ?? "100");

    if (!(await canViewMeetingClickReport(user, groupId))) {
      return NextResponse.json({ error: "Leader or group admin access required." }, { status: 403 });
    }

    const clicks = await getMeetingClicks({
      meetingId,
      groupId,
      since,
      limit: Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 500) : 100,
    });

    return NextResponse.json({ clicks });
  } catch {
    return NextResponse.json({ error: "Could not load join report." }, { status: 500 });
  }
}
