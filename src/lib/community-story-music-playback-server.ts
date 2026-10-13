import { unstable_cache } from "next/cache";

type PipedStreamResponse = {
  audioStreams?: { url?: string; mimeType?: string; bitrate?: number }[];
};

const PIPED_API_BASES = [
  process.env.PIPED_API_BASE?.trim(),
  "https://pipedapi.kavin.rocks",
  "https://pipedapi.adminforge.de",
].filter((value): value is string => Boolean(value));

async function fetchAudioStreamUrlFromPiped(videoId: string): Promise<string | null> {
  for (const base of PIPED_API_BASES) {
    try {
      const response = await fetch(`${base.replace(/\/$/, "")}/streams/${encodeURIComponent(videoId)}`, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(12_000),
      });
      if (!response.ok) continue;

      const data = (await response.json()) as PipedStreamResponse;
      const streams = data.audioStreams ?? [];
      const sorted = [...streams].sort((a, b) => (b.bitrate ?? 0) - (a.bitrate ?? 0));
      const pick =
        sorted.find((stream) => stream.url && stream.mimeType?.startsWith("audio/")) ??
        sorted.find((stream) => stream.url);
      if (pick?.url) return pick.url;
    } catch {
      continue;
    }
  }
  return null;
}

export async function resolveStoryMusicAudioStreamUrl(youtubeVideoId: string) {
  const id = youtubeVideoId.trim();
  if (!id) return null;

  return unstable_cache(
    async () => fetchAudioStreamUrlFromPiped(id),
    ["community-story-music-audio-stream", id],
    { revalidate: 60 * 60 * 6 },
  )();
}
