import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { canManageAsAdmin } from "@/lib/admin-access-server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { getUrgentAlertById } from "@/lib/urgent-alert-server";
import { sendPushToAllMembers } from "@/lib/push-server";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user || !(await canManageAsAdmin(user))) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const body = await request.json();
  const id = String(body.id ?? "").trim();
  if (!id) {
    return NextResponse.json({ error: "Alert id is required." }, { status: 400 });
  }

  const alert = await getUrgentAlertById(id);
  if (!alert || !alert.active) {
    return NextResponse.json({ error: "Publish this alert before sending a notification." }, { status: 400 });
  }

  const result = await sendPushToAllMembers(
    {
      title: `URGENT: ${alert.title}`,
      body: alert.message.slice(0, 160),
      url: alert.href || `/?alert=${encodeURIComponent(alert.id)}`,
    },
    "announcements",
    user.id,
  );

  return NextResponse.json({
    ok: true,
    sent: result.sent,
    skipped: result.skipped,
  });
}
