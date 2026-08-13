import type { MediaClip } from "@/lib/types";
import { liveVideoConfig } from "@/lib/live-config";
import { site } from "@/lib/site";
import { useDatabase } from "@/lib/use-database";
import * as mediaClipsDb from "@/lib/stores/media-clips-db";
import * as mediaClipsJson from "@/lib/stores/media-clips-json";

const store = () => (useDatabase() ? mediaClipsDb : mediaClipsJson);

export const getMediaClips = () => store().getMediaClips();
export const addMediaClip = (clip: MediaClip) => store().addMediaClip(clip);

export async function listMediaClips() {
  const stored = await getMediaClips();
  const fromEnv = mediaClipsJson.clipsFromEnv();

  const byId = new Map<string, MediaClip>();
  for (const clip of [...stored, ...fromEnv]) {
    byId.set(clip.id, clip);
  }

  return [...byId.values()].sort((a, b) => {
    const aTime = a.publishedAt ? Date.parse(a.publishedAt) : 0;
    const bTime = b.publishedAt ? Date.parse(b.publishedAt) : 0;
    return bTime - aTime;
  });
}

export async function publishYouTubeClip(input: { title: string; videoId: string }) {
  const clip = mediaClipsJson.buildYouTubeClip(input);
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
