"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { useShanahMedia } from "@/components/media/ShanahMediaPlayerProvider";
import { SHANAH_MEDIA_SPEEDS } from "@/lib/shanah-media-types";

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

export function ShanahMediaFullPlayer() {
  const [mounted, setMounted] = useState(false);
  const {
    item,
    playing,
    paused,
    loading,
    buffering,
    error,
    position,
    duration,
    playbackRate,
    queue,
    fullPlayerOpen,
    setFullPlayerOpen,
    pause,
    resume,
    stop,
    seek,
    skipBackward,
    skipForward,
    setPlaybackRate,
    nextInQueue,
    retry,
    removeFromQueue,
    clearQueue,
  } = useShanahMedia();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!fullPlayerOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [fullPlayerOpen]);

  if (!mounted || !fullPlayerOpen || !item) return null;

  const progress = duration > 0 ? Math.min(100, (position / duration) * 100) : 0;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex flex-col bg-gradient-to-b from-night-950 via-night-900 to-night-950 text-white">
      <div className="flex items-center justify-between px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <button
          type="button"
          className="min-h-[44px] rounded-full px-3 text-sm font-semibold text-white/90"
          onClick={() => setFullPlayerOpen(false)}
        >
          Minimize
        </button>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-clay-300">Shanah Media</p>
        <button type="button" className="min-h-[44px] rounded-full px-3 text-sm font-semibold text-white/90" onClick={stop}>
          Stop
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6 pb-8">
        <div className="aspect-square w-full max-w-[min(100%,320px)] overflow-hidden rounded-3xl bg-night-800 shadow-2xl ring-1 ring-white/10">
          {item.artworkUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.artworkUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-clay-600/40 to-night-800 text-5xl">
              ♪
            </div>
          )}
        </div>
        <h1 className="mt-8 line-clamp-2 text-center font-display text-2xl font-semibold">{item.title}</h1>
        <p className="mt-2 text-center text-sm text-sand-300">{item.artist}</p>

        <div className="mt-8 w-full max-w-md">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={Math.min(position, duration || position)}
            onChange={(event) => seek(Number(event.target.value))}
            className="w-full accent-clay-400"
            aria-label="Playback position"
          />
          <div className="mt-1 flex justify-between text-xs text-sand-400">
            <span>{formatTime(position)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button type="button" className="min-h-[44px] min-w-[44px] rounded-full bg-white/10 px-4 text-sm font-bold" onClick={() => skipBackward(15)}>
            −15s
          </button>
          <button
            type="button"
            className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-xl font-bold text-night-900"
            onClick={paused || !playing ? resume : pause}
            disabled={loading}
          >
            {loading || buffering ? "…" : paused || !playing ? "▶" : "❚❚"}
          </button>
          <button type="button" className="min-h-[44px] min-w-[44px] rounded-full bg-white/10 px-4 text-sm font-bold" onClick={() => skipForward(15)}>
            +15s
          </button>
        </div>

        <label className="mt-6 text-sm text-sand-300">
          Speed{" "}
          <select
            value={playbackRate}
            onChange={(event) => setPlaybackRate(Number(event.target.value) as typeof playbackRate)}
            className="ml-2 rounded-lg border border-white/15 bg-night-900 px-2 py-1 text-white"
          >
            {SHANAH_MEDIA_SPEEDS.map((speed) => (
              <option key={speed} value={speed}>
                {speed}x
              </option>
            ))}
          </select>
        </label>

        {error ? (
          <div className="mt-6 w-full max-w-md rounded-2xl bg-red-950/50 px-4 py-3 text-sm text-red-100">
            {error}
            <button type="button" className="ml-3 font-bold underline" onClick={retry}>
              Retry
            </button>
          </div>
        ) : null}

        {queue.length > 0 ? (
          <div className="mt-8 w-full max-w-md rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wide text-sand-400">Up next</p>
              <button type="button" className="text-xs font-semibold text-clay-300" onClick={clearQueue}>
                Clear
              </button>
            </div>
            <ul className="space-y-2 text-sm">
              {queue.slice(0, 5).map((entry) => (
                <li key={entry.id} className="flex items-center justify-between gap-2">
                  <span className="truncate">{entry.title}</span>
                  <button type="button" className="shrink-0 text-xs text-sand-400" onClick={() => removeFromQueue(entry.id)}>
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            <button type="button" className="mt-3 text-sm font-semibold text-clay-300" onClick={nextInQueue}>
              Play next in queue
            </button>
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
