import { prisma } from "@/lib/db";
import type { MediaClip } from "@/lib/types";
import {
  buildYouTubeClip,
  clipsFromEnv,
} from "@/lib/stores/media-clips-json";

function mapClip(record: {
  id: string;
  title: string;
  platform: string;
  url: string;
  videoId: string | null;
  thumbnail: string | null;
  publishedAt: Date | null;
}): MediaClip {
  return {
    id: record.id,
    title: record.title,
    platform: record.platform as MediaClip["platform"],
    url: record.url,
    videoId: record.videoId ?? undefined,
    thumbnail: record.thumbnail ?? undefined,
    publishedAt: record.publishedAt?.toISOString(),
  };
}

export async function getMediaClips() {
  const records = await prisma.mediaClip.findMany({
    orderBy: { publishedAt: "desc" },
  });
  return records.map(mapClip);
}

export async function addMediaClip(clip: MediaClip) {
  const record = await prisma.mediaClip.upsert({
    where: { id: clip.id },
    create: {
      id: clip.id,
      title: clip.title,
      platform: clip.platform,
      url: clip.url,
      videoId: clip.videoId ?? null,
      thumbnail: clip.thumbnail ?? null,
      publishedAt: clip.publishedAt ? new Date(clip.publishedAt) : new Date(),
    },
    update: {
      title: clip.title,
      platform: clip.platform,
      url: clip.url,
      videoId: clip.videoId ?? null,
      thumbnail: clip.thumbnail ?? null,
      publishedAt: clip.publishedAt ? new Date(clip.publishedAt) : new Date(),
    },
  });

  return mapClip(record);
}

export { buildYouTubeClip, clipsFromEnv };
