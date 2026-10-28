import { NextResponse } from "next/server";
import { isStoryMusicHybridActive, searchStoryMusicTracks } from "@/lib/story-music/story-music-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const region = searchParams.get("region") ?? "all";
  const country = searchParams.get("country") ?? "all";
  const language = searchParams.get("language") ?? "all";
  const genre = searchParams.get("genre") ?? "all";

  const hybrid = isStoryMusicHybridActive();
  const tracks = searchStoryMusicTracks({
    query: q,
    region,
    country,
    language,
    genre,
    limit: hybrid ? 56 : 56,
  });

  return NextResponse.json({
    hybrid,
    attachableOnly: hybrid,
    tracks,
  });
}
