import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { canManageWorshipPlan } from "@/lib/worship-access-server";
import {
  deleteWorshipLibrarySong,
  getWorshipLibrarySongByYouTubeVideoId,
  listWorshipLibrarySongs,
  saveWorshipLibrarySong,
} from "@/lib/worship-song-library-server";
import { fetchYouTubeOEmbed, lookupYouTubeVideo, resolveYouTubeVideo } from "@/lib/worship-youtube-utils";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";

async function requireWorshipLeader() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return { error: NextResponse.json({ error: "Sign in required." }, { status: 401 }) };
  }

  if (!(await canManageWorshipPlan(user))) {
    return { error: NextResponse.json({ error: "Worship leader access required." }, { status: 403 }) };
  }

  return { user };
}

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? undefined;
  const songs = await listWorshipLibrarySongs(query);
  return NextResponse.json({ songs });
}

export async function POST(request: Request) {
  const auth = await requireWorshipLeader();
  if (auth.error) return auth.error;

  const body = await request.json();
  const action = String(body.action ?? "save");

  if (action === "lookup_youtube") {
    const source = String(body.url ?? body.youtubeUrl ?? body.videoId ?? "").trim();
    const lookup = await lookupYouTubeVideo(source);
    if (!lookup) {
      return NextResponse.json(
        { error: "Paste a valid YouTube link or 11-character video ID." },
        { status: 400 },
      );
    }

    const existing = await getWorshipLibrarySongByYouTubeVideoId(lookup.videoId);
    return NextResponse.json({ lookup, existing });
  }

  if (action === "delete") {
    const id = String(body.id ?? "");
    const removed = await deleteWorshipLibrarySong(id);
    if (!removed) {
      return NextResponse.json({ error: "Song not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  }

  let youtubeVideoId = body.youtubeVideoId ? String(body.youtubeVideoId).trim() : undefined;
  let youtubeUrl = body.youtubeUrl ? String(body.youtubeUrl).trim() : undefined;
  const youtubeSource = String(body.url ?? body.youtubeUrl ?? "").trim();
  if (youtubeSource) {
    const resolved = resolveYouTubeVideo(youtubeSource);
    if (!resolved) {
      return NextResponse.json({ error: "Paste a valid YouTube link or video ID." }, { status: 400 });
    }
    youtubeVideoId = resolved.videoId;
    youtubeUrl = resolved.watchUrl;
  }

  let title = String(body.title ?? "").trim();
  let artist = body.artist ? String(body.artist).trim() : undefined;

  if (!title && youtubeVideoId) {
    const oEmbed = await fetchYouTubeOEmbed(youtubeVideoId);
    title = oEmbed?.title ?? "YouTube song";
    if (!artist && oEmbed?.authorName) {
      artist = oEmbed.authorName;
    }
  }

  if (!title) {
    return NextResponse.json({ error: "Song title or YouTube link is required." }, { status: 400 });
  }

  let id = body.id ? String(body.id) : undefined;
  if (!id && youtubeVideoId) {
    const existing = await getWorshipLibrarySongByYouTubeVideoId(youtubeVideoId);
    if (existing) {
      id = existing.id;
    }
  }

  const tags = Array.isArray(body.tags)
    ? body.tags.map((tag: unknown) => String(tag).trim()).filter(Boolean)
    : undefined;
  const nextTags = youtubeVideoId
    ? [...new Set([...(tags ?? []), "youtube"])]
    : tags;

  const song = await saveWorshipLibrarySong({
    id,
    title,
    artist,
    defaultKey: String(body.defaultKey ?? "C").trim() || "C",
    bpm: body.bpm ? Number(body.bpm) : undefined,
    ccliNumber: body.ccliNumber ? String(body.ccliNumber).trim() : undefined,
    youtubeVideoId,
    youtubeUrl,
    chartUrl: body.chartUrl ? String(body.chartUrl).trim() : undefined,
    chartFileName: body.chartFileName ? String(body.chartFileName).trim() : undefined,
    notes: body.notes ? String(body.notes).trim() : undefined,
    tags: nextTags,
    actor: { id: auth.user!.id, name: auth.user!.name },
  });

  return NextResponse.json({
    song,
    mergedExisting: Boolean(!body.id && id && youtubeVideoId),
  });
}
