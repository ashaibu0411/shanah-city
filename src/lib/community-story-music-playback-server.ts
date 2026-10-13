import { unstable_cache } from "next/cache";

type PipedStreamResponse = {
  audioStreams?: { url?: string; mimeType?: string; bitrate?: number }[];
};

const PIPED_API_BASES = [
  process.env.PIPED_API_BASE?.trim(),
  "https://pipedapi.kavin.rocks",
  "https://pipedapi.adminforge.de",
].filter((value): value is string => Boolean(value));

const INVIDIOUS_API_BASES = [
  "https://inv.nadeko.net",
  "https://invidious.jing.rocks",
  "https://invidious.privacyredirect.com",
];

async function fetchAudioStreamUrlFromInvidious(videoId: string): Promise<string | null> {
  for (const base of INVIDIOUS_API_BASES) {
    try {
      const response = await fetch(
        `${base.replace(/\/$/, "")}/api/v1/videos/${encodeURIComponent(videoId)}`,
        {
          headers: { Accept: "application/json" },
          signal: AbortSignal.timeout(12_000),
        },
      );
      if (!response.ok) continue;

      const data = (await response.json()) as {
        adaptiveFormats?: { url?: string; type?: string; bitrate?: string }[];
      };
      const formats = data.adaptiveFormats ?? [];
      const audioFormats = formats.filter(
        (format) => format.url && format.type?.toLowerCase().startsWith("audio/"),
      );
      audioFormats.sort(
        (a, b) => Number.parseInt(b.bitrate ?? "0", 10) - Number.parseInt(a.bitrate ?? "0", 10),
      );
      if (audioFormats[0]?.url) return audioFormats[0].url;
    } catch {
      continue;
    }
  }
  return null;
}

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

async function fetchAudioStreamUrl(videoId: string): Promise<string | null> {
  const fromPiped = await fetchAudioStreamUrlFromPiped(videoId);
  if (fromPiped) return fromPiped;
  return fetchAudioStreamUrlFromInvidious(videoId);
}

export async function resolveStoryMusicAudioStreamUrl(youtubeVideoId: string) {
  const id = youtubeVideoId.trim();
  if (!id) return null;

  return unstable_cache(
    async () => fetchAudioStreamUrl(id),
    ["community-story-music-audio-stream", id],
    { revalidate: 60 * 15 },
  )();
}
