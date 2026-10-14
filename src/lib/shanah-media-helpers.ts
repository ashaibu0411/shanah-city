import type { ShanahMediaItem, ShanahMediaKind } from "@/lib/shanah-media-types";

/** ExoPlayer and some WebViews require absolute http(s) URLs. */
export function resolveAbsoluteMediaUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (typeof window === "undefined") return trimmed;
  return new URL(trimmed, window.location.origin).href;
}
import type { SermonVideo } from "@/lib/youtube-sermons-shared";
import {
  inferWorshipAudioContentType,
  resolveWorshipAudioUrl,
} from "@/lib/worship-audio-shared";

export function sermonToShanahMediaItem(
  sermon: SermonVideo,
  audioUrl: string,
  extras?: { companionAudioUrl?: string; hostedVideoUrl?: string; publishedAt?: string },
): ShanahMediaItem {
  const companion = extras?.companionAudioUrl ?? audioUrl;
  return {
    id: `sermon-${sermon.id}`,
    kind: "sermon-audio",
    title: sermon.title,
    artist: "Shanah City",
    artworkUrl: sermon.thumbnailUrl,
    audioUrl: companion,
    companionAudioUrl: companion.startsWith("http") || companion.startsWith("/") ? companion : undefined,
    hostedVideoUrl: extras?.hostedVideoUrl,
    youtubeVideoId: sermon.id,
    publishedAt: extras?.publishedAt ?? sermon.publishedAt,
    href: `/sermons?v=${encodeURIComponent(sermon.id)}`,
    resumeKey: `sermon-${sermon.id}`,
  };
}

export function sermonWatchMediaItem(sermon: SermonVideo, companionAudioUrl?: string | null): ShanahMediaItem {
  return {
    id: `sermon-${sermon.id}`,
    kind: "sermon-video",
    title: sermon.title,
    artist: "Shanah City",
    artworkUrl: sermon.thumbnailUrl,
    audioUrl: companionAudioUrl ?? "",
    companionAudioUrl: companionAudioUrl ?? undefined,
    youtubeVideoId: sermon.id,
    publishedAt: sermon.publishedAt,
    href: `/sermons?v=${encodeURIComponent(sermon.id)}`,
    resumeKey: `sermon-${sermon.id}`,
  };
}

export function worshipTrackToShanahMediaItem(options: {
  id: string;
  src: string;
  fileName?: string;
  title: string;
  artist?: string;
  kind?: ShanahMediaKind;
  href?: string;
  hostedVideoUrl?: string;
  preferNativeHostedVideo?: boolean;
  mediaType?: "audio" | "video";
}): ShanahMediaItem | null {
  return worshipRehearsalToShanahMediaItem(options);
}

/** Choir / worship rehearsal uploads (audio-only or video with optional native ExoPlayer on Android). */
export function worshipRehearsalToShanahMediaItem(options: {
  id: string;
  src: string;
  fileName?: string;
  title: string;
  artist?: string;
  kind?: ShanahMediaKind;
  href?: string;
  hostedVideoUrl?: string;
  preferNativeHostedVideo?: boolean;
  mediaType?: "audio" | "video";
}): ShanahMediaItem | null {
  const audioUrl = resolveWorshipAudioUrl(options.src);
  if (!audioUrl) return null;

  const base: ShanahMediaItem = {
    id: options.id,
    kind: options.kind ?? "worship-rehearsal",
    title: options.title,
    artist: options.artist ?? "Shanah Worship",
    audioUrl,
    contentType: inferWorshipAudioContentType(options.fileName ?? options.src),
    href: options.href,
    resumeKey: options.id,
  };

  const isVideo = options.mediaType === "video" || Boolean(options.hostedVideoUrl);
  if (!isVideo) {
    return base;
  }

  const hostedVideoUrl = options.hostedVideoUrl
    ? resolveWorshipAudioUrl(options.hostedVideoUrl)
    : audioUrl;
  const httpsHosted = hostedVideoUrl.startsWith("https://");
  const nameHint = (options.fileName ?? hostedVideoUrl).toLowerCase();
  const preferNative =
    options.preferNativeHostedVideo ??
    (httpsHosted && /\.(mp4|m4v|mov)(\?|#|$)/i.test(nameHint));

  return {
    ...base,
    hostedVideoUrl,
    companionAudioUrl: httpsHosted ? audioUrl : undefined,
    preferNativeHostedVideo: preferNative,
  };
}

export const SHANAH_MEDIA_START_EVENT = "shanah-media-start";
export const DEVOTION_PLAYBACK_START_EVENT = "devotion-playback-start";

export function notifyShanahMediaStarting() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(SHANAH_MEDIA_START_EVENT));
}

export function notifyDevotionPlaybackStarting() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(DEVOTION_PLAYBACK_START_EVENT));
}
