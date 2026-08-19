"use client";

import { useState } from "react";
import { LiveStreamPlayer } from "@/components/live/LiveStreamPlayer";
import { StreamPreviewImage } from "@/components/live/StreamPreviewImage";
import { liveStream, site } from "@/lib/site";
import { streamPreviews } from "@/lib/streams";
import type { StreamPreview } from "@/lib/types";
import { Badge, ExternalLink } from "@/components/ui";

const followLinks = [
  { label: "YouTube", url: site.social.youtube },
  ...site.social.instagram.map((account) => ({
    label: `@${account.handle}`,
    url: account.url,
  })),
  ...site.social.facebook.map((account) => ({
    label: account.name,
    url: account.url,
  })),
];

export function MediaLiveStage() {
  const [active, setActive] = useState<StreamPreview>(streamPreviews[0]);
  const anyLive =
    liveStream.isLive ||
    liveStream.youtube.isLive ||
    liveStream.facebook.isLive;

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-[1.75rem] bg-night-950 shadow-2xl shadow-indigo-950/35 ring-1 ring-white/10">
        <div className="relative aspect-video w-full bg-black">
          <LiveStreamPlayer preview={active} compact />
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-3">
            {anyLive ? (
              <Badge variant="live">
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
                Live now
              </Badge>
            ) : (
              <span className="rounded-full bg-black/45 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white/90 backdrop-blur-md">
                Watch anytime
              </span>
            )}
            <span className="rounded-full bg-black/45 px-3 py-1 text-[11px] font-semibold text-white/80 backdrop-blur-md">
              {active.platform}
            </span>
          </div>
        </div>
        <div className="relative border-t border-white/10 bg-gradient-to-r from-violet-950 via-fuchsia-950 to-indigo-950 px-4 py-4 text-white">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-200/80">
            {anyLive ? "Streaming" : "Featured"}
          </p>
          <h2 className="mt-1 font-display text-2xl font-semibold leading-tight">
            {anyLive ? liveStream.title : active.label}
          </h2>
          <p className="mt-1 text-sm text-white/65">
            {anyLive ? liveStream.scheduledAt : `${active.platform} · Shanah City`}
          </p>
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
              className={`flex shrink-0 items-center gap-2 rounded-2xl px-3 py-2 text-left transition ${
                selected
                  ? "bg-gradient-to-br from-violet-600 to-fuchsia-700 text-white shadow-lg shadow-violet-500/30"
                  : "bg-white text-night-800 ring-1 ring-night-900/8 hover:bg-sand-50"
              }`}
            >
              <span className="relative h-9 w-14 overflow-hidden rounded-lg bg-night-900">
                <StreamPreviewImage
                  preview={preview}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </span>
              <span className="max-w-[7rem]">
                <span className="block truncate text-sm font-semibold">{preview.label}</span>
                <span className={`block text-[10px] font-semibold uppercase tracking-wide ${selected ? "text-white/70" : "text-night-400"}`}>
                  {preview.platform}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <ExternalLink
        href={active.url}
        className="flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-rose-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-fuchsia-500/25 transition hover:opacity-95"
      >
        Open on {active.platform} ↗
      </ExternalLink>

      <div className="rounded-[1.5rem] bg-white p-4 ring-1 ring-night-900/5">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-violet-700/80">
          Follow
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {followLinks.map((link) => (
            <ExternalLink
              key={link.url}
              href={link.url}
              className="rounded-full bg-night-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-night-800"
            >
              {link.label}
            </ExternalLink>
          ))}
        </div>
      </div>
    </div>
  );
}
