import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { marriageStore } from "@/lib/stores/marriage-counseling-store";
import { listReleasedHomeworkForParticipant } from "@/lib/marriage-homework-server";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  try {
    const active = await marriageStore().getActiveJourneyForUser(user.id);
    if (!active) {
      return NextResponse.json({ journeyId: null, items: [] });
    }
    const items = await listReleasedHomeworkForParticipant(user, active.id);
    return NextResponse.json(
      { journeyId: active.id, items },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
