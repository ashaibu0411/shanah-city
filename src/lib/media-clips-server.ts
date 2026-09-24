import type { MediaClip } from "@/lib/types";
import { liveVideoConfig } from "@/lib/live-config";
import {
  normalizeYouTubeMediaClip,
} from "@/lib/media-clips-utils";
import { site } from "@/lib/site";
import { useDatabase } from "@/lib/use-database";
import * as mediaClipsDb from "@/lib/stores/media-clips-db";
import * as mediaClipsJson from "@/lib/stores/media-clips-json";
import { getChannelYouTubeShorts } from "@/lib/youtube-shorts-server";

const store = () => (useDatabase() ? mediaClipsDb : mediaClipsJson);

export const getMediaClips = () => store().getMediaClips();
export const addMediaClip = (clip: MediaClip) => store().addMediaClip(clip);

function withNormalizedYouTube(clip: MediaClip): MediaClip {
  const normalized = normalizeYouTubeMediaClip(clip);
  if (!normalized.videoId || normalized.videoId === clip.videoId) {
    return clip.thumbnail === normalized.thumbnail
      ? clip
      : { ...clip, thumbnail: normalized.thumbnail ?? clip.thumbnail };
  }
  return {
    ...clip,
    videoId: normalized.videoId,
    thumbnail: normalized.thumbnail ?? clip.thumbnail,
  };
}

async function clipsFromYouTubeShorts(limit = 12): Promise<MediaClip[]> {
  try {
    const shorts = await getChannelYouTubeShorts(limit);
    return shorts.map((short) =>
      withNormalizedYouTube(
        mediaClipsJson.buildYouTubeClip({
          videoId: short.videoId,
          title: short.title,
          publishedAt: short.publishedAt,
        }),
      ),
    );
  } catch {
    return [];
  }
}

export async function listMediaClips() {
  const stored = await getMediaClips();
  const fromEnv = mediaClipsJson.clipsFromEnv();
  const fromChannel = await clipsFromYouTubeShorts();

  const byId = new Map<string, MediaClip>();
  for (const clip of fromChannel) {
    byId.set(clip.id, withNormalizedYouTube(clip));
  }
  for (const clip of fromEnv) {
    byId.set(clip.id, withNormalizedYouTube(clip));
  }
  for (const clip of stored) {
    byId.set(clip.id, withNormalizedYouTube(clip));
  }

  return [...byId.values()].sort((a, b) => {
    const aTime = a.publishedAt ? Date.parse(a.publishedAt) : 0;
    const bTime = b.publishedAt ? Date.parse(b.publishedAt) : 0;
    return bTime - aTime;
  });
}

export async function publishYouTubeClip(input: { title: string; videoId: string }) {
  const clip = mediaClipsJson.buildYouTubeClip({
    ...input,
    publishedAt: new Date().toISOString(),
  });
  return addMediaClip(clip);
}

export async function publishUploadedClip(input: {
  title: string;
  url: string;
  thumbnail?: string;
}) {
  const clip = mediaClipsJson.buildUploadedClip(input);
  return addMediaClip(clip);
}

export function getMediaBrowseLinks() {
  const channelId = liveVideoConfig.youtubeChannelId;
  const youtubeShortsUrl = channelId
    ? `https://www.youtube.com/channel/${channelId}/shorts`
    : `${site.social.youtube}/shorts`;

  return [
    {
      id: "youtube-shorts",
      label: "YouTube Shorts",
      url: youtubeShortsUrl,
      platform: "YouTube",
    },
    ...site.social.instagram.map((account) => ({
      id: `instagram-${account.handle}`,
      label: `@${account.handle} Reels`,
      url: account.url,
      platform: "Instagram",
    })),
  ];
}
