/** Playback segments for licensed audio in member Stories. */
export type StoryMusicClipDuration = 30 | 60;

export const STORY_MUSIC_DEFAULT_CLIP_SEC: StoryMusicClipDuration = 30;
export const STORY_MUSIC_MAX_START_SEC = 3600;

export function normalizeStoryMusicClipDuration(input: unknown): StoryMusicClipDuration {
  return input === 60 || input === "60" ? 60 : 30;
}

export function normalizeStoryMusicClipStart(input: unknown, fallback = 0): number {
  const value = typeof input === "number" || typeof input === "string" ? Number(input) : NaN;
  if (!Number.isFinite(value) || value < 0) return Math.max(0, Math.floor(fallback));
  return Math.min(STORY_MUSIC_MAX_START_SEC, Math.floor(value));
}

export function storyMusicClipEnd(startSeconds: number, durationSec: StoryMusicClipDuration): number {
  return normalizeStoryMusicClipStart(startSeconds) + normalizeStoryMusicClipDuration(durationSec);
}

/** Latest second a clip can start while fully inside the track (inclusive). */
export function maxStoryMusicClipStart(
  trackDurationSec: number | null | undefined,
  clipDurationSec: StoryMusicClipDuration,
): number {
  const clip = normalizeStoryMusicClipDuration(clipDurationSec);
  if (trackDurationSec == null || !Number.isFinite(trackDurationSec) || trackDurationSec <= 0) {
    return Math.max(0, STORY_MUSIC_MAX_START_SEC - clip);
  }
  return Math.max(0, Math.floor(trackDurationSec) - clip);
}

export function clampStoryMusicClipStartForTrack(
  startSeconds: number,
  clipDurationSec: StoryMusicClipDuration,
  trackDurationSec?: number | null,
  fallback = 0,
): number {
  const normalized = normalizeStoryMusicClipStart(startSeconds, fallback);
  const maxStart = maxStoryMusicClipStart(trackDurationSec, clipDurationSec);
  if (trackDurationSec != null && trackDurationSec > 0) {
    return Math.min(normalized, maxStart);
  }
  return normalized;
}

export function clipStartOffsetRatio(
  startSeconds: number,
  trackDurationSec: number,
  clipDurationSec: StoryMusicClipDuration,
): number {
  if (!Number.isFinite(trackDurationSec) || trackDurationSec <= 0) return 0;
  const maxStart = maxStoryMusicClipStart(trackDurationSec, clipDurationSec);
  if (maxStart <= 0) return 0;
  const start = clampStoryMusicClipStartForTrack(startSeconds, clipDurationSec, trackDurationSec);
  return start / maxStart;
}

export function clipStartFromTimelineRatio(
  ratio: number,
  trackDurationSec: number,
  clipDurationSec: StoryMusicClipDuration,
): number {
  const maxStart = maxStoryMusicClipStart(trackDurationSec, clipDurationSec);
  const clamped = Math.min(1, Math.max(0, ratio));
  return clampStoryMusicClipStartForTrack(Math.round(clamped * maxStart), clipDurationSec, trackDurationSec);
}

/** Width of the clip window as a fraction of the full track (0–1). */
export function clipWindowWidthRatio(
  trackDurationSec: number | null | undefined,
  clipDurationSec: StoryMusicClipDuration,
): number {
  if (trackDurationSec == null || !Number.isFinite(trackDurationSec) || trackDurationSec <= 0) {
    return 0.25;
  }
  return Math.min(1, normalizeStoryMusicClipDuration(clipDurationSec) / trackDurationSec);
}

export function clipWindowLeftRatio(
  startSeconds: number,
  trackDurationSec: number,
  clipDurationSec: StoryMusicClipDuration,
): number {
  if (!Number.isFinite(trackDurationSec) || trackDurationSec <= 0) return 0;
  const start = clampStoryMusicClipStartForTrack(startSeconds, clipDurationSec, trackDurationSec);
  return Math.min(1, start / trackDurationSec);
}

/** Re-clamp start when clip length or track duration changes (e.g. 30s → 60s). */
export function adjustStoryMusicClipStartForDurationChange(
  startSeconds: number,
  nextClipDurationSec: StoryMusicClipDuration,
  trackDurationSec?: number | null,
): number {
  return clampStoryMusicClipStartForTrack(startSeconds, nextClipDurationSec, trackDurationSec);
}

export function pointerXToClipStart(
  clientX: number,
  trackLeft: number,
  trackWidth: number,
  trackDurationSec: number,
  clipDurationSec: StoryMusicClipDuration,
): number {
  if (trackWidth <= 0 || !Number.isFinite(trackDurationSec) || trackDurationSec <= 0) {
    return 0;
  }
  const windowWidthRatio = clipWindowWidthRatio(trackDurationSec, clipDurationSec);
  const windowPx = trackWidth * windowWidthRatio;
  const maxLeft = Math.max(0, trackWidth - windowPx);
  const rawLeft = clientX - trackLeft - windowPx / 2;
  const clampedLeft = Math.min(maxLeft, Math.max(0, rawLeft));
  const ratio = maxLeft > 0 ? clampedLeft / maxLeft : 0;
  return clipStartFromTimelineRatio(ratio, trackDurationSec, clipDurationSec);
}
