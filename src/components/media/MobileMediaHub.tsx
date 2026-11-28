"use client";

import Link from "next/link";
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
    <div className="mobile-media-hub sc-v4 sc-v4-media space-y-3" data-sc-theme="cinematic">
      <Link href="/" className="media-v5-back">← Back to Home</Link>
      <header className="py-3"><p className="media-v5-label">Shanah City Media</p><h1 className="media-v5-heading">Watch &amp; Listen</h1><p className="text-sm leading-relaxed text-white/70">Experience worship, messages and moments from Shanah City.</p><Link href="/sermons" className="media-v5-back mt-4">Latest sermons →</Link></header>
      <MobileMediaHero
        hideTitle
        tab={tab}
        anyLive={anyLive}
        clipsCount={clips.length}
        churchImages={churchImages}
      />

      <MobileTabPills
        className="mb-0.5"
        variant="cinematic"
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
