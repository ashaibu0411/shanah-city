import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import {
  listMarriagePrepNotificationsForViewer,
  markAllMarriagePrepNotificationsReadForViewer,
  markMarriagePrepNotificationReadForViewer,
} from "@/lib/marriage-prep-notifications-server";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const notifications = await listMarriagePrepNotificationsForViewer(user);
  return NextResponse.json({ notifications });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as {
    action?: string;
    notificationId?: string;
  };

  if (body.action === "mark_all_read") {
    await markAllMarriagePrepNotificationsReadForViewer(user);
    const notifications = await listMarriagePrepNotificationsForViewer(user);
    return NextResponse.json({ notifications });
  }

  if (body.action === "mark_read" && body.notificationId) {
    await markMarriagePrepNotificationReadForViewer(user, body.notificationId);
    const notifications = await listMarriagePrepNotificationsForViewer(user);
    return NextResponse.json({ notifications });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
