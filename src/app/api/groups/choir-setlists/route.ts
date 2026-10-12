import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { buildChoirSetlistPagePayload } from "@/lib/choir-setlist-server";
import { SHANAH_WORSHIP_GROUP_ID } from "@/lib/choir-group-constants";
import { toggleChoirSetlistFavorite } from "@/lib/stores/choir-setlist-favorites-json";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const groupId =
    new URL(request.url).searchParams.get("groupId")?.trim() ?? SHANAH_WORSHIP_GROUP_ID;
  const payload = await buildChoirSetlistPagePayload(user, groupId);
  if (!payload) {
    return NextResponse.json({ error: "Access denied." }, { status: 403 });
  }

  return NextResponse.json({ payload });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const body = await request.json();
  const groupId = String(body.groupId ?? SHANAH_WORSHIP_GROUP_ID).trim();
  if (groupId !== SHANAH_WORSHIP_GROUP_ID) {
    return NextResponse.json({ error: "Invalid group." }, { status: 400 });
  }

  const payload = await buildChoirSetlistPagePayload(user, groupId);
  if (!payload) {
    return NextResponse.json({ error: "Access denied." }, { status: 403 });
  }

  const action = String(body.action ?? "");
  if (action === "toggle_favorite") {
    const songId = String(body.songId ?? "").trim();
    if (!songId) {
      return NextResponse.json({ error: "Song id required." }, { status: 400 });
    }
    const favoriteSongIds = await toggleChoirSetlistFavorite(user.id, songId);
    return NextResponse.json({ favoriteSongIds });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
