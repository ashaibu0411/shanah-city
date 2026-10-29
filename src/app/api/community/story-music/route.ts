import { NextResponse } from "next/server";
import { searchCommunityStoryMusic } from "@/lib/community-story-music";
import { isStoryMusicHybridActive, searchStoryMusicTracks } from "@/lib/story-music/story-music-service";
import {
  countActiveFreeWorshipTracks,
  isStoryMusicFreeLibraryLiveForMembers,
} from "@/lib/story-music/story-music-free-library";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const region = searchParams.get("region") ?? "all";
  const country = searchParams.get("country") ?? "all";
  const language = searchParams.get("language") ?? "all";
  const genre = searchParams.get("genre") ?? "all";

  const hybrid = isStoryMusicHybridActive();
  const youtubeCatalog = searchParams.get("youtube") === "1";
  const tracks = youtubeCatalog
    ? searchCommunityStoryMusic(q, 56, region)
    : await searchStoryMusicTracks({
        query: q,
        region,
        country,
        language,
        genre,
        limit: 56,
      });

  return NextResponse.json({
    hybrid,
    attachableOnly: hybrid,
    freeLibraryLive: isStoryMusicFreeLibraryLiveForMembers(),
    activeFreeTrackCount: countActiveFreeWorshipTracks(),
    tracks,
  });
}
