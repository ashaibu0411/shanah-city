"use client";

import { useState } from "react";
import type { CommunityStatusMusic } from "@/lib/member-types";
import { getYouTubeEmbedUrlWithSegment } from "@/lib/worship-youtube-timestamp-utils";

type CommunityStoryMusicAttachProps = {
  music: CommunityStatusMusic;
};

export function CommunityStoryMusicAttach({ music }: CommunityStoryMusicAttachProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="pointer-events-auto absolute inset-x-0 bottom-20 z-20 px-3">
      <div className="rounded-2xl bg-black/75 px-3 py-2 text-white shadow-lg ring-1 ring-white/10 backdrop-blur-sm">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-2 text-left"
          onClick={() => setExpanded((open) => !open)}
        >
          <span className="min-w-0 truncate text-sm font-semibold">
            ♪ {music.title} · {music.artist}
          </span>
          <span className="shrink-0 text-xs font-semibold text-white/80">
            {expanded ? "Hide" : "Play"}
          </span>
        </button>
        {expanded ? (
          <div className="mt-2 overflow-hidden rounded-xl">
            <iframe
              title={`${music.title} by ${music.artist}`}
              src={getYouTubeEmbedUrlWithSegment(music.youtubeVideoId)}
              className="aspect-video w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
