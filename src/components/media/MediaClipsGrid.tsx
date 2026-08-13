"use client";

import { useMemo, useState } from "react";
import type { MediaClip } from "@/lib/types";
import {
  getYouTubeClipEmbedUrl,
  getYouTubeClipThumbnail,
} from "@/lib/media-clips-utils";
import { ExternalLink } from "@/components/ui";

type MediaClipsGridProps = {
  clips: MediaClip[];
  browseLinks: Array<{
    id: string;
    label: string;
    url: string;
    platform: string;
  }>;
};

function clipThumbnail(clip: MediaClip) {
  if (clip.thumbnail) return clip.thumbnail;
  if (clip.videoId) return getYouTubeClipThumbnail(clip.videoId);
  return "/streams/youtube-shanah-city.svg";
}

export function MediaClipsGrid({ clips, browseLinks }: MediaClipsGridProps) {
  const [activeId, setActiveId] = useState<string | null>(clips[0]?.id ?? null);

  const activeClip = useMemo(
    () => clips.find((clip) => clip.id === activeId) ?? null,
    [clips, activeId],
  );

  if (clips.length === 0) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl bg-sand-100 p-6 text-sm text-night-700 ring-1 ring-night-900/5">
          <p className="font-semibold text-night-900">Short clips coming soon</p>
          <p className="mt-2 leading-relaxed">
            Add clips in <code className="rounded bg-white px-1">data/media-clips.json</code>{" "}
            or set <code className="rounded bg-white px-1">NEXT_PUBLIC_YOUTUBE_CLIP_IDS</code> in
            your env file. Until then, browse new shorts on YouTube and Instagram.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {browseLinks.map((link) => (
            <ExternalLink
              key={link.id}
              href={link.url}
              className="rounded-2xl bg-gradient-to-br from-night-900 to-night-800 p-5 text-white shadow-sm transition hover:opacity-95"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-white/70">
                {link.platform}
              </p>
              <p className="mt-2 font-display text-lg font-semibold">{link.label}</p>
              <p className="mt-2 text-sm text-white/75">Open ↗</p>
            </ExternalLink>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activeClip?.videoId ? (
        <div className="overflow-hidden rounded-2xl bg-night-950 shadow-lg ring-1 ring-night-900/10">
          <div className="mx-auto aspect-[9/16] max-h-[min(70vh,640px)] w-full max-w-sm bg-black">
            <iframe
              src={getYouTubeClipEmbedUrl(activeClip.videoId)}
              title={activeClip.title}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
              allowFullScreen
              loading="lazy"
            />
          </div>
          <div className="p-4 text-white">
            <p className="font-display text-lg font-semibold">{activeClip.title}</p>
            <p className="mt-1 text-sm text-white/70 capitalize">{activeClip.platform}</p>
          </div>
        </div>
      ) : activeClip ? (
        <div className="rounded-2xl bg-white p-5 ring-1 ring-night-900/5">
          <p className="font-semibold text-night-900">{activeClip.title}</p>
          <ExternalLink
            href={activeClip.url}
            className="mt-3 inline-flex rounded-xl bg-night-900 px-4 py-2.5 text-sm font-semibold text-sand-50"
          >
            Watch on {activeClip.platform} ↗
          </ExternalLink>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {clips.map((clip) => {
          const selected = clip.id === activeId;
          return (
            <button
              key={clip.id}
              type="button"
              onClick={() => setActiveId(clip.id)}
              className={`overflow-hidden rounded-2xl text-left ring-1 transition ${
                selected
                  ? "ring-2 ring-night-900 ring-offset-2"
                  : "ring-night-900/10 hover:ring-night-900/20"
              }`}
            >
              <div className="relative aspect-[9/16] bg-night-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={clipThumbnail(clip)}
                  alt={clip.title}
                  className="h-full w-full object-cover"
                />
                <span className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold uppercase text-white">
                  {clip.platform}
                </span>
              </div>
              <p className="line-clamp-2 bg-white p-2 text-xs font-semibold text-night-900">
                {clip.title}
              </p>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        {browseLinks.map((link) => (
          <ExternalLink
            key={link.id}
            href={link.url}
            className="rounded-full bg-sand-100 px-3 py-1.5 text-xs font-semibold text-night-800 hover:bg-sand-200"
          >
            More on {link.label} ↗
          </ExternalLink>
        ))}
      </div>
    </div>
  );
}
