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
  computeDragGrabOffsetPx,
  pointerDragToClipStart,
  pointerXToClipStart,
  storyMusicClipDurationSelectable,
  storyMusicClipPlaybackDurationSec,
  storyMusicClipPlaybackEndSeconds,
} from "@/lib/story-music/story-music-clip";
import { formatMediaTimestamp, parseMediaTimestamp } from "@/lib/worship-youtube-timestamp-utils";

type StoryMusicClipTimelineProps = {
  trackId: string;
  clipStartSeconds: number;
  clipDurationSec: StoryMusicClipDuration;
  onClipStartSeconds: (seconds: number) => void;
  catalogDefaultStart?: number;
  onTrackDurationSec?: (seconds: number | null) => void;
};

export function StoryMusicClipTimeline({
  trackId,
  clipStartSeconds,
  clipDurationSec,
  onClipStartSeconds,
  catalogDefaultStart = 0,
  onTrackDurationSec,
}: StoryMusicClipTimelineProps) {
  const labelId = useId();
  const sliderId = useId();
  const railRef = useRef<HTMLDivElement | null>(null);
  const dragGrabOffsetRef = useRef(0);
  const clipStartRef = useRef(clipStartSeconds);
  const onStartRef = useRef(onClipStartSeconds);
  const clipDurationRef = useRef(clipDurationSec);
  const onTrackDurationRef = useRef(onTrackDurationSec);
  const [trackDurationSec, setTrackDurationSec] = useState<number | null>(null);
  const [durationState, setDurationState] = useState<"idle" | "loading" | "ready" | "unknown">("idle");
  const durationProbeRef = useRef<HTMLAudioElement | null>(null);
  const [fallbackDraft, setFallbackDraft] = useState<string | null>(null);
  const fallbackDirtyRef = useRef(false);

  clipStartRef.current = clipStartSeconds;
  onStartRef.current = onClipStartSeconds;
  clipDurationRef.current = clipDurationSec;
  onTrackDurationRef.current = onTrackDurationSec;

  const clampedStart = clampStoryMusicClipStartForTrack(
    clipStartSeconds,
    clipDurationSec,
    trackDurationSec,
    catalogDefaultStart,
  );
  const clipEnd = storyMusicClipPlaybackEndSeconds(clampedStart, clipDurationSec, trackDurationSec);
  const playbackDurationSec =
    trackDurationSec != null && trackDurationSec > 0
      ? storyMusicClipPlaybackDurationSec(clampedStart, clipDurationSec, trackDurationSec)
      : clipDurationSec;

  useEffect(() => {
    if (trackDurationSec == null || trackDurationSec <= 0) return;
    const next = clampStoryMusicClipStartForTrack(
      clipStartRef.current,
      clipDurationSec,
      trackDurationSec,
      catalogDefaultStart,
    );
    if (next !== clipStartRef.current) {
      onStartRef.current(next);
    }
  }, [clipDurationSec, trackDurationSec, catalogDefaultStart]);

  useEffect(() => {
    if (!fallbackDirtyRef.current) {
      setFallbackDraft(null);
    }
  }, [clampedStart, clipDurationSec]);

  useEffect(() => {
    let cancelled = false;
    setDurationState("loading");
    setTrackDurationSec(null);
    onTrackDurationRef.current?.(null);

    void (async () => {
      try {
        const response = await fetch(
          `/api/community/story-music/playback?trackId=${encodeURIComponent(trackId)}`,
          { cache: "no-store" },
        );
        const data = await readJsonResponse<StoryMusicPlaybackApiResponse>(response);
        if (cancelled) return;
        if (data.mode !== "audio" || !data.audioUrl) {
          setDurationState("unknown");
          return;
        }

        const audio = durationProbeRef.current ?? new Audio();
        durationProbeRef.current = audio;
        audio.preload = "metadata";
        audio.src = data.audioUrl;

        const onMeta = () => {
          if (cancelled) return;
          if (Number.isFinite(audio.duration) && audio.duration > 0) {
            setTrackDurationSec(audio.duration);
            setDurationState("ready");
            onTrackDurationRef.current?.(audio.duration);
            onStartRef.current(
              clampStoryMusicClipStartForTrack(
                clipStartRef.current,
                clipDurationRef.current,
                audio.duration,
                catalogDefaultStart,
              ),
            );
          } else {
            setDurationState("unknown");
          }
        };
        audio.addEventListener("loadedmetadata", onMeta, { once: true });
        audio.addEventListener(
          "error",
          () => {
            if (!cancelled) setDurationState("unknown");
          },
          { once: true },
        );
        audio.load();
      } catch {
        if (!cancelled) setDurationState("unknown");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [trackId, catalogDefaultStart]);

  const applyDragPointer = useCallback(
    (clientX: number) => {
      const rail = railRef.current;
      if (!rail || trackDurationSec == null || trackDurationSec <= 0) return;
      const rect = rail.getBoundingClientRect();
      onClipStartSeconds(
        pointerDragToClipStart(
          clientX,
          rect.left,
          rect.width,
          dragGrabOffsetRef.current,
          trackDurationSec,
          clipDurationSec,
        ),
      );
    },
    [clipDurationSec, onClipStartSeconds, trackDurationSec],
  );

  const windowWidthRatio =
    trackDurationSec != null && trackDurationSec > 0
      ? clipWindowWidthRatio(trackDurationSec, clipDurationSec)
      : clipDurationSec === 60
        ? 0.5
        : 0.25;
  const windowLeftRatio =
    trackDurationSec != null && trackDurationSec > 0
      ? clipWindowLeftRatio(clampedStart, trackDurationSec, clipDurationSec)
      : 0;

  const startLabel = formatMediaTimestamp(clampedStart) || "0:00";
  const endLabel = formatMediaTimestamp(clipEnd) || startLabel;
  const trackLabel =
    trackDurationSec != null && trackDurationSec > 0
      ? formatMediaTimestamp(trackDurationSec)
      : durationState === "loading"
        ? "Loading…"
        : "Unknown length";

  const ariaMax =
    trackDurationSec != null && trackDurationSec > 0
      ? Math.max(0, Math.floor(trackDurationSec) - clipDurationSec)
      : STORY_MUSIC_MAX_START_SEC;

  function commitFallbackDraft() {
    fallbackDirtyRef.current = false;
    const raw = (fallbackDraft ?? startLabel).trim();
    setFallbackDraft(null);
    if (!raw) return;
    const parsed = parseMediaTimestamp(raw);
    if (parsed == null) return;
    onClipStartSeconds(
      clampStoryMusicClipStartForTrack(parsed, clipDurationSec, trackDurationSec, catalogDefaultStart),
    );
  }

  return (
    <div className="story-music-clip-timeline" role="group" aria-labelledby={labelId}>
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
          if (trackDurationSec == null || trackDurationSec <= 0) return;
          if ((event.target as HTMLElement).closest(".story-music-clip-timeline-window")) return;
          const rect = railRef.current?.getBoundingClientRect();
          if (!rect) return;
          onClipStartSeconds(
            pointerXToClipStart(event.clientX, rect.left, rect.width, trackDurationSec, clipDurationSec),
          );
        }}
      >
        <div className="story-music-clip-timeline-track" aria-hidden />
        <div
          id={sliderId}
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
          onKeyDown={(event) => {
            if (trackDurationSec == null || trackDurationSec <= 0) return;
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
                clampStoryMusicClipStartForTrack(9_999, clipDurationSec, trackDurationSec),
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
                  trackDurationSec,
                ),
              );
            }
          }}
          onPointerDown={(event) => {
            if (trackDurationSec == null || trackDurationSec <= 0) return;
            const rect = railRef.current?.getBoundingClientRect();
            if (!rect) return;
            dragGrabOffsetRef.current = computeDragGrabOffsetPx(
              event.clientX,
              rect.left,
              rect.width,
              clampedStart,
              trackDurationSec,
              clipDurationSec,
            );
            event.currentTarget.setPointerCapture(event.pointerId);
            event.preventDefault();
          }}
          onPointerMove={(event) => {
            if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
            applyDragPointer(event.clientX);
          }}
          onPointerUp={(event) => {
            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
              event.currentTarget.releasePointerCapture(event.pointerId);
            }
          }}
          onPointerCancel={(event) => {
            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
              event.currentTarget.releasePointerCapture(event.pointerId);
            }
          }}
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

      {trackDurationSec != null &&
      trackDurationSec > 0 &&
      playbackDurationSec < clipDurationSec ? (
        <p className="story-music-clip-timeline-hint text-[11px] text-night-600 dark:text-sand-400">
          Song length is {formatMediaTimestamp(Math.floor(trackDurationSec))}
          {!storyMusicClipDurationSelectable(60, trackDurationSec)
            ? " — 60 second clips are not available."
            : ""}{" "}
          Stories and preview play {playbackDurationSec}s from your start point.
        </p>
      ) : null}
      {durationState === "unknown" ? (
        <p className="story-music-clip-timeline-hint text-[11px] text-night-600 dark:text-sand-400">
          Could not read song length — timeline uses safe limits. Preview confirms your clip.
        </p>
      ) : null}
    </div>
  );
}
