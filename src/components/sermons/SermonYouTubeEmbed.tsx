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
    controls: "1",
    iv_load_policy: "3",
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
      <div className="border-t border-white/10 px-3 py-2">
        <a
          href={watchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold text-teal-300 hover:underline"
        >
          Open on YouTube
        </a>
        <p className="mt-1.5 text-[11px] leading-snug text-sand-400">
          YouTube Premium in the YouTube app may allow background play there. In Shanah City, use Listen for
          in-app background audio.
        </p>
      </div>
    </div>
  );
}
