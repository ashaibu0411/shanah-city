"use client";

import { useState } from "react";
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
    <div className="space-y-4 pb-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-night-900">Media</h1>
        {anyLive ? (
          <Badge variant="live">
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
            Live
          </Badge>
        ) : null}
      </div>

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
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              tab === key
                ? "bg-night-900 text-sand-50"
                : "bg-sand-100 text-night-700"
            }`}
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
          <div className="overflow-hidden rounded-2xl bg-night-950 shadow-lg ring-1 ring-night-900/10">
            <div className="aspect-video w-full bg-night-900">
              {active ? <LiveStreamPlayer preview={active} compact /> : null}
            </div>
            <div className="border-t border-white/10 px-4 py-3 text-white">
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
                  className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold transition ${
                    selected
                      ? "bg-night-900 text-sand-50"
                      : "bg-white text-night-800 ring-1 ring-night-900/10"
                  }`}
                >
                  <span className="relative h-8 w-12 overflow-hidden rounded-md bg-night-900">
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
            className="flex w-full items-center justify-center rounded-xl bg-sand-100 px-4 py-3 text-sm font-semibold text-night-900 ring-1 ring-night-900/5"
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
        <div className="rounded-2xl bg-sand-100 p-4 ring-1 ring-night-900/5">
          <p className="text-xs font-bold uppercase tracking-wide text-night-500">Follow</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {followLinks.map((link) => (
              <ExternalLink
                key={link.url}
                href={link.url}
                className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-night-800 ring-1 ring-night-900/10"
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
