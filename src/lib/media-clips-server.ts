import { promises as fs } from "fs";
import path from "path";
import type { MediaClip } from "@/lib/types";
import { liveVideoConfig } from "@/lib/live-config";
import {
  getYouTubeClipThumbnail,
  getYouTubeClipWatchUrl,
} from "@/lib/media-clips-utils";
import { site } from "@/lib/site";

const CLIPS_FILE = path.join(process.cwd(), "data", "media-clips.json");

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(file, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function clipsFromEnv(): MediaClip[] {
  const raw = process.env.NEXT_PUBLIC_YOUTUBE_CLIP_IDS?.trim();
  if (!raw) return [];

  return raw
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .map((videoId, index) => ({
      id: `youtube-${videoId}`,
      title: `Shanah City clip ${index + 1}`,
      platform: "youtube" as const,
      videoId,
      url: getYouTubeClipWatchUrl(videoId),
      thumbnail: getYouTubeClipThumbnail(videoId),
    }));
}

export async function getMediaClips() {
  const stored = await readJson<MediaClip[]>(CLIPS_FILE, []);
  const fromEnv = clipsFromEnv();

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
