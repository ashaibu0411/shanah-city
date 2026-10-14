"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { SermonYouTubeEmbed } from "@/components/sermons/SermonYouTubeEmbed";
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
  const { permissions } = useAuth();
  const { playAudio, loading, error, isCurrent, pause, resume, paused, playing } = useSermonPlayer();
  const listening = isCurrent(video.id);

  return (
    <div className={className}>
      {showVideo ? (
        <div className={compact ? "p-2" : "p-3 md:p-4"}>
          <SermonYouTubeEmbed videoId={video.id} title={title} className="w-full" />
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
          <div className="absolute inset-x-0 bottom-0 z-10 flex flex-wrap gap-2 p-4">
            <button
              type="button"
              onClick={() => setShowVideo(true)}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-sm font-semibold text-night-900 shadow-lg"
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
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-night-900/85 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/25 backdrop-blur-sm disabled:opacity-70"
            >
              {loading && !listening ? "Loading…" : listening && playing && !paused ? "Pause audio" : listening && paused ? "Resume audio" : "Listen"}
            </button>
          </div>
        </div>
      )}
      {error ? (
        <div
          className="mx-3 mb-3 mt-1 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium leading-relaxed text-amber-950 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-100 dark:ring-amber-800/50"
          role="alert"
        >
          <p>{error}</p>
          {permissions.canManageAdmin ? (
            <Link href="/admin/sermons" className="mt-2 inline-block font-bold text-teal-900 underline">
              Publish Listen audio for this message →
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
