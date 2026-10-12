import { parseYouTubeVideoId } from "@/lib/media-clips-utils";
import { getYouTubeClipThumbnail } from "@/lib/media-clips-utils";

const ALLOWED_HOSTS = [
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtu.be",
  "open.spotify.com",
  "spotify.com",
  "music.apple.com",
  "itunes.apple.com",
];

export function normalizeSongField(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function validateSuggestionMediaUrl(raw: string | undefined | null): {
  ok: boolean;
  normalized?: string;
  youtubeVideoId?: string | null;
  error?: string;
} {
  const trimmed = raw?.trim() ?? "";
  if (!trimmed) {
    return { ok: true, normalized: "", youtubeVideoId: null };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { ok: false, error: "Enter a valid https link." };
  }

  if (parsed.protocol !== "https:") {
    return { ok: false, error: "Only secure https links are allowed." };
  }

  const host = parsed.hostname.toLowerCase();
  const allowed = ALLOWED_HOSTS.some((entry) => host === entry || host.endsWith(`.${entry}`));
  if (!allowed) {
    return {
      ok: false,
      error: "Use YouTube, Spotify, or Apple Music links.",
    };
  }

  const youtubeVideoId = parseYouTubeVideoId(trimmed);
  return { ok: true, normalized: parsed.toString(), youtubeVideoId };
}

export function suggestionThumbnailUrl(suggestion: {
  youtubeVideoId?: string | null;
  mediaUrl?: string | null;
}): string | null {
  if (suggestion.youtubeVideoId) {
    return getYouTubeClipThumbnail(suggestion.youtubeVideoId);
  }
  return null;
}

export function choirSongSuggestionStatusLabel(status: string) {
  switch (status) {
    case "submitted":
      return "Submitted";
    case "under_review":
      return "Under Review";
    case "approved":
      return "Approved";
    case "added_to_library":
      return "Added to Library";
    case "declined":
      return "Declined";
    case "needs_more_info":
      return "Needs More Info";
    case "withdrawn":
      return "Withdrawn";
    default:
      return status;
  }
}
