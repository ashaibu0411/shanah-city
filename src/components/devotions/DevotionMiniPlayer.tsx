"use client";

import Link from "next/link";
import { useDevotionPlayer } from "@/components/devotions/DevotionPlayerProvider";

export function DevotionMiniPlayer() {
  const { devotion, playing, paused, pause, resume, stop } = useDevotionPlayer();

  if (!playing || !devotion) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 z-[45] px-3 lg:px-6 bottom-[calc(5.6rem+env(safe-area-inset-bottom,0px))] lg:bottom-6">
      <div className="pointer-events-auto mx-auto flex max-w-lg items-center gap-3 rounded-2xl bg-night-950 px-3 py-2.5 text-white shadow-2xl ring-1 ring-white/10 lg:max-w-xl">
        <Link href="/devotions" className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-200/80">
            {paused ? "Paused" : "Playing"}
          </p>
          <p className="truncate text-sm font-semibold">{devotion.title}</p>
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
