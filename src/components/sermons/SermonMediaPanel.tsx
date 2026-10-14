"use client";

import Image from "next/image";
import { useState } from "react";
import { ChatYouTubeEmbed } from "@/components/chat/ChatYouTubeEmbed";
import { useSermonPlayer } from "@/components/sermons/SermonPlayerProvider";
import type { SermonVideo } from "@/lib/youtube-sermons-server";

type SermonMediaPanelProps = {
  video: SermonVideo;
  title: string;
  thumbnail: string;
  compact?: boolean;
  className?: string;
};

export function SermonMediaPanel({
  video,
  title,
  thumbnail,
  compact = false,
  className = "",
}: SermonMediaPanelProps) {
  const [showVideo, setShowVideo] = useState(false);
  const { playAudio, loading, error, isCurrent, pause, resume, paused, playing } = useSermonPlayer();
  const listening = isCurrent(video.id);

  return (
    <div className={className}>
      {showVideo ? (
        <div className={compact ? "p-2" : "p-3 md:p-4"}>
          <ChatYouTubeEmbed
            videoId={video.id}
            title={title}
            vertical={false}
            className="!mt-0 !max-w-none w-full"
          />
          <button
            type="button"
            className="mt-2 text-xs font-semibold text-sand-200 underline"
            onClick={() => setShowVideo(false)}
          >
            Hide video
          </button>
        </div>
      ) : (
        <div className={`relative ${compact ? "aspect-video" : "aspect-video md:min-h-[280px] md:aspect-auto md:h-full"}`}>
          <Image src={thumbnail} alt="" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
          <div className="absolute inset-0 bg-gradient-to-t from-night-950/70 via-night-950/10 to-night-950/20" />
          <div className="absolute inset-x-0 bottom-0 flex flex-wrap gap-2 p-4">
            <button
              type="button"
              onClick={() => setShowVideo(true)}
              className="inline-flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-sm font-semibold text-night-900 shadow-lg"
            >
              <span aria-hidden>▶</span> Watch
            </button>
            <button
              type="button"
              disabled={loading && !listening}
              onClick={() => {
                if (listening && playing) {
                  if (paused) resume();
                  else pause();
                  return;
                }
                void playAudio(video);
              }}
              className="inline-flex items-center gap-2 rounded-full bg-night-900/85 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/25 backdrop-blur-sm"
            >
              {loading && !listening ? "Loading…" : listening && playing && !paused ? "Pause audio" : listening && paused ? "Resume audio" : "Listen"}
            </button>
          </div>
        </div>
      )}
      {error ? <p className="px-4 py-2 text-xs text-amber-200">{error}</p> : null}
    </div>
  );
}
