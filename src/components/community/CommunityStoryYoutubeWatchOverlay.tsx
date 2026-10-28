"use client";

import { useMemo } from "react";
import { getYouTubeStoryVisibleEmbedSrc } from "@/lib/worship-youtube-timestamp-utils";

export type StoryYoutubeWatchPayload = {
  videoId: string;
  title: string;
  artist: string;
  startSeconds: number | null;
};

type CommunityStoryYoutubeWatchOverlayProps = {
  payload: StoryYoutubeWatchPayload;
  onClose: () => void;
};

export function CommunityStoryYoutubeWatchOverlay({
  payload,
  onClose,
}: CommunityStoryYoutubeWatchOverlayProps) {
  const embedOrigin = useMemo(
    () => (typeof window !== "undefined" ? window.location.origin : undefined),
    [],
  );

  const embedSrc = getYouTubeStoryVisibleEmbedSrc(
    payload.videoId,
    { paused: false, soundOn: true },
    payload.startSeconds ?? undefined,
    embedOrigin,
  );

  return (
    <div
      className="fixed inset-0 z-[120] flex flex-col bg-black/95"
      role="dialog"
      aria-modal="true"
      aria-label={`Watch ${payload.title} on YouTube`}
    >
      <div className="flex shrink-0 items-center gap-3 border-b border-white/10 px-4 py-3">
        <button
          type="button"
          className="rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold text-white"
          onClick={onClose}
        >
          Back to story
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{payload.title}</p>
          <p className="truncate text-xs text-white/70">{payload.artist} · YouTube</p>
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4 py-6">
        <div className="w-full max-w-2xl overflow-hidden rounded-xl bg-black shadow-2xl ring-1 ring-white/15">
          <iframe
            title={`${payload.title} by ${payload.artist} on YouTube`}
            src={embedSrc}
            className="aspect-video w-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
        <p className="mt-4 max-w-md text-center text-xs text-white/60">
          Gospel music on this story opens here so your photo stays full screen. Close when you are done to continue
          the story.
        </p>
      </div>
    </div>
  );
}
