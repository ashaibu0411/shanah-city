"use client";

import Link from "next/link";
import { useShanahMedia } from "@/components/media/ShanahMediaPlayerProvider";

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

export function ShanahMediaMiniPlayer() {
  const {
    item,
    playing,
    paused,
    position,
    duration,
    pause,
    resume,
    setFullPlayerOpen,
  } = useShanahMedia();

  if (!item || !playing) return null;

  const progress = duration > 0 ? Math.min(100, (position / duration) * 100) : 0;
  const href = item.href ?? "/";

  return (
    <div className="pointer-events-none fixed inset-x-0 z-[46] px-3 lg:px-6 bottom-[calc(5.6rem+env(safe-area-inset-bottom,0px))] lg:bottom-6">
      <div className="app-mobile-inner pointer-events-auto mx-auto w-full overflow-hidden rounded-2xl bg-night-950 text-white shadow-2xl ring-1 ring-white/10">
        <div className="h-0.5 bg-white/15">
          <div className="h-full bg-clay-400 transition-[width] duration-200" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex items-center gap-3 px-3 py-2.5">
          <button
            type="button"
            className="min-w-0 flex-1 text-left"
            onClick={() => setFullPlayerOpen(true)}
            aria-label="Expand Shanah Media Player"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-sand-300/80">
              {paused ? "Paused" : "Shanah Media"}
            </p>
            <p className="truncate text-sm font-semibold">{item.title}</p>
            <p className="truncate text-xs text-sand-400">
              {item.artist}
              {duration > 0 ? ` · ${formatTime(position)} / ${formatTime(duration)}` : ""}
            </p>
          </button>
          <Link
            href={href}
            className="hidden text-xs font-semibold text-clay-300 underline sm:inline"
            onClick={(event) => event.stopPropagation()}
          >
            Open
          </Link>
          <button
            type="button"
            onClick={paused ? resume : pause}
            className="min-h-[44px] min-w-[44px] rounded-full bg-white px-3 py-1.5 text-xs font-bold text-night-900"
          >
            {paused ? "Play" : "Pause"}
          </button>
          <button
            type="button"
            onClick={() => setFullPlayerOpen(true)}
            className="min-h-[44px] min-w-[44px] rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-white ring-1 ring-white/15"
            aria-label="Expand player"
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  );
}
