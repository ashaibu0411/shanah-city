import type { ShanahMediaItem } from "@/lib/shanah-media-types";
import { Capacitor } from "@capacitor/core";

export type ShanahMediaCapabilities = {
  video: boolean;
  audio: boolean;
  backgroundAudio: boolean;
  pictureInPicture: boolean;
  cast: boolean;
  seek: boolean;
  playbackSpeed: boolean;
  switchToAudio: boolean;
  switchToVideo: boolean;
  share: boolean;
  youtubeEmbed: boolean;
};

function isAndroidApp() {
  return Capacitor.getPlatform() === "android";
}

function isHostedHttps(url?: string) {
  return Boolean(url?.trim().startsWith("https://"));
}

export function getShanahMediaCapabilities(
  item: ShanahMediaItem | null,
  playbackMode: "audio" | "video" = "audio",
): ShanahMediaCapabilities {
  if (!item) {
    return {
      video: false,
      audio: false,
      backgroundAudio: false,
      pictureInPicture: false,
      cast: false,
      seek: false,
      playbackSpeed: false,
      switchToAudio: false,
      switchToVideo: false,
      share: false,
      youtubeEmbed: false,
    };
  }

  const hasHostedVideo = isHostedHttps(item.hostedVideoUrl);
  const hasYoutube = Boolean(item.youtubeVideoId?.trim());
  const hasAuthorizedAudio = isHostedHttps(item.companionAudioUrl) || isHostedHttps(item.audioUrl);
  const video = hasHostedVideo || hasYoutube;
  const audio = hasAuthorizedAudio;
  const youtubeEmbed = hasYoutube && playbackMode === "video";

  return {
    video,
    audio,
    backgroundAudio: audio && (isAndroidApp() || typeof document !== "undefined"),
    pictureInPicture: hasHostedVideo && playbackMode === "video",
    cast: hasHostedVideo || (hasAuthorizedAudio && playbackMode === "audio"),
    seek: audio || hasHostedVideo,
    playbackSpeed: audio || hasHostedVideo,
    switchToAudio:
      playbackMode === "video" && hasAuthorizedAudio && Boolean(item.companionAudioUrl || item.audioUrl),
    switchToVideo:
      playbackMode === "audio" && (hasHostedVideo || hasYoutube) && Boolean(item.hostedVideoUrl || item.youtubeVideoId),
    share: Boolean(item.href || item.title),
    youtubeEmbed,
  };
}

export function switchToAudioUnavailableMessage(item: ShanahMediaItem) {
  if (item.youtubeVideoId && !item.companionAudioUrl) {
    return "Audio-only isn’t available for this message yet. Your team can publish Listen audio in admin — we don’t extract audio from YouTube.";
  }
  return "No authorized audio source is linked to this video.";
}
