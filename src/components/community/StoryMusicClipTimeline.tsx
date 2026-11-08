"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { readJsonResponse } from "@/lib/read-json-response";
import type { StoryMusicPlaybackApiResponse } from "@/lib/story-music/playback-response";
import {
  type StoryMusicClipDuration,
  STORY_MUSIC_MAX_START_SEC,
  clampStoryMusicClipStartForTrack,
  clipWindowLeftRatio,
  clipWindowWidthRatio,
  maxStoryMusicClipStart,
  pointerXToClipStart,
  storyMusicClipDurationSelectable,
  storyMusicClipPlaybackDurationSec,
  storyMusicClipPlaybackEndSeconds,
} from "@/lib/story-music/story-music-clip";
import {
  STORY_MUSIC_CLIP_TIMELINE_FALLBACK_TRACK_SEC,
  STORY_MUSIC_CLIP_TIMELINE_METADATA_POLL_MS,
  STORY_MUSIC_CLIP_TIMELINE_METADATA_TIMEOUT_MS,
  bindStoryMusicClipTimelineDocumentDrag,
  isUsableStoryMusicAudioDuration,
  resolveStoryMusicClipTimelineTrackDuration,
  storyMusicClipTimelineDragMove,
  storyMusicClipTimelineDragStart,
  storyMusicClipTimelineProbeState,
  type StoryMusicClipTimelineProbeState,
} from "@/lib/story-music/story-music-clip-timeline";
import { formatMediaTimestamp, parseMediaTimestamp } from "@/lib/worship-youtube-timestamp-utils";

type StoryMusicClipTimelineProps = {
  trackId: string;
  clipStartSeconds: number;
  clipDurationSec: StoryMusicClipDuration;
  onClipStartSeconds: (seconds: number) => void;
  catalogDefaultStart?: number;
  onTrackDurationSec?: (seconds: number | null) => void;
  onDurationProbeState?: (state: StoryMusicClipTimelineProbeState) => void;
};

export function StoryMusicClipTimeline({
  trackId,
  clipStartSeconds,
  clipDurationSec,
  onClipStartSeconds,
  catalogDefaultStart = 0,
  onTrackDurationSec,
  onDurationProbeState,
}: StoryMusicClipTimelineProps) {
  const labelId = useId();
  const sliderId = useId();
  const railRef = useRef<HTMLDivElement | null>(null);
  const windowRef = useRef<HTMLDivElement | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const dragGrabOffsetRef = useRef(0);
  const clipStartRef = useRef(clipStartSeconds);
  const onStartRef = useRef(onClipStartSeconds);
  const clipDurationRef = useRef(clipDurationSec);
  const onTrackDurationRef = useRef(onTrackDurationSec);
  const onProbeStateRef = useRef(onDurationProbeState);
  const disposeDocumentDragRef = useRef<(() => void) | null>(null);
  const interactionDurationRef = useRef<number | null>(null);
  const measuredDurationRef = useRef<number | null>(null);

  const [measuredTrackDurationSec, setMeasuredTrackDurationSec] = useState<number | null>(null);
  const [hasPlayableAudio, setHasPlayableAudio] = useState(false);
  const [fetchSettled, setFetchSettled] = useState(false);
  const durationProbeRef = useRef<HTMLAudioElement | null>(null);
  const [fallbackDraft, setFallbackDraft] = useState<string | null>(null);
  const fallbackDirtyRef = useRef(false);

  clipStartRef.current = clipStartSeconds;
  onStartRef.current = onClipStartSeconds;
  clipDurationRef.current = clipDurationSec;
  onTrackDurationRef.current = onTrackDurationSec;
  onProbeStateRef.current = onDurationProbeState;
  measuredDurationRef.current = measuredTrackDurationSec;

  const { durationSec: interactionDurationSec, kind: durationKind } =
    resolveStoryMusicClipTimelineTrackDuration({
      measuredSec: measuredTrackDurationSec,
      hasPlayableAudio,
    });

  interactionDurationRef.current =
    interactionDurationSec != null && interactionDurationSec > 0 ? interactionDurationSec : null;

  const probeState = storyMusicClipTimelineProbeState({
    hasPlayableAudio,
    measuredSec: measuredTrackDurationSec,
    fetchSettled,
  });

  useEffect(() => {
    onProbeStateRef.current?.(probeState);
  }, [probeState]);

  const clampedStart = clampStoryMusicClipStartForTrack(
    clipStartSeconds,
    clipDurationSec,
    durationKind === "measured" ? measuredTrackDurationSec : interactionDurationSec,
    catalogDefaultStart,
  );
  const clipEnd = storyMusicClipPlaybackEndSeconds(
    clampedStart,
    clipDurationSec,
    durationKind === "measured" ? measuredTrackDurationSec : interactionDurationSec,
  );
  const playbackDurationSec =
    interactionDurationSec != null && interactionDurationSec > 0
      ? storyMusicClipPlaybackDurationSec(
          clampedStart,
          clipDurationSec,
          durationKind === "measured" ? measuredTrackDurationSec : interactionDurationSec,
        )
      : clipDurationSec;

  useEffect(() => {
    if (durationKind !== "measured" || measuredTrackDurationSec == null) return;
    const next = clampStoryMusicClipStartForTrack(
      clipStartRef.current,
      clipDurationSec,
      measuredTrackDurationSec,
      catalogDefaultStart,
    );
    if (next !== clipStartRef.current) {
      onStartRef.current(next);
    }
  }, [clipDurationSec, measuredTrackDurationSec, durationKind, catalogDefaultStart]);

  useEffect(() => {
    if (!fallbackDirtyRef.current) {
      setFallbackDraft(null);
    }
  }, [clampedStart, clipDurationSec]);

  useEffect(() => {
    let cancelled = false;
    let pollId = 0;
    let timeoutId = 0;

    setHasPlayableAudio(false);
    setFetchSettled(false);
    setMeasuredTrackDurationSec(null);
    onTrackDurationRef.current?.(null);
    onProbeStateRef.current?.("loading");

    const commitMeasured = (duration: number) => {
      if (cancelled || !isUsableStoryMusicAudioDuration(duration)) return false;
      if (measuredDurationRef.current != null && Math.abs(measuredDurationRef.current - duration) < 0.05) {
        return true;
      }
      measuredDurationRef.current = duration;
      setMeasuredTrackDurationSec(duration);
      onTrackDurationRef.current?.(duration);
      onStartRef.current(
        clampStoryMusicClipStartForTrack(
          clipStartRef.current,
          clipDurationRef.current,
          duration,
          catalogDefaultStart,
        ),
      );
      return true;
    };

    const tryReadDuration = (audio: HTMLAudioElement) => {
      commitMeasured(audio.duration);
    };

    void (async () => {
      try {
        const response = await fetch(
          `/api/community/story-music/playback?trackId=${encodeURIComponent(trackId)}`,
          { cache: "no-store" },
        );
        const data = await readJsonResponse<StoryMusicPlaybackApiResponse>(response);
        if (cancelled) return;

        if (data.mode !== "audio" || !data.audioUrl) {
          setHasPlayableAudio(false);
          setFetchSettled(true);
          onProbeStateRef.current?.("unavailable");
          return;
        }

        setHasPlayableAudio(true);
        setFetchSettled(true);

        const audio = durationProbeRef.current ?? new Audio();
        durationProbeRef.current = audio;
        audio.preload = "metadata";
        audio.src = data.audioUrl;

        const onMeta = () => tryReadDuration(audio);
        audio.addEventListener("loadedmetadata", onMeta);
        audio.addEventListener("durationchange", onMeta);
        audio.addEventListener("canplay", onMeta);
        audio.addEventListener(
          "error",
          () => {
            if (!cancelled && measuredDurationRef.current == null) {
              onProbeStateRef.current?.("estimated");
            }
          },
          { once: true },
        );
        audio.load();

        pollId = window.setInterval(() => {
          if (cancelled) return;
          tryReadDuration(audio);
          if (measuredDurationRef.current != null) {
            window.clearInterval(pollId);
          }
        }, STORY_MUSIC_CLIP_TIMELINE_METADATA_POLL_MS);

        timeoutId = window.setTimeout(() => {
          if (cancelled) return;
          window.clearInterval(pollId);
          if (measuredDurationRef.current == null) {
            onProbeStateRef.current?.("estimated");
          }
        }, STORY_MUSIC_CLIP_TIMELINE_METADATA_TIMEOUT_MS);
      } catch {
        if (!cancelled) {
          setHasPlayableAudio(false);
          setFetchSettled(true);
          onProbeStateRef.current?.("unavailable");
        }
      }
    })();

    return () => {
      cancelled = true;
      window.clearInterval(pollId);
      window.clearTimeout(timeoutId);
      disposeDocumentDragRef.current?.();
      disposeDocumentDragRef.current = null;
    };
  }, [trackId, catalogDefaultStart]);

  const applyDragPointer = useCallback(
    (clientX: number) => {
      const rail = railRef.current;
      const trackDurationSec = interactionDurationRef.current;
      if (!rail || trackDurationSec == null || trackDurationSec <= 0) return;
      const rect = rail.getBoundingClientRect();
      onClipStartSeconds(
        storyMusicClipTimelineDragMove(
          clientX,
          rect.left,
          rect.width,
          dragGrabOffsetRef.current,
          trackDurationSec,
          clipDurationSec,
        ),
      );
    },
    [clipDurationSec, onClipStartSeconds],
  );

  const windowWidthRatio =
    interactionDurationSec != null && interactionDurationSec > 0
      ? clipWindowWidthRatio(interactionDurationSec, clipDurationSec)
      : clipDurationSec === 60
        ? 0.5
        : 0.25;
  const windowLeftRatio =
    interactionDurationSec != null && interactionDurationSec > 0
      ? clipWindowLeftRatio(clampedStart, interactionDurationSec, clipDurationSec)
      : 0;

  const startLabel = formatMediaTimestamp(clampedStart) || "0:00";
  const endLabel = formatMediaTimestamp(clipEnd) || startLabel;
  const trackLabel =
    durationKind === "measured" && measuredTrackDurationSec != null
      ? formatMediaTimestamp(measuredTrackDurationSec)
      : durationKind === "estimated"
        ? `~${formatMediaTimestamp(STORY_MUSIC_CLIP_TIMELINE_FALLBACK_TRACK_SEC)} (est.)`
        : !fetchSettled
          ? "Loading…"
          : "Unknown length";

  const ariaMax =
    interactionDurationSec != null && interactionDurationSec > 0
      ? maxStoryMusicClipStart(interactionDurationSec, clipDurationSec)
      : STORY_MUSIC_MAX_START_SEC;

  function commitFallbackDraft() {
    fallbackDirtyRef.current = false;
    const raw = (fallbackDraft ?? startLabel).trim();
    setFallbackDraft(null);
    if (!raw) return;
    const parsed = parseMediaTimestamp(raw);
    if (parsed == null) return;
    const trackForClamp =
      durationKind === "measured" ? measuredTrackDurationSec : interactionDurationSec;
    onClipStartSeconds(
      clampStoryMusicClipStartForTrack(parsed, clipDurationSec, trackForClamp, catalogDefaultStart),
    );
  }

  const timelineCanDrag =
    interactionDurationRef.current != null && interactionDurationRef.current > 0;

  function beginWindowDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (!timelineCanDrag) return;
    const rail = railRef.current;
    if (!rail) return;
    const rect = rail.getBoundingClientRect();
    dragGrabOffsetRef.current = storyMusicClipTimelineDragStart(
      event.clientX,
      rect.left,
      rect.width,
      clampedStart,
      interactionDurationRef.current!,
      clipDurationSec,
    );
    activePointerIdRef.current = event.pointerId;
    disposeDocumentDragRef.current?.();
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Safari may reject capture on some builds; document listeners still apply.
    }
    const pointerId = event.pointerId;
    disposeDocumentDragRef.current = bindStoryMusicClipTimelineDocumentDrag({
      pointerId,
      onMove: applyDragPointer,
      onEnd: () => {
        disposeDocumentDragRef.current = null;
        const el = windowRef.current;
        const pid = activePointerIdRef.current;
        activePointerIdRef.current = null;
        try {
          if (el && pid != null && el.hasPointerCapture(pid)) {
            el.releasePointerCapture(pid);
          }
        } catch {
          // ignore
        }
      },
    });
    event.preventDefault();
  }

  function endWindowDrag(event: React.PointerEvent<HTMLDivElement>) {
    disposeDocumentDragRef.current?.();
    disposeDocumentDragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  return (
    <div
      className={`story-music-clip-timeline${durationKind === "estimated" ? " story-music-clip-timeline--estimated" : ""}`}
      role="group"
      aria-labelledby={labelId}
    >
      <audio ref={durationProbeRef} preload="metadata" className="sr-only" aria-hidden tabIndex={-1} />
      <div className="story-music-clip-timeline-head">
        <p id={labelId} className="story-music-clip-timeline-label">
          Slide the clip along the song
        </p>
        <p className="story-music-clip-timeline-range" aria-live="polite">
          <span className="font-semibold">{startLabel}</span>
          <span aria-hidden> – </span>
          <span className="font-semibold">{endLabel}</span>
          <span className="story-music-clip-timeline-track-length"> · {trackLabel}</span>
        </p>
      </div>

      <div
        ref={railRef}
        className="story-music-clip-timeline-rail"
        onPointerDown={(event) => {
          if (!timelineCanDrag) return;
          if ((event.target as HTMLElement).closest(".story-music-clip-timeline-window")) return;
          const rect = railRef.current?.getBoundingClientRect();
          if (!rect) return;
          onClipStartSeconds(
            pointerXToClipStart(
              event.clientX,
              rect.left,
              rect.width,
              interactionDurationRef.current!,
              clipDurationSec,
            ),
          );
        }}
      >
        <div className="story-music-clip-timeline-track" aria-hidden />
        <div
          id={sliderId}
          ref={windowRef}
          role="slider"
          tabIndex={0}
          className="story-music-clip-timeline-window"
          style={{
            width: `${windowWidthRatio * 100}%`,
            left: `${windowLeftRatio * 100}%`,
          }}
          aria-label="Story music clip position"
          aria-valuemin={0}
          aria-valuemax={ariaMax}
          aria-valuenow={clampedStart}
          aria-valuetext={`${startLabel} to ${endLabel}, ${playbackDurationSec} second clip`}
          aria-disabled={!timelineCanDrag}
          onKeyDown={(event) => {
            if (!timelineCanDrag) return;
            let delta = 0;
            if (event.key === "ArrowRight") delta = event.shiftKey ? 5 : 1;
            if (event.key === "ArrowLeft") delta = event.shiftKey ? -5 : -1;
            if (event.key === "Home") {
              onClipStartSeconds(0);
              event.preventDefault();
              return;
            }
            if (event.key === "End") {
              onClipStartSeconds(
                clampStoryMusicClipStartForTrack(
                  9_999,
                  clipDurationSec,
                  interactionDurationRef.current,
                ),
              );
              event.preventDefault();
              return;
            }
            if (delta !== 0) {
              event.preventDefault();
              onClipStartSeconds(
                clampStoryMusicClipStartForTrack(
                  clampedStart + delta,
                  clipDurationSec,
                  interactionDurationRef.current,
                ),
              );
            }
          }}
          onPointerDown={beginWindowDrag}
          onPointerMove={(event) => {
            if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
            applyDragPointer(event.clientX);
          }}
          onPointerUp={endWindowDrag}
          onPointerCancel={endWindowDrag}
        >
          <span className="story-music-clip-timeline-window-grip" aria-hidden />
          <span className="story-music-clip-timeline-window-label">
            {playbackDurationSec < clipDurationSec
              ? `${playbackDurationSec}s`
              : `${clipDurationSec}s`}
          </span>
        </div>
      </div>

      <label className="story-music-clip-timeline-fallback">
        <span className="sr-only">Clip start time fallback</span>
        <span className="text-[11px] text-night-600 dark:text-sand-400">Start (mm:ss or sec)</span>
        <input
          type="text"
          inputMode="numeric"
          value={fallbackDraft ?? startLabel}
          onFocus={() => {
            fallbackDirtyRef.current = true;
            setFallbackDraft(startLabel);
          }}
          onChange={(event) => {
            fallbackDirtyRef.current = true;
            setFallbackDraft(event.target.value);
          }}
          onBlur={() => {
            commitFallbackDraft();
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commitFallbackDraft();
              event.currentTarget.blur();
            }
          }}
          className="story-music-clip-timeline-fallback-input"
          aria-label="Adjust clip start time"
        />
      </label>

      {durationKind === "estimated" ? (
        <p className="story-music-clip-timeline-hint text-[11px] text-night-600 dark:text-sand-400">
          Song length is still loading on your device — drag uses an estimated{" "}
          {STORY_MUSIC_CLIP_TIMELINE_FALLBACK_TRACK_SEC}s track until the real length is read. Clip
          start/end above update as you move the handle; sharing waits for the real length.
        </p>
      ) : null}

      {durationKind === "measured" &&
      measuredTrackDurationSec != null &&
      playbackDurationSec < clipDurationSec ? (
        <p className="story-music-clip-timeline-hint text-[11px] text-night-600 dark:text-sand-400">
          Song length is {formatMediaTimestamp(Math.floor(measuredTrackDurationSec))}
          {!storyMusicClipDurationSelectable(60, measuredTrackDurationSec)
            ? " — 60 second clips are not available."
            : ""}{" "}
          Stories and preview play {playbackDurationSec}s from your start point.
        </p>
      ) : null}

      {probeState === "unavailable" ? (
        <p className="story-music-clip-timeline-hint text-[11px] text-night-600 dark:text-sand-400">
          Could not load playable audio for this song — use the start time field. Preview confirms
          your clip.
        </p>
      ) : null}
    </div>
  );
}
