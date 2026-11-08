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

/** Seconds actually played when the track ends before the nominal clip length. */
export function storyMusicClipPlaybackEndSeconds(
  startSeconds: number,
  clipDurationSec: StoryMusicClipDuration,
  trackDurationSec?: number | null,
): number {
  const start = normalizeStoryMusicClipStart(startSeconds);
  const nominalEnd = storyMusicClipEnd(start, clipDurationSec);
  if (trackDurationSec == null || !Number.isFinite(trackDurationSec) || trackDurationSec <= 0) {
    return nominalEnd;
  }
  return Math.min(nominalEnd, Math.floor(trackDurationSec));
}

export function storyMusicClipPlaybackDurationSec(
  startSeconds: number,
  clipDurationSec: StoryMusicClipDuration,
  trackDurationSec?: number | null,
): number {
  const start = clampStoryMusicClipStartForTrack(startSeconds, clipDurationSec, trackDurationSec);
  const end = storyMusicClipPlaybackEndSeconds(start, clipDurationSec, trackDurationSec);
  return Math.max(0, end - start);
}

/** Whether the full 30s or 60s window fits anywhere on the track (not required for short-song playback). */
export function storyMusicClipDurationSelectable(
  clipDurationSec: StoryMusicClipDuration,
  trackDurationSec: number,
): boolean {
  if (!Number.isFinite(trackDurationSec) || trackDurationSec <= 0) return true;
  const clip = normalizeStoryMusicClipDuration(clipDurationSec);
  if (clip === 30) return true;
  return Math.floor(trackDurationSec) >= clip;
}

export const STORY_MUSIC_MIN_CLIP_PLAYBACK_SEC = 3;

export function storyMusicClipPublishable(
  startSeconds: number,
  clipDurationSec: StoryMusicClipDuration,
  trackDurationSec: number,
): boolean {
  if (!Number.isFinite(trackDurationSec) || trackDurationSec <= 0) return true;
  return (
    storyMusicClipPlaybackDurationSec(startSeconds, clipDurationSec, trackDurationSec) >=
    STORY_MUSIC_MIN_CLIP_PLAYBACK_SEC
  );
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

export function clipWindowMaxLeftPx(trackWidth: number, trackDurationSec: number, clipDurationSec: StoryMusicClipDuration) {
  const windowPx = trackWidth * clipWindowWidthRatio(trackDurationSec, clipDurationSec);
  return Math.max(0, trackWidth - windowPx);
}

export function clipWindowLeftPx(
  startSeconds: number,
  trackWidth: number,
  trackDurationSec: number,
  clipDurationSec: StoryMusicClipDuration,
): number {
  if (trackWidth <= 0 || trackDurationSec <= 0) return 0;
  const start = clampStoryMusicClipStartForTrack(startSeconds, clipDurationSec, trackDurationSec);
  const maxLeft = clipWindowMaxLeftPx(trackWidth, trackDurationSec, clipDurationSec);
  const ideal = (start / trackDurationSec) * trackWidth;
  return Math.min(maxLeft, Math.max(0, ideal));
}

export function clipStartFromWindowLeftPx(
  windowLeftPx: number,
  trackWidth: number,
  trackDurationSec: number,
  clipDurationSec: StoryMusicClipDuration,
): number {
  if (trackWidth <= 0 || trackDurationSec <= 0) return 0;
  const maxLeft = clipWindowMaxLeftPx(trackWidth, trackDurationSec, clipDurationSec);
  const clampedLeft = Math.min(maxLeft, Math.max(0, windowLeftPx));
  const ratio = maxLeft > 0 ? clampedLeft / maxLeft : 0;
  return clipStartFromTimelineRatio(ratio, trackDurationSec, clipDurationSec);
}

/** Tap on rail: place clip window under the pointer (centered). */
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
  const rawLeft = clientX - trackLeft - windowPx / 2;
  return clipStartFromWindowLeftPx(rawLeft, trackWidth, trackDurationSec, clipDurationSec);
}

/** Offset from pointer down to the clip window's left edge within the rail (preserves grab point). */
export function computeDragGrabOffsetPx(
  clientX: number,
  trackLeft: number,
  trackWidth: number,
  startSeconds: number,
  trackDurationSec: number,
  clipDurationSec: StoryMusicClipDuration,
): number {
  const windowLeftPx = clipWindowLeftPx(startSeconds, trackWidth, trackDurationSec, clipDurationSec);
  return clientX - trackLeft - windowLeftPx;
}

export function pointerDragToClipStart(
  clientX: number,
  trackLeft: number,
  trackWidth: number,
  grabOffsetPx: number,
  trackDurationSec: number,
  clipDurationSec: StoryMusicClipDuration,
): number {
  const windowLeftPx = clientX - trackLeft - grabOffsetPx;
  return clipStartFromWindowLeftPx(windowLeftPx, trackWidth, trackDurationSec, clipDurationSec);
}

export function storyMusicClipFitsInsideTrack(
  startSeconds: number,
  clipDurationSec: StoryMusicClipDuration,
  trackDurationSec: number,
): boolean {
  if (!Number.isFinite(trackDurationSec) || trackDurationSec <= 0) return true;
  const start = clampStoryMusicClipStartForTrack(startSeconds, clipDurationSec, trackDurationSec);
  return storyMusicClipEnd(start, clipDurationSec) <= Math.floor(trackDurationSec) + 0.001;
}
