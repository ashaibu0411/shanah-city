"use client";

import Link from "next/link";
import { useSermonPlayer } from "@/components/sermons/SermonPlayerProvider";

export function SermonMiniPlayer() {
  const { sermon, playing, paused, pause, resume, stop } = useSermonPlayer();

  if (!playing || !sermon) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 z-[44] px-3 lg:px-6 bottom-[calc(5.6rem+env(safe-area-inset-bottom,0px))] lg:bottom-6">
      <div className="app-mobile-inner pointer-events-auto mx-auto flex w-full items-center gap-3 rounded-2xl bg-night-950 px-3 py-2.5 text-white shadow-2xl ring-1 ring-white/10">
        <Link href="/sermons" className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-sand-300/80">
            {paused ? "Paused · Message" : "Listening · Message"}
          </p>
          <p className="truncate text-sm font-semibold">{sermon.title}</p>
        </Link>
        <button
          type="button"
          onClick={paused ? resume : pause}
          className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-night-900"
        >
          {paused ? "Resume" : "Pause"}
        </button>
        <button
          type="button"
          onClick={stop}
          className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-white ring-1 ring-white/15"
        >
          Stop
        </button>
      </div>
    </div>
  );
}
