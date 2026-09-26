const RECORDER_MIME_CANDIDATES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/aac",
  "video/webm;codecs=opus",
  "video/webm",
] as const;

const RECORDER_MIME_CANDIDATES_APPLE = [
  "audio/mp4",
  "audio/aac",
  "audio/webm;codecs=opus",
  "audio/webm",
] as const;

function prefersAppleFriendlyRecording() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return true;
  return /\bSafari\//.test(ua) && !/Chrome|Chromium|CriOS|FxiOS|EdgiOS/i.test(ua);
}

export function pickMediaRecorderMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = prefersAppleFriendlyRecording()
    ? RECORDER_MIME_CANDIDATES_APPLE
    : RECORDER_MIME_CANDIDATES;
  for (const candidate of candidates) {
    if (MediaRecorder.isTypeSupported(candidate)) return candidate;
  }
  return "";
}

export function extensionForRecorderMime(mimeType: string) {
  const base = mimeType.split(";")[0]?.trim().toLowerCase() ?? "";
  if (base.includes("mp4") || base.includes("aac")) return ".m4a";
  if (base.includes("mpeg")) return ".mp3";
  if (base.includes("ogg")) return ".ogg";
  return ".webm";
}

export function inferWorshipAudioContentType(fileNameOrUrl: string, fileType?: string) {
  const normalizedType = fileType?.split(";")[0]?.trim().toLowerCase();
  if (
    normalizedType &&
    (normalizedType.startsWith("audio/") || normalizedType === "video/webm")
  ) {
    return fileType ?? normalizedType;
  }

  const lower = fileNameOrUrl.toLowerCase();
  if (lower.includes(".wav")) return "audio/wav";
  if (lower.includes(".ogg") || lower.includes(".weba")) return "audio/ogg";
  if (lower.includes(".m4a") || lower.includes(".aac") || lower.includes(".mp4")) {
    return "audio/mp4";
  }
  if (lower.includes(".mp3")) return "audio/mpeg";
  if (lower.includes(".webm")) return "audio/webm";
  return "audio/mpeg";
}

/** Resolve plan-relative upload paths against the current origin (Capacitor / PWA). */
export function resolveWorshipAudioUrl(url: string) {
  if (!url?.trim()) return "";
  const trimmed = url.trim();
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("data:")
  ) {
    return trimmed;
  }
  if (typeof window !== "undefined") {
    try {
      return new URL(trimmed, window.location.origin).href;
    } catch {
      return trimmed;
    }
  }
  return trimmed;
}
