import { readFileSync } from "node:fs";
import path from "node:path";

type PipedStreamResponse = {
  audioStreams?: { url?: string; mimeType?: string; bitrate?: number }[];
};

const PIPED_API_BASES = [
  process.env.PIPED_API_BASE?.trim(),
  "https://pipedapi.kavin.rocks",
  "https://pipedapi.adminforge.de",
  "https://api.piped.yt",
  "https://pipedapi.tokhmi.xyz",
  "https://pipedapi.moomoo.me",
  "https://pipedapi.leptons.xyz",
].filter((value): value is string => Boolean(value));

const INVIDIOUS_API_BASES = [
  "https://yewtu.be",
  "https://inv.nadeko.net",
  "https://invidious.jing.rocks",
  "https://invidious.privacyredirect.com",
  "https://invidious.fdn.fr",
];

export type SermonAudioPlaybackResolution =
  | { kind: "direct"; url: string }
  | { kind: "proxy"; upstreamUrl: string };

let overrideMapCache: Record<string, string> | null = null;

function loadSermonAudioOverrides(): Record<string, string> {
  if (overrideMapCache) return overrideMapCache;

  const fromEnv = process.env.SERMON_AUDIO_OVERRIDES?.trim();
  if (fromEnv) {
    try {
      const parsed = JSON.parse(fromEnv) as Record<string, string>;
      overrideMapCache = Object.fromEntries(
        Object.entries(parsed).filter(([key, url]) => key.length === 11 && typeof url === "string" && url.startsWith("http")),
      );
      return overrideMapCache;
    } catch {
      overrideMapCache = {};
      return overrideMapCache;
    }
  }

  try {
    const filePath = path.join(process.cwd(), "data", "sermon-audio.json");
    const raw = readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw) as Record<string, string>;
    overrideMapCache = Object.fromEntries(
      Object.entries(parsed).filter(
        ([key, url]) =>
          !key.startsWith("_") &&
          /^[a-zA-Z0-9_-]{11}$/.test(key) &&
          typeof url === "string" &&
          url.trim().startsWith("http"),
      ),
    );
  } catch {
    overrideMapCache = {};
  }

  return overrideMapCache;
}

function getSermonAudioOverride(videoId: string): string | null {
  const url = loadSermonAudioOverrides()[videoId];
  return url?.trim() || null;
}

async function fetchAudioFromInvidious(base: string, videoId: string): Promise<string | null> {
  const response = await fetch(
    `${base.replace(/\/$/, "")}/api/v1/videos/${encodeURIComponent(videoId)}`,
    {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(14_000),
    },
  );
  if (!response.ok) return null;

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
  return audioFormats[0]?.url ?? null;
}

async function fetchAudioFromPiped(base: string, videoId: string): Promise<string | null> {
  const response = await fetch(`${base.replace(/\/$/, "")}/streams/${encodeURIComponent(videoId)}`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(14_000),
  });
  if (!response.ok) return null;

  const data = (await response.json()) as PipedStreamResponse;
  const streams = data.audioStreams ?? [];
  const sorted = [...streams].sort((a, b) => (b.bitrate ?? 0) - (a.bitrate ?? 0));
  const pick =
    sorted.find((stream) => stream.url && stream.mimeType?.startsWith("audio/")) ??
    sorted.find((stream) => stream.url);
  return pick?.url ?? null;
}

async function raceYoutubeAudioStreamUrl(videoId: string): Promise<string | null> {
  const attempts: Promise<string>[] = [];

  for (const base of PIPED_API_BASES) {
    attempts.push(
      fetchAudioFromPiped(base, videoId).then((url) => {
        if (!url) throw new Error("miss");
        return url;
      }),
    );
  }
  for (const base of INVIDIOUS_API_BASES) {
    attempts.push(
      fetchAudioFromInvidious(base, videoId).then((url) => {
        if (!url) throw new Error("miss");
        return url;
      }),
    );
  }

  if (attempts.length === 0) return null;

  try {
    return await Promise.any(attempts);
  } catch {
    return null;
  }
}

/** Resolves sermon listen audio: church-hosted file first, then proxied YouTube stream. */
export async function resolveSermonAudioPlayback(
  youtubeVideoId: string,
): Promise<SermonAudioPlaybackResolution | null> {
  const id = youtubeVideoId.trim();
  if (!/^[a-zA-Z0-9_-]{11}$/.test(id)) return null;

  const override = getSermonAudioOverride(id);
  if (override) {
    return { kind: "direct", url: override };
  }

  const upstream = await raceYoutubeAudioStreamUrl(id);
  if (!upstream) return null;

  return { kind: "proxy", upstreamUrl: upstream };
}

/** Used by /api/sermons/stream to pipe bytes from upstream. */
export async function resolveSermonStreamUpstream(youtubeVideoId: string): Promise<string | null> {
  const id = youtubeVideoId.trim();
  if (!/^[a-zA-Z0-9_-]{11}$/.test(id)) return null;

  const override = getSermonAudioOverride(id);
  if (override) return override;

  return raceYoutubeAudioStreamUrl(id);
}
