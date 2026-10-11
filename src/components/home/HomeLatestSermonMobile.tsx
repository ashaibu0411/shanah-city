"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ChatYouTubeEmbed } from "@/components/chat/ChatYouTubeEmbed";
import { latestSermon } from "@/lib/site";
import { formatSermonDate, type SermonVideo } from "@/lib/youtube-sermons-server";

function resolveYouTubeVideoId(video: SermonVideo | null): string | null {
  if (video?.id?.trim()) return video.id.trim();
  const url = video?.watchUrl ?? latestSermon.youtubeUrl;
  const match = url.match(/(?:[?&]v=|\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match?.[1] ?? null;
}

export function HomeLatestSermonMobile({ video }: { video: SermonVideo | null }) {
  const [playing, setPlaying] = useState(false);
  const title = video?.title ?? latestSermon.title;
  const youtubeUrl = video?.watchUrl ?? latestSermon.youtubeUrl;
  const dateLabel = video ? formatSermonDate(video.publishedAt) : latestSermon.date;
  const thumbnail = video?.thumbnailUrl ?? "/sermons/latest-message.svg";
  const useRemoteThumbnail = Boolean(video?.thumbnailUrl);
  const videoId = useMemo(() => resolveYouTubeVideoId(video), [video]);

  return (
    <section>
      <div className="mb-2.5 flex items-end justify-between gap-2 px-0.5">
        <h2 className="mobile-section-title">Latest sermon</h2>
        <Link href="/sermons" className="text-xs font-semibold text-teal-800 dark:text-teal-300">
          See all
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-night-900/8 dark:bg-[var(--color-surface)] dark:ring-white/10">
        {playing && videoId ? (
          <div className="p-3">
            <ChatYouTubeEmbed
              videoId={videoId}
              title={title}
              vertical={false}
              className="!mt-0 !max-w-none"
            />
            <button
              type="button"
              className="mt-2 text-xs font-semibold text-night-600 underline dark:text-sand-400"
              onClick={() => setPlaying(false)}
            >
              Hide player
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="group relative block w-full text-left"
            onClick={() => videoId && setPlaying(true)}
            disabled={!videoId}
          >
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-night-900">
              {useRemoteThumbnail ? (
                <Image
                  src={thumbnail}
                  alt=""
                  fill
                  className="object-cover transition duration-500 group-hover:scale-[1.03]"
                  sizes="(max-width: 512px) 100vw, 480px"
                />
              ) : (
                <Image
                  src={thumbnail}
                  alt=""
                  fill
                  unoptimized
                  className="object-cover"
                  sizes="(max-width: 512px) 100vw, 480px"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-night-950/85 via-night-950/25 to-transparent" />
              <span
                className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-xl text-night-900 shadow-lg"
                aria-hidden
              >
                ▶
              </span>
              <div className="absolute inset-x-0 bottom-0 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sand-300">
                  Latest message
                </p>
                <p className="mt-1 font-display text-lg font-semibold leading-snug text-white">{title}</p>
                <p className="mt-1 text-xs text-sand-200">
                  {latestSermon.speaker} · {dateLabel}
                </p>
              </div>
            </div>
            {videoId ? (
              <p className="px-4 py-2.5 text-center text-xs font-semibold text-teal-800 dark:text-teal-300">
                Tap to play in app
              </p>
            ) : null}
          </button>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-night-900/8 px-4 py-3 dark:border-white/10">
          <p className="text-xs text-night-600 dark:text-sand-400">
            {latestSermon.speaker} · {dateLabel}
          </p>
          <a
            href={youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-teal-800 underline-offset-2 hover:underline dark:text-teal-300"
          >
            Open on YouTube
          </a>
        </div>
      </div>
    </section>
  );
}
