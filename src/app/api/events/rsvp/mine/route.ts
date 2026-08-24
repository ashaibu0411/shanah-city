import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { getMyEventRsvps } from "@/lib/event-rsvp-server";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return NextResponse.json({ pending: [], responded: [], pendingCount: 0 });
  }

  const result = await getMyEventRsvps(user);
  return NextResponse.json(result);
}
