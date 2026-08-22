"use client";

import { useState } from "react";
import { MediaClipUploadPanel } from "@/components/media/MediaClipUploadPanel";
import { MediaClipsGrid } from "@/components/media/MediaClipsGrid";
import { MediaLiveStage } from "@/components/media/MediaLiveStage";
import { MobileMediaHero } from "@/components/media/MobileMediaHero";
import { liveStream } from "@/lib/site";
import type { ChurchSocialImages } from "@/lib/facebook-church-media";
import type { MediaClip, MediaTab } from "@/lib/types";

type MobileMediaHubProps = {
  clips: MediaClip[];
  browseLinks: Array<{
    id: string;
    label: string;
    url: string;
    platform: string;
  }>;
  churchImages: ChurchSocialImages;
};

export function MobileMediaHub({ clips, browseLinks, churchImages }: MobileMediaHubProps) {
  const [tab, setTab] = useState<MediaTab>("live");
  const anyLive =
    liveStream.isLive ||
    liveStream.youtube.isLive ||
    liveStream.facebook.isLive;

  return (
    <div className="mobile-media-hub space-y-3">
      <MobileMediaHero
        tab={tab}
        anyLive={anyLive}
        clipsCount={clips.length}
        churchImages={churchImages}
      />

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
            className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-semibold tracking-tight transition active:scale-[0.98] ${
              tab === key
                ? "bg-gradient-to-r from-sand-300 via-amber-400 to-sand-500 text-night-950 shadow-app-sm"
                : "text-white/75"
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
        <MediaLiveStage layout="mobile" />
      ) : (
        <>
          <MediaClipUploadPanel compact />
          <MediaClipsGrid clips={clips} browseLinks={browseLinks} compact layout="mobile" />
        </>
      )}
    </div>
  );
}
