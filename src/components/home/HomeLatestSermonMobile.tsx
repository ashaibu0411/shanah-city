"use client";

import Image from "next/image";
import Link from "next/link";
import { latestSermon } from "@/lib/site";
import { formatSermonDate, type SermonVideo } from "@/lib/youtube-sermons-server";

export function HomeLatestSermonMobile({ video }: { video: SermonVideo | null }) {
  const title = video?.title ?? latestSermon.title;
  const youtubeUrl = video?.watchUrl ?? latestSermon.youtubeUrl;
  const dateLabel = video ? formatSermonDate(video.publishedAt) : latestSermon.date;
  const thumbnail = video?.thumbnailUrl ?? "/sermons/latest-message.svg";
  const useRemoteThumbnail = Boolean(video?.thumbnailUrl);

  return (
    <section>
      <div className="mb-2.5 flex items-end justify-between gap-2 px-0.5">
        <h2 className="mobile-section-title">Latest sermon</h2>
        <Link href="/sermons" className="text-xs font-semibold text-teal-800 dark:text-teal-300">
          See all
        </Link>
      </div>

      <Link
        href={youtubeUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group block overflow-hidden rounded-2xl bg-white ring-1 ring-night-900/8 transition active:scale-[0.99] dark:bg-[var(--color-surface)] dark:ring-white/10"
      >
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-night-900">
          {useRemoteThumbnail ? (
            <Image src={thumbnail} alt="" fill className="object-cover transition duration-500 group-hover:scale-[1.03]" sizes="(max-width: 512px) 100vw, 480px" />
          ) : (
            <Image src={thumbnail} alt="" fill unoptimized className="object-cover" sizes="(max-width: 512px) 100vw, 480px" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-night-950/85 via-night-950/25 to-transparent" />
          <span
            className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-xl text-night-900 shadow-lg"
            aria-hidden
          >
            ▶
          </span>
          <div className="absolute inset-x-0 bottom-0 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sand-300">Latest message</p>
            <p className="mt-1 font-display text-lg font-semibold leading-snug text-white">{title}</p>
            <p className="mt-1 text-xs text-sand-200">
              {latestSermon.speaker} · {dateLabel}
            </p>
          </div>
        </div>
      </Link>
    </section>
  );
}
