import type { ShanahMediaItem, ShanahMediaKind } from "@/lib/shanah-media-types";
import type { SermonVideo } from "@/lib/youtube-sermons-shared";
import {
  inferWorshipAudioContentType,
  resolveWorshipAudioUrl,
} from "@/lib/worship-audio-shared";

export function sermonToShanahMediaItem(sermon: SermonVideo, audioUrl: string): ShanahMediaItem {
  return {
    id: `sermon-${sermon.id}`,
    kind: "sermon-audio",
    title: sermon.title,
    artist: "Shanah City",
    artworkUrl: sermon.thumbnailUrl,
    audioUrl,
    href: "/sermons",
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
}): ShanahMediaItem | null {
  const audioUrl = resolveWorshipAudioUrl(options.src);
  if (!audioUrl) return null;
  return {
    id: options.id,
    kind: options.kind ?? "worship-rehearsal",
    title: options.title,
    artist: options.artist ?? "Shanah Worship",
    audioUrl,
    contentType: inferWorshipAudioContentType(options.fileName ?? options.src),
    href: options.href,
    resumeKey: options.id,
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
