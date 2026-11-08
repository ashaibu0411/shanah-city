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
  pointerXToClipStart,
  storyMusicClipEnd,
} from "@/lib/story-music/story-music-clip";
import { formatMediaTimestamp, parseMediaTimestamp } from "@/lib/worship-youtube-timestamp-utils";

type StoryMusicClipTimelineProps = {
  trackId: string;
  clipStartSeconds: number;
  clipDurationSec: StoryMusicClipDuration;
  onClipStartSeconds: (seconds: number) => void;
  catalogDefaultStart?: number;
};

export function StoryMusicClipTimeline({
  trackId,
  clipStartSeconds,
  clipDurationSec,
  onClipStartSeconds,
  catalogDefaultStart = 0,
}: StoryMusicClipTimelineProps) {
  const labelId = useId();
  const railRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef(false);
  const clipStartRef = useRef(clipStartSeconds);
  const onStartRef = useRef(onClipStartSeconds);
  const [trackDurationSec, setTrackDurationSec] = useState<number | null>(null);
  const [durationState, setDurationState] = useState<"idle" | "loading" | "ready" | "unknown">("idle");
  const durationProbeRef = useRef<HTMLAudioElement | null>(null);

  clipStartRef.current = clipStartSeconds;
  onStartRef.current = onClipStartSeconds;

  const clampedStart = clampStoryMusicClipStartForTrack(
    clipStartSeconds,
    clipDurationSec,
    trackDurationSec,
    catalogDefaultStart,
  );
  const clipEnd = storyMusicClipEnd(clampedStart, clipDurationSec);

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
    let cancelled = false;
    setDurationState("loading");
    setTrackDurationSec(null);

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
            onStartRef.current(
              clampStoryMusicClipStartForTrack(
                clipStartRef.current,
                clipDurationSec,
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
  }, [trackId, catalogDefaultStart, clipDurationSec]);

  const applyPointer = useCallback(
    (clientX: number) => {
      const rail = railRef.current;
      if (!rail || trackDurationSec == null || trackDurationSec <= 0) return;
      const rect = rail.getBoundingClientRect();
      onClipStartSeconds(
        pointerXToClipStart(clientX, rect.left, rect.width, trackDurationSec, clipDurationSec),
      );
    },
    [clipDurationSec, onClipStartSeconds, trackDurationSec],
  );

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      if (!dragRef.current) return;
      event.preventDefault();
      applyPointer(event.clientX);
    };
    const onUp = () => {
      dragRef.current = false;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [applyPointer]);

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
          applyPointer(event.clientX);
        }}
      >
        <div className="story-music-clip-timeline-track" aria-hidden />
        <button
          type="button"
          className="story-music-clip-timeline-window"
          style={{
            width: `${windowWidthRatio * 100}%`,
            left: `${windowLeftRatio * 100}%`,
          }}
          aria-label={`Clip from ${startLabel} to ${endLabel}`}
          aria-valuemin={0}
          aria-valuemax={ariaMax}
          aria-valuenow={clampedStart}
          aria-valuetext={`${startLabel} to ${endLabel}`}
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
            dragRef.current = true;
            event.currentTarget.setPointerCapture(event.pointerId);
            event.preventDefault();
          }}
          onPointerMove={(event) => {
            if (!dragRef.current) return;
            applyPointer(event.clientX);
          }}
          onPointerUp={(event) => {
            dragRef.current = false;
            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
              event.currentTarget.releasePointerCapture(event.pointerId);
            }
          }}
        >
          <span className="story-music-clip-timeline-window-grip" aria-hidden />
          <span className="story-music-clip-timeline-window-label">{clipDurationSec}s</span>
        </button>
      </div>

      <label className="story-music-clip-timeline-fallback">
        <span className="sr-only">Clip start time fallback</span>
        <span className="text-[11px] text-night-600 dark:text-sand-400">Start (mm:ss or sec)</span>
        <input
          type="text"
          inputMode="numeric"
          value={startLabel}
          onChange={(event) => {
            const parsed = parseMediaTimestamp(event.target.value);
            if (parsed == null) return;
            onClipStartSeconds(
              clampStoryMusicClipStartForTrack(
                parsed,
                clipDurationSec,
                trackDurationSec,
                catalogDefaultStart,
              ),
            );
          }}
          className="story-music-clip-timeline-fallback-input"
          aria-label="Adjust clip start time"
        />
      </label>

      {durationState === "unknown" ? (
        <p className="story-music-clip-timeline-hint text-[11px] text-night-600 dark:text-sand-400">
          Could not read song length — timeline uses safe limits. Preview confirms your clip.
        </p>
      ) : null}
    </div>
  );
}
