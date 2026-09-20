import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { canManageAsAdmin } from "@/lib/admin-access-server";
import { getVolunteerCheckIns } from "@/lib/member-server";
import { getZonedDateParts } from "@/lib/denver-time";
import { volunteerArrivalsForDateKey } from "@/lib/volunteer-checkin";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  if (!(await canManageAsAdmin(user))) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const url = new URL(request.url);
  const dateParam = url.searchParams.get("date")?.trim();
  const dateKey = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)
    ? dateParam
    : getZonedDateParts().dateKey;

  const checkins = await getVolunteerCheckIns();
  const arrivals = volunteerArrivalsForDateKey(checkins, dateKey);

  return NextResponse.json({ dateKey, arrivals });
}
