"use client";

import { useMemo, useState } from "react";
import { useShanahMediaOptional } from "@/components/media/ShanahMediaPlayerProvider";
import { backgroundCapableAudioEventHandlers } from "@/lib/native-background-playback";
import { worshipRehearsalToShanahMediaItem } from "@/lib/shanah-media-helpers";
import type { ShanahMediaKind } from "@/lib/shanah-media-types";
import {
  inferWorshipAudioContentType,
  resolveWorshipAudioUrl,
} from "@/lib/worship-audio-shared";

type WorshipAudioPlayerProps = {
  src: string;
  fileName?: string;
  className?: string;
  /** When set, opens playback in Shanah Media Player instead of inline controls. */
  globalPlayer?: {
    id: string;
    title: string;
    artist?: string;
    kind?: ShanahMediaKind;
    href?: string;
    mediaType?: "audio" | "video";
  };
};

export function WorshipAudioPlayer({ src, fileName, className, globalPlayer }: WorshipAudioPlayerProps) {
  const resolvedSrc = useMemo(() => resolveWorshipAudioUrl(src), [src]);
  const contentType = inferWorshipAudioContentType(fileName ?? src);
  const [failed, setFailed] = useState(false);
  const media = useShanahMediaOptional();

  if (!resolvedSrc) return null;

  if (globalPlayer && media) {
    const item = worshipRehearsalToShanahMediaItem({
      id: globalPlayer.id,
      src,
      fileName,
      title: globalPlayer.title,
      artist: globalPlayer.artist,
      kind: globalPlayer.kind,
      href: globalPlayer.href,
      mediaType: globalPlayer.mediaType,
    });
    const current = item ? media.isCurrent(item.id) : false;
    const busy = current && (media.playing || media.loading);
    const isVideoEntry = globalPlayer.mediaType === "video" && Boolean(item?.hostedVideoUrl);

    const playAudio = () => {
      if (!item) return;
      if (current && media.playbackMode === "audio" && media.playing) {
        if (media.paused) media.resume();
        else media.pause();
        return;
      }
      void media.play(item, { mode: "audio" });
    };

    const playVideo = () => {
      if (!item?.hostedVideoUrl) return;
      if (current && media.playbackMode === "video" && media.playing) {
        if (media.paused) media.resume();
        else media.pause();
        return;
      }
      void media.play(item, { mode: "video" });
    };

    return (
      <div className={className}>
        <div className="flex flex-wrap items-center gap-2">
          {isVideoEntry ? (
            <button
              type="button"
              className="inline-flex min-h-[44px] items-center rounded-full bg-night-900 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/15"
              disabled={media.loading && !current}
              onClick={playVideo}
            >
              {media.loading && !current
                ? "Loading…"
                : current && media.playbackMode === "video" && media.playing && !media.paused
                  ? "Pause video"
                  : current && media.playbackMode === "video" && media.paused
                    ? "Resume video"
                    : "Watch"}
            </button>
          ) : null}
          <button
            type="button"
            className="inline-flex min-h-[44px] items-center rounded-full bg-night-900 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/15"
            disabled={media.loading && !current}
            onClick={playAudio}
          >
            {media.loading && !current
              ? "Loading…"
              : current && media.playbackMode === "audio" && media.playing && !media.paused
                ? "Pause"
                : current && media.paused
                  ? "Resume"
                  : isVideoEntry
                    ? "Listen in app"
                    : "Listen in app"}
          </button>
          {busy ? (
            <button
              type="button"
              className="min-h-[44px] rounded-full px-3 text-sm font-semibold text-sand-600 underline"
              onClick={() => media.setFullPlayerOpen(true)}
            >
              Expand player
            </button>
          ) : null}
        </div>
        {media.error && current ? (
          <p className="mt-1 text-xs leading-relaxed text-red-600">{media.error}</p>
        ) : null}
      </div>
    );
  }

  const backgroundHandlers = backgroundCapableAudioEventHandlers();

  return (
    <div>
      <audio
        key={resolvedSrc}
        controls
        preload="metadata"
        playsInline
        className={className}
        onError={() => setFailed(true)}
        onLoadedData={() => setFailed(false)}
        {...backgroundHandlers}
      >
        <source src={resolvedSrc} type={contentType} />
        <source src={resolvedSrc} />
      </audio>
      {failed && (
        <p className="mt-1 text-xs leading-relaxed text-red-600">
          This track could not play here. If it was recorded on another phone, try opening on
          Android/desktop or re-record / upload as m4a or mp3 (iPhone often cannot play webm).
        </p>
      )}
    </div>
  );
}
