import {
  computeDragGrabOffsetPx,
  pointerDragToClipStart,
  type StoryMusicClipDuration,
} from "@/lib/story-music/story-music-clip";

/** Conservative placeholder so the rail is draggable before mobile Safari reports audio.duration. */
export const STORY_MUSIC_CLIP_TIMELINE_FALLBACK_TRACK_SEC = 180;

export const STORY_MUSIC_CLIP_TIMELINE_METADATA_POLL_MS = 200;
export const STORY_MUSIC_CLIP_TIMELINE_METADATA_TIMEOUT_MS = 12_000;

export type StoryMusicClipTimelineDurationKind = "measured" | "estimated" | "none";

export type StoryMusicClipTimelineProbeState =
  | "loading"
  | "estimated"
  | "measured"
  | "unavailable";

export function isUsableStoryMusicAudioDuration(duration: number): boolean {
  return Number.isFinite(duration) && duration > 0 && duration < 86_400;
}

export function resolveStoryMusicClipTimelineTrackDuration(input: {
  measuredSec: number | null;
  hasPlayableAudio: boolean;
}): { durationSec: number | null; kind: StoryMusicClipTimelineDurationKind } {
  if (input.measuredSec != null && isUsableStoryMusicAudioDuration(input.measuredSec)) {
    return { durationSec: input.measuredSec, kind: "measured" };
  }
  if (input.hasPlayableAudio) {
    return {
      durationSec: STORY_MUSIC_CLIP_TIMELINE_FALLBACK_TRACK_SEC,
      kind: "estimated",
    };
  }
  return { durationSec: null, kind: "none" };
}

export function storyMusicClipTimelineProbeState(input: {
  hasPlayableAudio: boolean;
  measuredSec: number | null;
  fetchSettled: boolean;
}): StoryMusicClipTimelineProbeState {
  if (input.measuredSec != null && isUsableStoryMusicAudioDuration(input.measuredSec)) {
    return "measured";
  }
  if (!input.fetchSettled) return "loading";
  if (input.hasPlayableAudio) return "estimated";
  return "unavailable";
}

/** Document-level move/up handlers (used when element pointer capture is flaky on iOS). */
export function bindStoryMusicClipTimelineDocumentDrag(input: {
  pointerId: number;
  onMove: (clientX: number) => void;
  onEnd: () => void;
}): () => void {
  const onMove = (event: PointerEvent) => {
    if (event.pointerId !== input.pointerId) return;
    event.preventDefault();
    input.onMove(event.clientX);
  };
  const onEnd = (event: PointerEvent) => {
    if (event.pointerId !== input.pointerId) return;
    input.onEnd();
    dispose();
  };
  const dispose = () => {
    document.removeEventListener("pointermove", onMove);
    document.removeEventListener("pointerup", onEnd);
    document.removeEventListener("pointercancel", onEnd);
  };
  document.addEventListener("pointermove", onMove, { passive: false });
  document.addEventListener("pointerup", onEnd);
  document.addEventListener("pointercancel", onEnd);
  return dispose;
}

export function storyMusicClipTimelineDragStart(
  clientX: number,
  trackLeft: number,
  trackWidth: number,
  clipStartSeconds: number,
  trackDurationSec: number,
  clipDurationSec: StoryMusicClipDuration,
): number {
  return computeDragGrabOffsetPx(
    clientX,
    trackLeft,
    trackWidth,
    clipStartSeconds,
    trackDurationSec,
    clipDurationSec,
  );
}

export function storyMusicClipTimelineDragMove(
  clientX: number,
  trackLeft: number,
  trackWidth: number,
  grabOffsetPx: number,
  trackDurationSec: number,
  clipDurationSec: StoryMusicClipDuration,
): number {
  return pointerDragToClipStart(
    clientX,
    trackLeft,
    trackWidth,
    grabOffsetPx,
    trackDurationSec,
    clipDurationSec,
  );
}
