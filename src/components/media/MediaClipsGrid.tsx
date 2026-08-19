"use client";

import { useMemo, useState } from "react";
import type { MediaClip } from "@/lib/types";
import {
  getYouTubeClipEmbedUrl,
  getYouTubeClipThumbnail,
  isUploadedMediaClip,
  mediaClipPlatformLabel,
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
  compact?: boolean;
};

function clipThumbnail(clip: MediaClip) {
  if (clip.thumbnail) return clip.thumbnail;
  if (clip.videoId) return getYouTubeClipThumbnail(clip.videoId);
  return "/streams/youtube-shanah-city.svg";
}

function ClipPlayer({ clip, autoPlay }: { clip: MediaClip; autoPlay: boolean }) {
  if (isUploadedMediaClip(clip)) {
    return (
      <video
        key={clip.id}
        src={clip.url}
        poster={clip.thumbnail}
        controls
        playsInline
        autoPlay={autoPlay}
        className="h-full w-full bg-black object-contain"
      />
    );
  }

  if (clip.videoId) {
    const src = autoPlay
      ? `${getYouTubeClipEmbedUrl(clip.videoId)}&autoplay=1`
      : getYouTubeClipEmbedUrl(clip.videoId);
    return (
      <iframe
        src={src}
        title={clip.title}
        className="h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
        allowFullScreen
        loading="lazy"
      />
    );
  }

  return (
    <div className="flex h-full flex-col items-center justify-center bg-night-950 px-6 text-center text-white">
      <p className="font-display text-xl font-semibold">{clip.title}</p>
      <ExternalLink
        href={clip.url}
        className="mt-4 rounded-full bg-white px-4 py-2 text-sm font-semibold text-night-900"
      >
        Watch on {mediaClipPlatformLabel(clip.platform)} ↗
      </ExternalLink>
    </div>
  );
}

export function MediaClipsGrid({ clips, browseLinks, compact }: MediaClipsGridProps) {
  const [activeId, setActiveId] = useState<string | null>(clips[0]?.id ?? null);
  const [started, setStarted] = useState(false);

  const activeClip = useMemo(
    () => clips.find((clip) => clip.id === activeId) ?? null,
    [clips, activeId],
  );

  if (clips.length === 0) {
    return (
      <div className="space-y-4">
        <div className="overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-night-950 via-violet-950 to-rose-950 p-6 text-white shadow-xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-amber-200/80">
            Shorts
          </p>
          <h3 className="mt-2 font-display text-2xl font-semibold">Clips are on the way</h3>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-white/70">
            Worship moments, highlights, and encouragement will land here. Until then, catch new
            shorts on YouTube and Instagram.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {browseLinks.map((link) => (
            <ExternalLink
              key={link.id}
              href={link.url}
              className="rounded-[1.5rem] bg-gradient-to-br from-night-900 to-indigo-950 p-5 text-white shadow-lg shadow-indigo-950/20 transition hover:opacity-95"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-white/60">
                {link.platform}
              </p>
              <p className="mt-2 font-display text-lg font-semibold">{link.label}</p>
              <p className="mt-2 text-sm text-white/70">Open ↗</p>
            </ExternalLink>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {activeClip ? (
        <div className="overflow-hidden rounded-[1.75rem] bg-night-950 shadow-2xl shadow-indigo-950/30 ring-1 ring-white/10">
          <div className="mx-auto aspect-[9/16] max-h-[min(72vh,680px)] w-full max-w-[24rem] bg-black">
            <ClipPlayer clip={activeClip} autoPlay={started} />
          </div>
          <div className="border-t border-white/10 bg-gradient-to-r from-violet-950 via-fuchsia-950 to-night-950 px-4 py-4 text-white">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-200/80">
              {mediaClipPlatformLabel(activeClip.platform)}
            </p>
            <p className="mt-1 font-display text-xl font-semibold leading-tight">
              {activeClip.title}
            </p>
          </div>
        </div>
      ) : null}

      <div>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-violet-700/80">
              Library
            </p>
            <h3 className="mt-1 font-display text-lg font-semibold text-night-900">More shorts</h3>
          </div>
          <p className="text-xs font-semibold text-night-500">{clips.length} clips</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {clips.map((clip) => {
            const selected = clip.id === activeId;
            return (
              <button
                key={clip.id}
                type="button"
                onClick={() => {
                  setActiveId(clip.id);
                  setStarted(true);
                }}
                className={`group overflow-hidden rounded-[1.35rem] text-left shadow-sm transition ${
                  selected
                    ? "ring-2 ring-violet-600 ring-offset-2 ring-offset-sand-50"
                    : "ring-1 ring-night-900/8 hover:-translate-y-0.5 hover:shadow-lg"
                }`}
              >
                <div className="relative aspect-[9/16] bg-night-900">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={clipThumbnail(clip)}
                    alt={clip.title}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-night-950 via-night-950/20 to-transparent" />
                  <span className="absolute left-2 top-2 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-md">
                    {mediaClipPlatformLabel(clip.platform)}
                  </span>
                  <span className="absolute bottom-3 left-1/2 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full bg-white/95 text-night-900 shadow-lg">
                    ▶
                  </span>
                </div>
                <p className="line-clamp-2 bg-white px-2.5 py-2 text-xs font-semibold text-night-900">
                  {clip.title}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {!compact ? (
        <div className="flex flex-wrap gap-2">
          {browseLinks.map((link) => (
            <ExternalLink
              key={link.id}
              href={link.url}
              className="rounded-full bg-night-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-night-800"
            >
              More on {link.label} ↗
            </ExternalLink>
          ))}
        </div>
      ) : null}
    </div>
  );
}
