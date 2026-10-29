import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { searchCommunityStoryMusic } from "@/lib/community-story-music";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import {
  isStoryMusicHybridActiveForViewer,
  searchStoryMusicTracks,
} from "@/lib/story-music/story-music-service";
import {
  countActiveFreeWorshipTracksForViewer,
  isStoryMusicFreeLibraryLiveForMembers,
  isStoryMusicFreeLibraryLiveForViewer,
} from "@/lib/story-music/story-music-free-library";
import { filterStoryMusicTracksForViewer } from "@/lib/story-music/story-music-pilot-access";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const region = searchParams.get("region") ?? "all";
  const country = searchParams.get("country") ?? "all";
  const language = searchParams.get("language") ?? "all";
  const genre = searchParams.get("genre") ?? "all";

  const hybrid = await isStoryMusicHybridActiveForViewer(user);
  const youtubeCatalog = searchParams.get("youtube") === "1";
  let tracks = youtubeCatalog
    ? searchCommunityStoryMusic(q, 56, region)
    : await searchStoryMusicTracks(
        {
          query: q,
          region,
          country,
          language,
          genre,
          limit: 56,
        },
        null,
        user,
      );

  if (hybrid && !youtubeCatalog) {
    tracks = await filterStoryMusicTracksForViewer(tracks, user);
  }

  const freeLibraryLive = user
    ? await isStoryMusicFreeLibraryLiveForViewer(user)
    : isStoryMusicFreeLibraryLiveForMembers();
  const activeFreeTrackCount = user
    ? await countActiveFreeWorshipTracksForViewer(user)
    : 0;

  return NextResponse.json({
    hybrid,
    attachableOnly: hybrid,
    freeLibraryLive,
    activeFreeTrackCount,
    tracks,
  });
}
