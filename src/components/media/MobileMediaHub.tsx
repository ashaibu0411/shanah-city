"use client";

import { useEffect, useState } from "react";
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
  initialTab?: MediaTab;
  initialClipId?: string | null;
  initialAutoPlay?: boolean;
};

export function MobileMediaHub({
  clips,
  browseLinks,
  churchImages,
  initialTab = "live",
  initialClipId = null,
  initialAutoPlay = false,
}: MobileMediaHubProps) {
  const [tab, setTab] = useState<MediaTab>(initialTab);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);
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
          <MediaClipsGrid
            clips={clips}
            browseLinks={browseLinks}
            compact
            layout="mobile"
            initialClipId={initialClipId}
            initialAutoPlay={initialAutoPlay}
          />
        </>
      )}
    </div>
  );
}
