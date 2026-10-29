export const COMMUNITY_IMAGE_MAX_BYTES = 12 * 1024 * 1024;
export const COMMUNITY_VIDEO_MAX_BYTES = 100 * 1024 * 1024;
export const COMMUNITY_VIDEO_MAX_DURATION_SEC = 90;
export const COMMUNITY_AUDIO_MAX_BYTES = 15 * 1024 * 1024;
/** Max length for member-recorded story overlay audio (photo/text stories). */
export const COMMUNITY_STORY_OVERLAY_AUDIO_MAX_SEC = 20;
export const COMMUNITY_STATUS_HOURS = 24;

export const COMMUNITY_IMAGE_CONTENT_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
  "application/octet-stream",
] as const;

export const COMMUNITY_VIDEO_CONTENT_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-m4v",
  "video/3gpp",
  "video/3gpp2",
  "application/octet-stream",
] as const;

export const COMMUNITY_AUDIO_CONTENT_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/x-m4a",
  "audio/m4a",
  "audio/aac",
  "audio/wav",
  "audio/x-wav",
  "audio/ogg",
  "audio/webm",
  "audio/x-caf",
  "audio/caf",
  "application/octet-stream",
] as const;

function lowerName(name: string) {
  return name.toLowerCase();
}

/** Strip codec parameters (`audio/webm;codecs=opus` → `audio/webm`). */
export function normalizeCommunityFileMime(fileType: string | undefined): string {
  if (!fileType?.trim()) return "";
  return fileType.split(";")[0]?.trim().toLowerCase() ?? "";
}

function fileMimeBase(file: File) {
  return normalizeCommunityFileMime(file.type);
}

/** Mic story recordings use this filename prefix from CommunityStoryMemberAudioPanel. */
export function isStoryVoiceRecordingFileName(name: string) {
  return /^story-recording-\d+\.[a-z0-9]+$/i.test(name.trim());
}

export function isCommunityImageName(name: string) {
  const lower = lowerName(name);
  return (
    lower.endsWith(".jpg") ||
    lower.endsWith(".jpeg") ||
    lower.endsWith(".png") ||
    lower.endsWith(".webp") ||
    lower.endsWith(".gif") ||
    lower.endsWith(".heic") ||
    lower.endsWith(".heif")
  );
}

export function isCommunityVideoName(name: string) {
  const lower = lowerName(name);
  return (
    lower.endsWith(".mp4") ||
    lower.endsWith(".webm") ||
    lower.endsWith(".mov") ||
    lower.endsWith(".m4v") ||
    lower.endsWith(".3gp")
  );
}

export function isCommunityAudioName(name: string) {
  const lower = lowerName(name);
  return (
    lower.endsWith(".mp3") ||
    lower.endsWith(".m4a") ||
    lower.endsWith(".aac") ||
    lower.endsWith(".wav") ||
    lower.endsWith(".ogg") ||
    lower.endsWith(".weba") ||
    lower.endsWith(".webm") ||
    lower.endsWith(".caf")
  );
}

export function isCommunityImageFile(file: File) {
  return COMMUNITY_IMAGE_CONTENT_TYPES.includes(file.type as (typeof COMMUNITY_IMAGE_CONTENT_TYPES)[number]) ||
    isCommunityImageName(file.name);
}

export function isCommunityAudioFile(file: File) {
  const base = fileMimeBase(file);
  if (base.startsWith("audio/")) return true;
  if (base === "video/webm" && isStoryVoiceRecordingFileName(file.name)) return true;
  return (
    COMMUNITY_AUDIO_CONTENT_TYPES.includes(base as (typeof COMMUNITY_AUDIO_CONTENT_TYPES)[number]) ||
    isCommunityAudioName(file.name)
  );
}

export function isCommunityVideoFile(file: File) {
  const base = fileMimeBase(file);
  if (base.startsWith("audio/")) return false;
  if (base === "video/webm" && isStoryVoiceRecordingFileName(file.name)) return false;
  return (
    COMMUNITY_VIDEO_CONTENT_TYPES.includes(base as (typeof COMMUNITY_VIDEO_CONTENT_TYPES)[number]) ||
    base.startsWith("video/") ||
    isCommunityVideoName(file.name)
  );
}

/** Match `saveCommunityMedia` order so client direct upload paths agree with server fallback. */
export function inferCommunityMediaType(file: File): "image" | "video" | "audio" | null {
  if (isCommunityImageFile(file)) return "image";
  if (isCommunityAudioFile(file)) return "audio";
  if (isCommunityVideoFile(file)) return "video";
  return null;
}

export function inferCommunityVideoContentType(fileName: string, fileType?: string) {
  if (fileType && COMMUNITY_VIDEO_CONTENT_TYPES.includes(fileType as (typeof COMMUNITY_VIDEO_CONTENT_TYPES)[number])) {
    return fileType;
  }
  const lower = lowerName(fileName);
  if (lower.endsWith(".webm")) return "video/webm";
  if (lower.endsWith(".mov")) return "video/quicktime";
  if (lower.endsWith(".m4v")) return "video/x-m4v";
  if (lower.endsWith(".3gp")) return "video/3gpp";
  return "video/mp4";
}

export function inferCommunityAudioContentType(fileName: string, fileType?: string) {
  const normalizedType = normalizeCommunityFileMime(fileType);
  if (
    normalizedType &&
    (normalizedType.startsWith("audio/") ||
      COMMUNITY_AUDIO_CONTENT_TYPES.includes(normalizedType as (typeof COMMUNITY_AUDIO_CONTENT_TYPES)[number]))
  ) {
    return normalizedType.startsWith("audio/") ? normalizedType : fileType?.split(";")[0]?.trim() ?? normalizedType;
  }
  const baseName = fileName.includes("/") ? (fileName.split("/").pop() ?? fileName) : fileName;
  const lower = lowerName(baseName);
  if (lower.endsWith(".wav")) return "audio/wav";
  if (lower.endsWith(".webm")) return "audio/webm";
  if (lower.endsWith(".ogg") || lower.endsWith(".weba")) return "audio/ogg";
  if (lower.endsWith(".m4a") || lower.endsWith(".aac")) return "audio/mp4";
  if (lower.endsWith(".caf")) return "audio/x-caf";
  return "audio/mpeg";
}

export function inferCommunityImageContentType(fileName: string, fileType?: string) {
  if (fileType && COMMUNITY_IMAGE_CONTENT_TYPES.includes(fileType as (typeof COMMUNITY_IMAGE_CONTENT_TYPES)[number])) {
    return fileType;
  }
  const lower = lowerName(fileName);
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".heic")) return "image/heic";
  if (lower.endsWith(".heif")) return "image/heif";
  return "image/jpeg";
}

export function isAllowedCommunityMediaUrl(url: string) {
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("/uploads/community/")) return true;
  if (trimmed.startsWith("/api/community/media/stream?")) {
    const pathname = trimmed.split("pathname=")[1];
    if (!pathname) return false;
    try {
      const decoded = decodeURIComponent(pathname.split("&")[0] ?? "");
      return decoded.startsWith("community/audio/") || decoded.startsWith("community/images/") || decoded.startsWith("community/videos/");
    } catch {
      return false;
    }
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.pathname.includes("/api/community/media/stream")) {
      const pathname = parsed.searchParams.get("pathname") ?? "";
      return pathname.startsWith("community/audio/") || pathname.startsWith("community/images/") || pathname.startsWith("community/videos/");
    }
    return parsed.protocol === "https:" && parsed.hostname.endsWith(".public.blob.vercel-storage.com");
  } catch {
    return false;
  }
}
