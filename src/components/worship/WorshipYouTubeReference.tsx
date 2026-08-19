"use client";

import {
  getYouTubeClipEmbedUrl,
  getYouTubeClipThumbnail,
  getYouTubeVideoWatchUrl,
} from "@/lib/media-clips-utils";

type WorshipYouTubeReferenceProps = {
  videoId: string;
  title?: string;
  compact?: boolean;
};

export function WorshipYouTubeReference({
  videoId,
  title,
  compact = false,
}: WorshipYouTubeReferenceProps) {
  const watchUrl = getYouTubeVideoWatchUrl(videoId);

  if (compact) {
    return (
      <a
        href={watchUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-800 ring-1 ring-red-100 hover:bg-red-100"
      >
        <img
          src={getYouTubeClipThumbnail(videoId)}
          alt=""
          className="h-5 w-8 rounded object-cover"
        />
        Watch on YouTube
      </a>
    );
  }

  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-night-900/5 bg-black/5">
      <div className="aspect-video w-full bg-black">
        <iframe
          title={title ? `${title} on YouTube` : "YouTube reference"}
          src={getYouTubeClipEmbedUrl(videoId)}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-xs">
        <span className="font-semibold text-night-700">YouTube reference</span>
        <a
          href={watchUrl}
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-red-700 underline"
        >
          Open on YouTube
        </a>
      </div>
    </div>
  );
}
