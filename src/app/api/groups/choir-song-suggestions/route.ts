import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { SHANAH_WORSHIP_GROUP_ID } from "@/lib/choir-group-constants";
import type { ChoirSongSuggestionTabId } from "@/lib/choir-song-suggestion-types";
import {
  buildChoirSongSuggestionHomePayload,
  buildChoirSongSuggestionReviewQueue,
  getChoirSongSuggestionDetail,
  getChoirSongSuggestionGuidelines,
  handleChoirSongSuggestionAction,
  listChoirSongSuggestionCards,
} from "@/lib/choir-song-suggestions-server";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const groupId = searchParams.get("groupId")?.trim() ?? SHANAH_WORSHIP_GROUP_ID;
  const view = searchParams.get("view")?.trim() ?? "home";

  if (view === "home") {
    const payload = await buildChoirSongSuggestionHomePayload(user, groupId);
    if (!payload) return NextResponse.json({ error: "Access denied." }, { status: 403 });
    return NextResponse.json({ payload });
  }

  if (view === "list") {
    const tab = (searchParams.get("tab")?.trim() ?? "home") as ChoirSongSuggestionTabId;
    const cards = await listChoirSongSuggestionCards(user, groupId, tab);
    if (!cards) return NextResponse.json({ error: "Access denied." }, { status: 403 });
    return NextResponse.json({ suggestions: cards });
  }

  if (view === "detail") {
    const suggestionId = searchParams.get("suggestionId")?.trim();
    if (!suggestionId) {
      return NextResponse.json({ error: "Missing suggestion id." }, { status: 400 });
    }
    const detail = await getChoirSongSuggestionDetail(user, groupId, suggestionId);
    if (!detail) return NextResponse.json({ error: "Not found." }, { status: 404 });
    return NextResponse.json({ detail });
  }

  if (view === "guidelines") {
    const guidelines = await getChoirSongSuggestionGuidelines(user, groupId);
    if (!guidelines) return NextResponse.json({ error: "Access denied." }, { status: 403 });
    return NextResponse.json({ guidelines });
  }

  if (view === "review_queue") {
    try {
      const queue = await buildChoirSongSuggestionReviewQueue(user, groupId);
      return NextResponse.json({ queue });
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Access denied." },
        { status: 403 },
      );
    }
  }

  return NextResponse.json({ error: "Unknown view." }, { status: 400 });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = await handleChoirSongSuggestionAction(user, body);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Request failed." },
      { status: 400 },
    );
  }
}
