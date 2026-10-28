import { findCommunityStoryMusicTrack } from "@/lib/community-story-music";
import { resolveStoryMusicAudioStreamUrl } from "@/lib/community-story-music-playback-server";
import type { StoryMusicPlaybackPlan } from "@/lib/story-music/types";

/** Pre-hybrid production behavior (unchanged when STORY_MUSIC_HYBRID_ENABLED is off). */
export async function resolveLegacyStoryMusicPlayback(
  trackId: string,
  origin: string,
): Promise<StoryMusicPlaybackPlan | null> {
  const track = findCommunityStoryMusicTrack(trackId);
  if (!track) return null;

  const startSeconds =
    typeof track.startSeconds === "number" && track.startSeconds >= 0
      ? Math.floor(track.startSeconds)
      : null;

  const hosted = track.audioUrl?.trim();
  if (hosted) {
    return {
      trackId: track.id,
      playability: "playable",
      mode: "audio",
      audioUrl: hosted,
      startSeconds,
      title: track.title,
      artist: track.artist,
      provider: "legacy_catalog",
    };
  }

  const proxiedAudioUrl = `${origin}/api/community/story-music/stream?trackId=${encodeURIComponent(trackId)}`;
  const directAudio = await resolveStoryMusicAudioStreamUrl(track.youtubeVideoId);
  if (directAudio) {
    return {
      trackId: track.id,
      playability: "playable",
      mode: "audio",
      audioUrl: proxiedAudioUrl,
      startSeconds,
      title: track.title,
      artist: track.artist,
      provider: "legacy_catalog",
      youtubeVideoId: track.youtubeVideoId,
    };
  }

  return {
    trackId: track.id,
    playability: "playable",
    mode: "youtube",
    startSeconds,
    title: track.title,
    artist: track.artist,
    provider: "legacy_catalog",
    youtubeVideoId: track.youtubeVideoId,
  };
}
