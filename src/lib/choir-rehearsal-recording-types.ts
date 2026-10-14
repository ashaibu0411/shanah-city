export const CHOIR_REHEARSAL_RECORDING_MAX_BYTES = 512 * 1024 * 1024;

export const CHOIR_REHEARSAL_AUDIO_CONTENT_TYPES = [
  "audio/webm",
  "audio/mp4",
  "audio/mpeg",
  "audio/aac",
  "audio/x-m4a",
  "audio/ogg",
  "video/webm",
] as const;

export const CHOIR_RECORDING_CATEGORIES = [
  "full_rehearsal",
  "song_practice",
  "vocal_practice",
  "instrument_practice",
  "personal",
] as const;

export type ChoirRecordingCategory = (typeof CHOIR_RECORDING_CATEGORIES)[number];

export const CHOIR_RECORDING_VISIBILITY = ["private", "choir_shared", "official"] as const;

export type ChoirRecordingVisibility = (typeof CHOIR_RECORDING_VISIBILITY)[number];

export type ChoirRecordingUploadStatus = "uploading" | "ready" | "failed";

export type ChoirRehearsalLibraryRecording = {
  id: string;
  groupId: string;
  title: string;
  description?: string | null;
  category: ChoirRecordingCategory;
  mediaType: "audio" | "video";
  audioUrl: string;
  fileName: string;
  fileSizeBytes?: number | null;
  durationSeconds?: number | null;
  visibility: ChoirRecordingVisibility;
  uploadStatus: ChoirRecordingUploadStatus;
  recordedBy: string;
  recordedByName: string;
  serviceDate?: string | null;
  serviceTime?: string | null;
  songId?: string | null;
  vocalPart?: string | null;
  instrumentRole?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
};

export function choirRecordingCategoryLabel(category: ChoirRecordingCategory) {
  switch (category) {
    case "full_rehearsal":
      return "Full rehearsal";
    case "song_practice":
      return "Song practice";
    case "vocal_practice":
      return "Vocal practice";
    case "instrument_practice":
      return "Instrument practice";
    case "personal":
      return "Personal practice";
    default:
      return category;
  }
}

export function defaultChoirRecordingTitle(category: ChoirRecordingCategory, date = new Date()) {
  const label = choirRecordingCategoryLabel(category);
  const formatted = date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  return `${label} — ${formatted}`;
}

export function formatRecordingDurationHms(totalSeconds?: number | null) {
  if (!totalSeconds || !Number.isFinite(totalSeconds) || totalSeconds < 0) return "0:00:00";
  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = Math.floor(totalSeconds % 60);
  return `${hours}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}
