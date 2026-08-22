"use client";

import { useState } from "react";
import { useAppShell } from "@/components/app/AppShellContext";
import { MediaClipUploadPanel } from "@/components/media/MediaClipUploadPanel";
import { MediaClipsGrid } from "@/components/media/MediaClipsGrid";
import { MediaLiveStage } from "@/components/media/MediaLiveStage";
import { MobileMediaHub } from "@/components/media/MobileMediaHub";
import type { ChurchSocialImages } from "@/lib/facebook-church-media";
import type { MediaClip, MediaTab } from "@/lib/types";

type MediaHubProps = {
  clips: MediaClip[];
  browseLinks: Array<{
    id: string;
    label: string;
    url: string;
    platform: string;
  }>;
  churchImages: ChurchSocialImages;
};

function MediaTabs({
  tab,
  clipsCount,
  onChange,
}: {
  tab: MediaTab;
  clipsCount: number;
  onChange: (tab: MediaTab) => void;
}) {
  return (
    <div className="mb-5 inline-flex rounded-full bg-night-950 p-1 shadow-lg shadow-indigo-950/20">
      {(
        [
          ["live", "Live"],
          ["clips", "Shorts"],
        ] as const
      ).map(([key, label]) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            tab === key
              ? "bg-gradient-to-r from-amber-300 via-fuchsia-400 to-violet-500 text-night-950 shadow-md"
              : "text-white/70 hover:text-white"
          }`}
        >
          {label}
          {key === "clips" && clipsCount > 0 ? (
            <span className="ml-1.5 text-[10px] opacity-80">{clipsCount}</span>
          ) : null}
        </button>
      ))}
    </div>
  );
}

export function MediaHub({ clips, browseLinks, churchImages }: MediaHubProps) {
  const { isMobileApp } = useAppShell();
  const [tab, setTab] = useState<MediaTab>("live");

  if (isMobileApp) {
    return (
      <MobileMediaHub clips={clips} browseLinks={browseLinks} churchImages={churchImages} />
    );
  }

  return (
    <div className="space-y-2">
      <section className="relative mb-5 overflow-hidden rounded-[2rem] bg-night-950 px-6 py-8 text-white shadow-2xl shadow-indigo-950/30">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(251,191,36,0.28),transparent_42%),radial-gradient(circle_at_85%_10%,rgba(244,114,182,0.28),transparent_40%),radial-gradient(circle_at_70%_90%,rgba(99,102,241,0.35),transparent_45%)]" />
        <div className="relative">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-200/90">Media</p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">Watch Shanah City</h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/70">
            Live worship, short highlights, and moments from Aurora and Accra — all in one cinema-style
            tab.
          </p>
        </div>
      </section>

      <MediaTabs tab={tab} clipsCount={clips.length} onChange={setTab} />

      {tab === "live" ? (
        <MediaLiveStage />
      ) : (
        <section>
          <MediaClipUploadPanel />
          <MediaClipsGrid clips={clips} browseLinks={browseLinks} />
        </section>
      )}
    </div>
  );
}
