"use client";

import { useState } from "react";
import { MobilePageHero } from "@/components/app/MobilePageHero";
import { LiveStreamPlayer } from "@/components/live/LiveStreamPlayer";
import { StreamPreviewImage } from "@/components/live/StreamPreviewImage";
import { MediaClipUploadPanel } from "@/components/media/MediaClipUploadPanel";
import { MediaClipsGrid } from "@/components/media/MediaClipsGrid";
import { liveStream, site } from "@/lib/site";
import { streamPreviews } from "@/lib/streams";
import type { MediaClip, MediaTab, StreamPreview } from "@/lib/types";
import { Badge, ExternalLink } from "@/components/ui";

type MobileMediaHubProps = {
  clips: MediaClip[];
  browseLinks: Array<{
    id: string;
    label: string;
    url: string;
    platform: string;
  }>;
};

const followLinks = [
  { label: "YouTube", url: site.social.youtube },
  ...streamPreviews
    .filter((preview) => preview.platform !== "YouTube")
    .map((preview) => ({
      label: preview.label,
      url: preview.url,
    })),
];

export function MobileMediaHub({ clips, browseLinks }: MobileMediaHubProps) {
  const [tab, setTab] = useState<MediaTab>("live");
  const [active, setActive] = useState<StreamPreview>(streamPreviews[0]);

  const anyLive =
    liveStream.isLive ||
    liveStream.youtube.isLive ||
    liveStream.facebook.isLive;

  return (
    <div className="space-y-4">
      <MobilePageHero
        eyebrow="Media"
        title="Watch live worship"
        description="Stream services, browse clips, and follow Shanah City on YouTube and social."
      >
        {anyLive ? (
          <Badge variant="live">
            <span className="mobile-pulse h-1.5 w-1.5 rounded-full bg-white" />
            Live now
          </Badge>
        ) : (
          <span className="mobile-chip inline-flex">YouTube · Facebook · Instagram</span>
        )}
      </MobilePageHero>

      <div className="flex gap-2">
        {(
          [
            ["live", "Live"],
            ["clips", "Clips"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={tab === key ? "mobile-tab-pill-active" : "mobile-tab-pill"}
          >
            {label}
            {key === "clips" && clips.length > 0 ? (
              <span className="ml-1.5 text-[10px] opacity-80">{clips.length}</span>
            ) : null}
          </button>
        ))}
      </div>

      {tab === "live" ? (
        <>
          <div className="mobile-spotlight-shell bg-night-950 shadow-2xl shadow-indigo-950/30">
            <div className="relative aspect-video w-full bg-night-900">
              {active ? <LiveStreamPlayer preview={active} compact /> : null}
              <div className="mobile-spotlight-mesh pointer-events-none absolute inset-0 opacity-60" aria-hidden />
            </div>
            <div className="relative border-t border-white/10 bg-gradient-to-r from-violet-950 via-fuchsia-950/95 to-indigo-950 px-4 py-3 text-white">
              <p className="truncate font-display text-lg font-semibold">
                {anyLive ? liveStream.title : active.label}
              </p>
              <p className="mt-0.5 text-xs text-white/60">{active.platform}</p>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {streamPreviews.map((preview) => {
              const selected = active.id === preview.id;
              return (
                <button
                  key={preview.id}
                  type="button"
                  onClick={() => setActive(preview)}
                  className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold transition active:scale-[0.98] ${
                    selected
                      ? "bg-gradient-to-br from-violet-600 to-fuchsia-700 text-white shadow-lg shadow-violet-500/30"
                      : "mobile-card bg-white text-night-800"
                  }`}
                >
                  <span className="relative h-8 w-12 overflow-hidden rounded-md bg-night-900 ring-1 ring-white/10">
                    <StreamPreviewImage
                      preview={preview}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </span>
                  <span className="max-w-[6.5rem] truncate">{preview.label}</span>
                </button>
              );
            })}
          </div>

          <ExternalLink
            href={active.url}
            className="flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-rose-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-fuchsia-500/25 transition active:scale-[0.99]"
          >
            Open on {active.platform} ↗
          </ExternalLink>
        </>
      ) : (
        <>
          <MediaClipUploadPanel />
          <MediaClipsGrid clips={clips} browseLinks={browseLinks} compact />
        </>
      )}

      {tab === "live" ? (
        <div className="mobile-card rounded-[1.25rem] p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-violet-700/80">Follow</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {followLinks.map((link) => (
              <ExternalLink
                key={link.url}
                href={link.url}
                className="rounded-full bg-gradient-to-r from-sky-500 to-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-indigo-500/20"
              >
                {link.label}
              </ExternalLink>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
