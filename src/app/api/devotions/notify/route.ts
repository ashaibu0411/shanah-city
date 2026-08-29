import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { canWriteDevotions } from "@/lib/devotion-access-server";
import { clearDevotionNotified, getDevotionById } from "@/lib/devotion-server";
import { deliverDevotionPush } from "@/lib/devotion-notify-server";
import { devotionGroupMatchHint } from "@/lib/devotion-writers-group";
import { isDevotionPubliclyVisible } from "@/lib/devotion-utils";

const accessError = `Devotion writing is limited to members of ${devotionGroupMatchHint()}.`;

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!(await canWriteDevotions(user))) {
    return NextResponse.json({ error: accessError }, { status: 403 });
  }

  const body = await request.json();
  const id = String(body.id ?? "").trim();
  if (!id) {
    return NextResponse.json({ error: "Devotion id is required." }, { status: 400 });
  }

  const devotion = await getDevotionById(id);
  if (!devotion) {
    return NextResponse.json({ error: "Devotion not found." }, { status: 404 });
  }
  if (!isDevotionPubliclyVisible(devotion)) {
    return NextResponse.json(
      { error: "Publish this devotion before sending a notification." },
      { status: 400 },
    );
  }

  await clearDevotionNotified(devotion.id);
  const result = await deliverDevotionPush(devotion);

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
