import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { getDevotionById } from "@/lib/devotion-server";
import {
  getDevotionReactions,
  toggleDevotionReaction,
} from "@/lib/devotion-reaction-server";
import { getPublicDisplayName } from "@/lib/member-display-name";
import { isAllowedReactionEmoji } from "@/lib/chat-utils";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const devotionId = searchParams.get("devotionId")?.trim() ?? "";

  if (!devotionId) {
    return NextResponse.json({ error: "devotionId is required." }, { status: 400 });
  }

  const devotion = await getDevotionById(devotionId);
  if (!devotion || devotion.published === false) {
    return NextResponse.json({ error: "Devotion not found." }, { status: 404 });
  }

  const reactions = await getDevotionReactions(devotionId);
  return NextResponse.json(
    { reactions },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return NextResponse.json({ error: "Sign in to react to devotions." }, { status: 401 });
  }

  const body = await request.json();
  const devotionId = String(body.devotionId ?? "").trim();
  const emoji = String(body.emoji ?? "").trim();

  if (!devotionId || !emoji) {
    return NextResponse.json({ error: "devotionId and emoji are required." }, { status: 400 });
  }

  if (!isAllowedReactionEmoji(emoji)) {
    return NextResponse.json({ error: "Choose a supported emoji reaction." }, { status: 400 });
  }

  const devotion = await getDevotionById(devotionId);
  if (!devotion || devotion.published === false) {
    return NextResponse.json({ error: "Devotion not found." }, { status: 404 });
  }

  const reactions = await toggleDevotionReaction({
    devotionId,
    emoji,
    userId: user.id,
    userName: getPublicDisplayName(user),
  });

  return NextResponse.json({ reactions });
}
