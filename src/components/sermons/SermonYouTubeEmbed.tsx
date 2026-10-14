"use client";

import { useMemo } from "react";
import { getYouTubeVideoWatchUrl } from "@/lib/media-clips-utils";

type SermonYouTubeEmbedProps = {
  videoId: string;
  title?: string;
  className?: string;
};

export function getSermonYouTubeEmbedSrc(videoId: string, origin?: string) {
  const params = new URLSearchParams({
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
    enablejsapi: "1",
    fs: "1",
  });
  if (origin) params.set("origin", origin);
  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}

export function SermonYouTubeEmbed({ videoId, title, className = "" }: SermonYouTubeEmbedProps) {
  const watchUrl = getYouTubeVideoWatchUrl(videoId);
  const embedSrc = useMemo(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : undefined;
    return getSermonYouTubeEmbedSrc(videoId, origin);
  }, [videoId]);

  return (
    <div className={`overflow-hidden rounded-2xl bg-black ring-1 ring-white/10 ${className}`}>
      <div className="aspect-video w-full">
        <iframe
          src={embedSrc}
          title={title ?? "Sermon video"}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
      <a
        href={watchUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block px-3 py-2 text-xs font-semibold text-teal-700 hover:underline dark:text-teal-300"
      >
        Open on YouTube
      </a>
    </div>
  );
}
