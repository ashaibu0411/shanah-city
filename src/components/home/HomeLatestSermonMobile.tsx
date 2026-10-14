"use client";

import Link from "next/link";
import { SermonMediaPanel } from "@/components/sermons/SermonMediaPanel";
import { latestSermon } from "@/lib/site";
import { formatSermonDate, type SermonVideo } from "@/lib/youtube-sermons-server";

export function HomeLatestSermonMobile({ video }: { video: SermonVideo | null }) {
  const title = video?.title ?? latestSermon.title;
  const youtubeUrl = video?.watchUrl ?? latestSermon.youtubeUrl;
  const dateLabel = video ? formatSermonDate(video.publishedAt) : latestSermon.date;
  const thumbnail = video?.thumbnailUrl ?? "/sermons/latest-message.svg";

  return (
    <section>
      <div className="mb-2.5 flex items-end justify-between gap-2 px-0.5">
        <h2 className="mobile-section-title">Latest sermon</h2>
        <Link href="/sermons" className="text-xs font-semibold text-teal-800 dark:text-teal-300">
          See all
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-night-900/8 dark:bg-[var(--color-surface)] dark:ring-white/10">
        {video ? (
          <SermonMediaPanel video={video} title={title} thumbnail={thumbnail} compact className="bg-night-900" />
        ) : (
          <div className="p-6 text-sm text-night-600 dark:text-sand-300">
            Latest message loading — browse{" "}
            <a href={youtubeUrl} className="font-semibold underline">
              YouTube
            </a>
            .
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-night-900/8 px-4 py-3 dark:border-white/10">
          <div className="min-w-0">
            <p className="font-display text-sm font-semibold text-night-900 dark:text-sand-100">{title}</p>
            <p className="text-xs text-night-600 dark:text-sand-400">
              {latestSermon.speaker} · {dateLabel}
            </p>
          </div>
          <a
            href={youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-teal-800 underline-offset-2 hover:underline dark:text-teal-300"
          >
            YouTube
          </a>
        </div>
      </div>
    </section>
  );
}
