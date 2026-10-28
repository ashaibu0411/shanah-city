import type { StoryMusicPlaybackPlan } from "@/lib/story-music/types";
import { isStoryMusicHybridActive } from "@/lib/story-music/story-music-service";

export type StoryMusicPlaybackApiResponse = {
  hybrid?: boolean;
  playability?: "playable" | "unavailable";
  mode: "audio" | "youtube" | "unavailable";
  audioUrl?: string;
  youtubeVideoId?: string;
  startSeconds?: number | null;
  unavailableReason?: string;
  error?: string;
};

export function storyMusicPlaybackToApiResponse(plan: StoryMusicPlaybackPlan): StoryMusicPlaybackApiResponse {
  const base = {
    hybrid: isStoryMusicHybridActive(),
    playability: plan.playability,
    startSeconds: plan.startSeconds ?? null,
    unavailableReason: plan.unavailableReason,
  };

  if (plan.mode === "unavailable" || plan.playability === "unavailable") {
    return { ...base, mode: "unavailable" };
  }

  if (plan.mode === "youtube" && plan.youtubeVideoId) {
    return {
      ...base,
      mode: "youtube",
      youtubeVideoId: plan.youtubeVideoId,
    };
  }

  if (plan.mode === "audio" && plan.audioUrl) {
    return {
      ...base,
      mode: "audio",
      audioUrl: plan.audioUrl,
      youtubeVideoId: plan.youtubeVideoId,
    };
  }

  return {
    ...base,
    mode: "unavailable",
    unavailableReason: plan.unavailableReason ?? "Playback could not be resolved.",
  };
}
