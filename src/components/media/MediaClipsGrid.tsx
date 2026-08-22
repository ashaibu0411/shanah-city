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
  layout?: "default" | "mobile";
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

export function MediaClipsGrid({ clips, browseLinks, compact, layout = "default" }: MediaClipsGridProps) {
  const isMobile = layout === "mobile";
  const [activeId, setActiveId] = useState<string | null>(clips[0]?.id ?? null);
  const [started, setStarted] = useState(false);

  const activeClip = useMemo(
    () => clips.find((clip) => clip.id === activeId) ?? null,
    [clips, activeId],
  );

  if (clips.length === 0) {
    return (
      <div className="space-y-3">
        <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-night-950 via-night-900 to-night-800 p-5 text-white shadow-app-lg ring-1 ring-night-900/10">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-sand-300/80">
            Shorts
          </p>
          <h3 className="mt-1.5 font-display text-xl font-semibold">Clips are on the way</h3>
          <p className="mt-2 text-sm leading-snug text-white/65">
            Worship moments and highlights will land here. Until then, catch new shorts on YouTube
            and Instagram.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {browseLinks.map((link) => (
            <ExternalLink
              key={link.id}
              href={link.url}
              className="rounded-2xl bg-night-900 p-4 text-white shadow-app-md transition active:scale-[0.98]"
            >
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/50">
                {link.platform}
              </p>
              <p className="mt-1.5 font-display text-base font-semibold leading-tight">{link.label}</p>
              <p className="mt-2 text-xs font-semibold text-sand-300">Open ↗</p>
            </ExternalLink>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={isMobile ? "space-y-3" : "space-y-5"}>
      {activeClip ? (
        <div className="overflow-hidden rounded-2xl bg-night-950 shadow-app-lg ring-1 ring-night-900/10">
          <div
            className={`mx-auto aspect-[9/16] w-full bg-black ${
              isMobile ? "max-h-[min(68vh,620px)]" : "max-h-[min(72vh,680px)] max-w-[24rem]"
            }`}
          >
            <ClipPlayer clip={activeClip} autoPlay={started} />
          </div>
          <div className="border-t border-white/8 bg-gradient-to-r from-night-950 via-night-900 to-night-800 px-3.5 py-3 text-white">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sand-300/80">
              {mediaClipPlatformLabel(activeClip.platform)}
            </p>
            <p className={`mt-0.5 font-display font-semibold leading-tight ${isMobile ? "text-lg" : "text-xl"}`}>
              {activeClip.title}
            </p>
          </div>
        </div>
      ) : null}

      <div>
        <p className="mb-2 px-0.5 text-[11px] font-bold uppercase tracking-[0.22em] text-night-500">
          More shorts
        </p>
        <div className={`grid gap-2.5 ${isMobile ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"}`}>
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
                className={`group overflow-hidden rounded-xl text-left shadow-app-sm transition active:scale-[0.98] ${
                  selected
                    ? "ring-2 ring-night-900 ring-offset-2 ring-offset-sand-50"
                    : "ring-1 ring-night-900/10"
                }`}
              >
                <div className="relative aspect-[9/16] bg-night-900">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={clipThumbnail(clip)}
                    alt={clip.title}
                    decoding="async"
                    className="mobile-media h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-night-950/80 via-transparent to-transparent" />
                  <span className="absolute left-2 top-2 rounded-full bg-black/40 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
                    {mediaClipPlatformLabel(clip.platform)}
                  </span>
                  <span className="absolute bottom-2 left-1/2 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full bg-white/95 text-[10px] text-night-900 shadow-md">
                    ▶
                  </span>
                </div>
                <p className="line-clamp-2 bg-white px-2 py-1.5 text-[11px] font-semibold leading-snug text-night-900">
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
