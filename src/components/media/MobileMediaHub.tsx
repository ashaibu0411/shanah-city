"use client";

import { useState } from "react";
import { MobilePageHero } from "@/components/app/MobilePageHero";
import { MediaClipUploadPanel } from "@/components/media/MediaClipUploadPanel";
import { MediaClipsGrid } from "@/components/media/MediaClipsGrid";
import { MediaLiveStage } from "@/components/media/MediaLiveStage";
import { liveStream } from "@/lib/site";
import type { MediaClip, MediaTab } from "@/lib/types";
import { Badge } from "@/components/ui";

type MobileMediaHubProps = {
  clips: MediaClip[];
  browseLinks: Array<{
    id: string;
    label: string;
    url: string;
    platform: string;
  }>;
};

export function MobileMediaHub({ clips, browseLinks }: MobileMediaHubProps) {
  const [tab, setTab] = useState<MediaTab>("live");
  const anyLive =
    liveStream.isLive ||
    liveStream.youtube.isLive ||
    liveStream.facebook.isLive;

  return (
    <div className="space-y-3">
      <MobilePageHero
        eyebrow="Media"
        title={tab === "live" ? "Watch live worship" : "Shorts & highlights"}
        description={
          tab === "live"
            ? "Stream services from YouTube, Facebook, and Instagram."
            : "Vertical clips from Shanah City — tap to play, or follow along on social."
        }
      >
        {anyLive ? (
          <Badge variant="live">
            <span className="mobile-pulse h-1.5 w-1.5 rounded-full bg-white" />
            Live now
          </Badge>
        ) : (
          <span className="mobile-chip inline-flex">Cinema · Shorts · Follow</span>
        )}
      </MobilePageHero>

      <div className="flex rounded-xl bg-night-950 p-1 shadow-app-md ring-1 ring-night-900/10">
        {(
          [
            ["live", "Live"],
            ["clips", "Shorts"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold tracking-tight transition ${
              tab === key
                ? "bg-gradient-to-r from-sand-300 via-amber-400 to-sand-500 text-night-950 shadow-app-sm"
                : "text-white/70"
            }`}
          >
            {label}
            {key === "clips" && clips.length > 0 ? (
              <span className="ml-1 text-[10px] opacity-80">{clips.length}</span>
            ) : null}
          </button>
        ))}
      </div>

      {tab === "live" ? (
        <MediaLiveStage />
      ) : (
        <>
          <MediaClipUploadPanel />
          <MediaClipsGrid clips={clips} browseLinks={browseLinks} compact />
        </>
      )}
    </div>
  );
}
