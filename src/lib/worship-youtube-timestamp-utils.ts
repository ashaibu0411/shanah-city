export function formatMediaTimestamp(totalSeconds: number | undefined | null) {
  if (totalSeconds == null || !Number.isFinite(totalSeconds) || totalSeconds < 0) {
    return "";
  }
  const rounded = Math.floor(totalSeconds);
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);
  const seconds = rounded % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function parseMediaTimestamp(input: string) {
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (/^\d+$/.test(trimmed)) {
    return Number(trimmed);
  }

  const parts = trimmed.split(":").map((part) => part.trim());
  if (parts.some((part) => part === "" || !/^\d+$/.test(part))) {
    return null;
  }

  if (parts.length === 2) {
    const [minutes, seconds] = parts.map(Number);
    return minutes * 60 + seconds;
  }

  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts.map(Number);
    return hours * 3600 + minutes * 60 + seconds;
  }

  return null;
}

export function normalizeTimestampSeconds(value: unknown) {
  if (value == null || value === "") return undefined;
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) return undefined;
  return Math.floor(numeric);
}

export function getYouTubeEmbedUrlWithSegment(
  videoId: string,
  startSeconds?: number,
  endSeconds?: number,
) {
  const params = new URLSearchParams({
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
    enablejsapi: "1",
  });
  if (startSeconds != null && startSeconds >= 0) {
    params.set("start", String(Math.floor(startSeconds)));
  }
  if (endSeconds != null && endSeconds > (startSeconds ?? 0)) {
    params.set("end", String(Math.floor(endSeconds)));
  }
  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}

export function getYouTubeWatchUrlWithSegment(
  videoId: string,
  startSeconds?: number,
  endSeconds?: number,
) {
  const base = `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
  const params = new URLSearchParams();
  if (startSeconds != null && startSeconds >= 0) {
    params.set("t", String(Math.floor(startSeconds)));
  }
  if (endSeconds != null && endSeconds > (startSeconds ?? 0)) {
    params.set("end", String(Math.floor(endSeconds)));
  }
  const query = params.toString();
  return query ? `${base}&${query}` : base;
}

export function formatSegmentRangeLabel(startSeconds?: number, endSeconds?: number) {
  const start = formatMediaTimestamp(startSeconds);
  const end = formatMediaTimestamp(endSeconds);
  if (start && end) return `${start} – ${end}`;
  if (start) return `From ${start}`;
  if (end) return `Until ${end}`;
  return "";
}

/** Evenly divide [0, duration] across songs that share the same YouTube video. */
export function suggestEvenMedleySegments(
  songs: Array<{ id: string; youtubeVideoId?: string }>,
  videoId: string,
  durationSeconds: number,
) {
  const matching = songs.filter((song) => song.youtubeVideoId === videoId);
  if (matching.length === 0 || durationSeconds <= 0) return new Map<string, { start?: number; end?: number }>();

  const slice = durationSeconds / matching.length;
  const updates = new Map<string, { start?: number; end?: number }>();
  matching.forEach((song, index) => {
    const start = Math.floor(index * slice);
    const end = index === matching.length - 1 ? Math.floor(durationSeconds) : Math.floor((index + 1) * slice);
    updates.set(song.id, { start, end });
  });
  return updates;
}

export function suggestStartAfterPreviousSong(
  songs: Array<{ id: string; youtubeVideoId?: string; youtubeEndSeconds?: number; youtubeStartSeconds?: number }>,
  songId: string,
  videoId: string,
) {
  const index = songs.findIndex((song) => song.id === songId);
  if (index <= 0) return undefined;

  for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
    const previous = songs[cursor];
    if (previous.youtubeVideoId !== videoId) continue;
    if (previous.youtubeEndSeconds != null) {
      return previous.youtubeEndSeconds + 1;
    }
    if (previous.youtubeStartSeconds != null) {
      return previous.youtubeStartSeconds + 1;
    }
  }

  return 0;
}
