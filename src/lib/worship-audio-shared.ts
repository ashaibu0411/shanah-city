const RECORDER_MIME_CANDIDATES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/aac",
  "audio/ogg;codecs=opus",
  "audio/ogg",
] as const;

const RECORDER_MIME_CANDIDATES_APPLE = [
  "audio/mp4",
  "audio/aac",
  "audio/webm;codecs=opus",
  "audio/webm",
] as const;

/** Opus voice/music capture — avoids browser default ultra-low bitrates on some paths. */
const OPUS_AUDIO_BITS_PER_SECOND = 128_000;

function prefersAppleFriendlyRecording() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return true;
  return /\bSafari\//.test(ua) && !/Chrome|Chromium|CriOS|FxiOS|EdgiOS/i.test(ua);
}

/**
 * Natural voice/singing capture: disable real-time DSP that often sounds robotic on music.
 * Do not force sampleRate/channelCount — unsupported values break getUserMedia on some devices.
 */
export function worshipRecordingAudioConstraints(): MediaTrackConstraints {
  return {
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false,
  };
}

/** Mic stream for worship/choir in-app recording (shared across hooks and panels). */
export async function getWorshipRecordingMediaStream(): Promise<MediaStream> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    throw new Error("Recording is not supported in this browser.");
  }
  const constraints = worshipRecordingAudioConstraints();
  try {
    return await navigator.mediaDevices.getUserMedia({ audio: constraints });
  } catch {
    return await navigator.mediaDevices.getUserMedia({ audio: true });
  }
}

export function isMediaRecorderSupported() {
  return typeof MediaRecorder !== "undefined";
}

export function pickMediaRecorderMimeType(): string {
  if (!isMediaRecorderSupported()) return "";
  const candidates = prefersAppleFriendlyRecording()
    ? RECORDER_MIME_CANDIDATES_APPLE
    : RECORDER_MIME_CANDIDATES;
  for (const candidate of candidates) {
    if (MediaRecorder.isTypeSupported(candidate)) return candidate;
  }
  return "";
}

function mediaRecorderOptionsForMime(mimeType: string): MediaRecorderOptions {
  const options: MediaRecorderOptions = { mimeType };
  if (mimeType.includes("opus") && typeof OPUS_AUDIO_BITS_PER_SECOND === "number") {
    options.audioBitsPerSecond = OPUS_AUDIO_BITS_PER_SECOND;
  }
  return options;
}

/** Create a MediaRecorder for mic capture; tries mime fallbacks (Safari/iOS can reject the first type). */
export function createAudioMediaRecorder(stream: MediaStream): MediaRecorder {
  if (!isMediaRecorderSupported()) {
    throw new Error("MediaRecorder is not available in this browser.");
  }

  const preferred = pickMediaRecorderMimeType();
  const attempts = preferred
    ? [preferred, ...RECORDER_MIME_CANDIDATES.filter((entry) => entry !== preferred)]
    : [...RECORDER_MIME_CANDIDATES];

  for (const mimeType of attempts) {
    if (mimeType && !MediaRecorder.isTypeSupported(mimeType)) continue;
    try {
      if (mimeType) {
        return new MediaRecorder(stream, mediaRecorderOptionsForMime(mimeType));
      }
      return new MediaRecorder(stream);
    } catch {
      continue;
    }
  }

  return new MediaRecorder(stream);
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

/** @internal Tests — audio-only mime list (no video/webm containers). */
export function worshipRecorderMimeCandidatesForTests() {
  return [...RECORDER_MIME_CANDIDATES];
}
