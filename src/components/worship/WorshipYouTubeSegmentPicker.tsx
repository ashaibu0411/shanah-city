"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui";
import {
  formatMediaTimestamp,
  formatSegmentRangeLabel,
  getYouTubeEmbedUrlWithSegment,
  getYouTubeWatchUrlWithSegment,
  parseMediaTimestamp,
  suggestEvenMedleySegments,
  suggestStartAfterPreviousSong,
} from "@/lib/worship-youtube-timestamp-utils";
import type { WorshipSong } from "@/lib/worship-types";

type WorshipYouTubeSegmentPickerProps = {
  videoId: string;
  title?: string;
  startSeconds?: number;
  endSeconds?: number;
  readOnly?: boolean;
  /** Other setlist rows — used for “start after previous song” and even split. */
  setlistSongs?: WorshipSong[];
  songId?: string;
  onChange?: (patch: { youtubeStartSeconds?: number; youtubeEndSeconds?: number }) => void;
  onApplyMedleySegments?: (
    updates: Record<string, { youtubeStartSeconds?: number; youtubeEndSeconds?: number }>,
  ) => void;
};

type YtPlayer = {
  getCurrentTime: () => number;
  getDuration: () => number;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  destroy: () => void;
};

let ytApiPromise: Promise<void> | null = null;

function loadYouTubeIframeApi() {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();

  if (!ytApiPromise) {
    ytApiPromise = new Promise((resolve) => {
      const previous = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        previous?.();
        resolve();
      };
      if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
        const script = document.createElement("script");
        script.src = "https://www.youtube.com/iframe_api";
        document.body.appendChild(script);
      } else {
        const interval = window.setInterval(() => {
          if (window.YT?.Player) {
            window.clearInterval(interval);
            resolve();
          }
        }, 100);
      }
    });
  }

  return ytApiPromise;
}

export function WorshipYouTubeSegmentPicker({
  videoId,
  title,
  startSeconds,
  endSeconds,
  readOnly = false,
  setlistSongs = [],
  songId,
  onChange,
  onApplyMedleySegments,
}: WorshipYouTubeSegmentPickerProps) {
  const playerHostId = useId().replace(/:/g, "");
  const playerRef = useRef<YtPlayer | null>(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [startDraft, setStartDraft] = useState(formatMediaTimestamp(startSeconds));
  const [endDraft, setEndDraft] = useState(formatMediaTimestamp(endSeconds));

  useEffect(() => {
    setStartDraft(formatMediaTimestamp(startSeconds));
    setEndDraft(formatMediaTimestamp(endSeconds));
  }, [startSeconds, endSeconds]);

  useEffect(() => {
    if (readOnly) return;

    let cancelled = false;

    loadYouTubeIframeApi().then(() => {
      if (cancelled || !window.YT?.Player) return;

      playerRef.current?.destroy();
      playerRef.current = new window.YT.Player(playerHostId, {
        videoId,
        playerVars: {
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          start: startSeconds != null ? Math.floor(startSeconds) : undefined,
          end: endSeconds != null ? Math.floor(endSeconds) : undefined,
        },
        events: {
          onReady: () => {
            if (!cancelled) setPlayerReady(true);
          },
        },
      }) as unknown as YtPlayer;
    });

    return () => {
      cancelled = true;
      playerRef.current?.destroy();
      playerRef.current = null;
      setPlayerReady(false);
    };
  }, [videoId, readOnly, playerHostId]);

  useEffect(() => {
    if (readOnly || !playerReady || !playerRef.current) return;
    if (startSeconds != null) {
      playerRef.current.seekTo(startSeconds, true);
    }
  }, [readOnly, playerReady, startSeconds]);

  function applyTimes(nextStart?: number, nextEnd?: number) {
    onChange?.({
      youtubeStartSeconds: nextStart,
      youtubeEndSeconds: nextEnd,
    });
    setStartDraft(formatMediaTimestamp(nextStart));
    setEndDraft(formatMediaTimestamp(nextEnd));
  }

  function markCurrent(as: "start" | "end") {
    const current = playerRef.current?.getCurrentTime();
    if (current == null || !Number.isFinite(current)) return;
    const seconds = Math.floor(current);
    if (as === "start") {
      applyTimes(seconds, endSeconds);
    } else {
      applyTimes(startSeconds, seconds);
    }
  }

  function nudge(field: "start" | "end", deltaSeconds: number) {
    const base = field === "start" ? startSeconds ?? 0 : endSeconds ?? startSeconds ?? 0;
    const next = Math.max(0, base + deltaSeconds);
    if (field === "start") {
      applyTimes(next, endSeconds);
    } else {
      applyTimes(startSeconds, next);
    }
  }

  function commitDrafts() {
    const parsedStart = parseMediaTimestamp(startDraft);
    const parsedEnd = parseMediaTimestamp(endDraft);
    applyTimes(parsedStart ?? undefined, parsedEnd ?? undefined);
  }

  function startAfterPrevious() {
    if (!songId) return;
    const suggested = suggestStartAfterPreviousSong(setlistSongs, songId, videoId);
    if (suggested == null) return;
    applyTimes(suggested, endSeconds);
    playerRef.current?.seekTo(suggested, true);
  }

  function splitEvenlyOnVideo() {
    const duration = playerRef.current?.getDuration();
    if (!duration || !Number.isFinite(duration)) return;
    const updates = suggestEvenMedleySegments(setlistSongs, videoId, duration);
    if (updates.size === 0) return;

    if (onApplyMedleySegments) {
      const payload: Record<string, { youtubeStartSeconds?: number; youtubeEndSeconds?: number }> =
        {};
      for (const [id, segment] of updates) {
        payload[id] = {
          youtubeStartSeconds: segment.start,
          youtubeEndSeconds: segment.end,
        };
      }
      onApplyMedleySegments(payload);
      if (songId && updates.has(songId)) {
        const segment = updates.get(songId)!;
        setStartDraft(formatMediaTimestamp(segment.start));
        setEndDraft(formatMediaTimestamp(segment.end));
      }
      return;
    }

    if (!songId || !updates.has(songId)) return;
    const segment = updates.get(songId)!;
    applyTimes(segment.start, segment.end);
    if (segment.start != null) {
      playerRef.current?.seekTo(segment.start, true);
    }
  }

  const medleyCount = setlistSongs.filter((song) => song.youtubeVideoId === videoId).length;
  const rangeLabel = formatSegmentRangeLabel(startSeconds, endSeconds);
  const embedUrl = getYouTubeEmbedUrlWithSegment(videoId, startSeconds, endSeconds);
  const watchUrl = getYouTubeWatchUrlWithSegment(videoId, startSeconds, endSeconds);

  return (
    <div className="mt-3 rounded-xl border border-night-900/5 bg-sand-50/80 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-night-500">
            Song timestamps
          </p>
          <p className="mt-1 text-xs text-night-600">
            Mark where this song starts and stops in the video — no typing required.
          </p>
          {rangeLabel && (
            <p className="mt-1 text-sm font-semibold text-night-900">Segment: {rangeLabel}</p>
          )}
        </div>
        {!readOnly && rangeLabel && (
          <Button variant="secondary" onClick={() => applyTimes(undefined, undefined)}>
            Clear times
          </Button>
        )}
      </div>

      {readOnly ? (
        <div className="mt-3 overflow-hidden rounded-xl border border-night-900/5 bg-black/5">
          <div className="aspect-video w-full bg-black">
            <iframe
              title={title ? `${title} segment` : "YouTube segment"}
              src={embedUrl}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </div>
      ) : (
        <div className="mt-3 overflow-hidden rounded-xl border border-night-900/5 bg-black">
          <div id={playerHostId} className="aspect-video w-full" />
        </div>
      )}

      {!readOnly && (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={() => markCurrent("start")} disabled={!playerReady}>
            Set start here
          </Button>
          <Button variant="secondary" onClick={() => markCurrent("end")} disabled={!playerReady}>
            Set stop here
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              if (startSeconds != null) playerRef.current?.seekTo(startSeconds, true);
            }}
            disabled={!playerReady || startSeconds == null}
          >
            Jump to start
          </Button>
        </div>
      )}

      {!readOnly && (
        <div className="mt-2 flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => nudge("start", -5)} disabled={!playerReady}>
            Start −5s
          </Button>
          <Button variant="secondary" onClick={() => nudge("start", 5)} disabled={!playerReady}>
            Start +5s
          </Button>
          <Button variant="secondary" onClick={() => nudge("end", -5)} disabled={!playerReady}>
            Stop −5s
          </Button>
          <Button variant="secondary" onClick={() => nudge("end", 5)} disabled={!playerReady}>
            Stop +5s
          </Button>
        </div>
      )}

      {!readOnly && medleyCount > 1 && (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-night-900/5 pt-3">
          <Button variant="secondary" onClick={startAfterPrevious} disabled={!playerReady || !songId}>
            Start after previous song
          </Button>
          <Button variant="secondary" onClick={splitEvenlyOnVideo} disabled={!playerReady}>
            Auto-split all {medleyCount} songs on this video
          </Button>
        </div>
      )}

      {!readOnly && (
        <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <label className="text-xs text-night-700">
            <span className="font-semibold">Start (m:ss)</span>
            <input
              value={startDraft}
              onChange={(event) => setStartDraft(event.target.value)}
              placeholder="0:00"
              className="mt-1 block w-full rounded-lg border border-night-900/10 bg-white px-2 py-1.5 text-sm"
            />
          </label>
          <label className="text-xs text-night-700">
            <span className="font-semibold">Stop (m:ss)</span>
            <input
              value={endDraft}
              onChange={(event) => setEndDraft(event.target.value)}
              placeholder="4:30"
              className="mt-1 block w-full rounded-lg border border-night-900/10 bg-white px-2 py-1.5 text-sm"
            />
          </label>
          <Button variant="secondary" onClick={commitDrafts}>
            Apply typed times
          </Button>
        </div>
      )}

      <div className="mt-2 text-right">
        <a
          href={watchUrl}
          target="_blank"
          rel="noreferrer"
          className="text-xs font-semibold text-red-700 underline"
        >
          Open segment on YouTube
        </a>
      </div>
    </div>
  );
}

declare global {
  interface Window {
    YT?: {
      Player: new (
        elementId: string,
        options: Record<string, unknown>,
      ) => {
        getCurrentTime: () => number;
        getDuration: () => number;
        seekTo: (seconds: number, allowSeekAhead: boolean) => void;
        destroy: () => void;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}
