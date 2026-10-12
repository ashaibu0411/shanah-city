"use client";

import {
  getYouTubeClipThumbnail,
} from "@/lib/media-clips-utils";
import {
  formatSegmentRangeLabel,
  getYouTubeEmbedUrlWithSegment,
  getYouTubeWatchUrlWithSegment,
} from "@/lib/worship-youtube-timestamp-utils";

type WorshipYouTubeReferenceProps = {
  videoId: string;
  title?: string;
  compact?: boolean;
  startSeconds?: number;
  endSeconds?: number;
};

export function WorshipYouTubeReference({
  videoId,
  title,
  compact = false,
  startSeconds,
  endSeconds,
}: WorshipYouTubeReferenceProps) {
  const watchUrl = getYouTubeWatchUrlWithSegment(videoId, startSeconds, endSeconds);
  const segmentLabel = formatSegmentRangeLabel(startSeconds, endSeconds);

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
        Watch on YouTube{segmentLabel ? ` (${segmentLabel})` : ""}
      </a>
    );
  }

  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-night-900/5 bg-black/5">
      <div className="aspect-video w-full bg-black">
        <iframe
          title={title ? `${title} on YouTube` : "YouTube reference"}
          src={getYouTubeEmbedUrlWithSegment(videoId, startSeconds, endSeconds)}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-xs">
        <span className="font-semibold text-night-700">
          YouTube reference{segmentLabel ? ` · ${segmentLabel}` : ""}
        </span>
        <a
          href={watchUrl}
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-red-700 underline"
        >
          Open on YouTube
        </a>
      </div>
      <p className="border-t border-night-900/5 px-3 py-2 text-[11px] leading-relaxed text-night-500">
        Plays in the app below. YouTube may pause when you switch apps; uploaded practice tracks use the in-app
        player and can keep playing in the background when your device allows it.
      </p>
    </div>
  );
}
