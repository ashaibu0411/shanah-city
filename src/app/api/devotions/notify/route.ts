import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { canWriteDevotions } from "@/lib/devotion-access-server";
import { getDevotionById, markDevotionNotified } from "@/lib/devotion-server";
import { devotionGroupMatchHint } from "@/lib/devotion-writers-group";
import { isDevotionPubliclyVisible } from "@/lib/devotion-utils";
import { notifyNewDevotion } from "@/lib/push-server";

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

  const result = await notifyNewDevotion({
    title: devotion.title,
    authorId: user!.id,
    devotionId: devotion.id,
  });

  if (result.configured && result.sent > 0) {
    await markDevotionNotified(devotion.id);
  }

  return NextResponse.json({
    ok: true,
    sent: result.sent,
    skipped: result.skipped,
  });
}
