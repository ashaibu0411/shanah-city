"use client";

import { getYouTubeClipEmbedUrl, getYouTubeVideoWatchUrl } from "@/lib/media-clips-utils";

type ChatYouTubeEmbedProps = {
  videoId: string;
  title?: string;
  vertical?: boolean;
};

export function ChatYouTubeEmbed({ videoId, title, vertical = true }: ChatYouTubeEmbedProps) {
  const watchUrl = getYouTubeVideoWatchUrl(videoId);
  const embedUrl = `${getYouTubeClipEmbedUrl(videoId)}&rel=0`;

  return (
    <div className="mt-2 w-full max-w-[min(240px,72vw)] overflow-hidden rounded-2xl border border-black/8 bg-black dark:border-white/10">
      <div className={vertical ? "aspect-[9/16] w-full" : "aspect-video w-full"}>
        <iframe
          src={embedUrl}
          title={title ?? "YouTube video"}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
          allowFullScreen
          loading="lazy"
        />
      </div>
      <a
        href={watchUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block px-3 py-2 text-[11px] font-semibold text-[#0095f6] hover:underline"
        onClick={(event) => event.stopPropagation()}
      >
        Open on YouTube
      </a>
    </div>
  );
}
