"use client";

import { useState } from "react";
import { MobilePageHero } from "@/components/app/MobilePageHero";
import { MobileTabPills } from "@/components/app/MobileTabPills";
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
  const isLive = tab === "live";

  return (
    <div className="mobile-media-hub space-y-3">
      <MobilePageHero
        eyebrow="Shanah City Media"
        title={isLive ? "Watch Live" : "Shorts & Highlights"}
        description={
          isLive
            ? "YouTube · Facebook · Instagram"
            : clips.length > 0
              ? `${clips.length} clips · Swipe to explore`
              : "Worship moments on demand"
        }
      />

      <MobileMediaHero
        tab={tab}
        anyLive={anyLive}
        clipsCount={clips.length}
        churchImages={churchImages}
        hideTitle
      />

      <MobileTabPills
        className="mb-0.5"
        tabs={[
          { id: "live", label: "Live" },
          { id: "clips", label: clips.length > 0 ? `Shorts · ${clips.length}` : "Shorts" },
        ]}
        activeId={tab}
        onChange={(id) => setTab(id as MediaTab)}
      />

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
