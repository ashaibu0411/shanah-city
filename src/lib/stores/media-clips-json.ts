import { promises as fs } from "fs";
import path from "path";
import type { MediaClip } from "@/lib/types";
import {
  getYouTubeClipThumbnail,
  getYouTubeClipWatchUrl,
} from "@/lib/media-clips-utils";

const CLIPS_FILE = path.join(process.cwd(), "data", "media-clips.json");

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(file, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson<T>(file: string, data: T) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2));
}

function sortClips(clips: MediaClip[]) {
  return [...clips].sort((a, b) => {
    const aTime = a.publishedAt ? Date.parse(a.publishedAt) : 0;
    const bTime = b.publishedAt ? Date.parse(b.publishedAt) : 0;
    return bTime - aTime;
  });
}

export async function getMediaClips() {
  return readJson<MediaClip[]>(CLIPS_FILE, []);
}

export async function addMediaClip(clip: MediaClip) {
  const clips = await getMediaClips();
  const next = sortClips([clip, ...clips.filter((item) => item.id !== clip.id)]);
  await writeJson(CLIPS_FILE, next);
  return clip;
}

export function buildUploadedClip(input: {
  title: string;
  url: string;
  thumbnail?: string;
}): MediaClip {
  const now = new Date().toISOString();
  return {
    id: `upload-${Date.now()}`,
    title: input.title.trim(),
    platform: "upload",
    url: input.url,
    thumbnail: input.thumbnail,
    publishedAt: now,
  };
}

export function buildYouTubeClip(input: {
  videoId: string;
  title: string;
}): MediaClip {
  const now = new Date().toISOString();
  return {
    id: `youtube-${input.videoId}`,
    title: input.title.trim(),
    platform: "youtube",
    videoId: input.videoId,
    url: getYouTubeClipWatchUrl(input.videoId),
    thumbnail: getYouTubeClipThumbnail(input.videoId),
    publishedAt: now,
  };
}

export function clipsFromEnv(): MediaClip[] {
  const raw = process.env.NEXT_PUBLIC_YOUTUBE_CLIP_IDS?.trim();
  if (!raw) return [];

  return raw
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .map((videoId, index) =>
      buildYouTubeClip({
        videoId,
        title: `Shanah City clip ${index + 1}`,
      }),
    );
}
