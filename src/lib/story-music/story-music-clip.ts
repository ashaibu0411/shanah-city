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
