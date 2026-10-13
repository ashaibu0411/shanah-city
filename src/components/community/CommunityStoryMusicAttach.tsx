"use client";

import { useMemo } from "react";
import type { CommunityStatusMusic } from "@/lib/member-types";
import { findCommunityStoryMusicTrack } from "@/lib/community-story-music";
import { getYouTubeStoryBackgroundEmbedSrc } from "@/lib/worship-youtube-timestamp-utils";

type CommunityStoryMusicAttachProps = {
  music: CommunityStatusMusic;
  paused: boolean;
  soundOn: boolean;
  onToggleSound?: () => void;
};

export function CommunityStoryMusicAttach({
  music,
  paused,
  soundOn,
  onToggleSound,
}: CommunityStoryMusicAttachProps) {
  const catalogTrack = useMemo(
    () => findCommunityStoryMusicTrack(music.trackId),
    [music.trackId],
  );
  const startSeconds = catalogTrack?.startSeconds;

  const embedSrc = useMemo(
    () =>
      getYouTubeStoryBackgroundEmbedSrc(
        music.youtubeVideoId,
        { paused, soundOn },
        startSeconds,
      ),
    [music.youtubeVideoId, paused, soundOn, startSeconds],
  );

  const embedKey = `${music.trackId}-${paused ? "p" : "r"}-${soundOn ? "on" : "off"}`;

  return (
    <>
      <iframe
        key={embedKey}
        title={`${music.title} by ${music.artist}`}
        src={embedSrc}
        className="pointer-events-none absolute left-0 top-0 h-px w-px opacity-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        tabIndex={-1}
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-[4.75rem] z-20 flex justify-center px-4">
        <div className="pointer-events-auto max-w-full rounded-full bg-black/55 px-3 py-1.5 shadow-lg ring-1 ring-white/15 backdrop-blur-md">
          <button
            type="button"
            className="flex max-w-[min(100vw-3rem,20rem)] items-center gap-2 text-left"
            onClick={() => onToggleSound?.()}
            aria-label={soundOn ? "Mute story music" : "Play story music"}
          >
            <span className="shrink-0 text-sm" aria-hidden>
              {soundOn ? "🔊" : "🔇"}
            </span>
            <span className="min-w-0 truncate text-xs font-semibold text-white">
              {music.title} · {music.artist}
            </span>
          </button>
        </div>
      </div>
    </>
  );
}
