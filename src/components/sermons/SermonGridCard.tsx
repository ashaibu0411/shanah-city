"use client";

import { SermonMediaPanel } from "@/components/sermons/SermonMediaPanel";
import { formatSermonDate, type SermonVideo } from "@/lib/youtube-sermons-shared";

export function SermonGridCard({ video }: { video: SermonVideo }) {
  return (
    <article className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-night-900/5">
      <SermonMediaPanel
        video={video}
        title={video.title}
        thumbnail={video.thumbnailUrl}
        compact
        className="bg-night-900"
      />
      <div className="p-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sand-600">
          {formatSermonDate(video.publishedAt)}
        </p>
        <h3 className="mt-2 line-clamp-3 font-display text-lg font-semibold leading-snug text-night-900">
          {video.title}
        </h3>
        <a
          href={video.watchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block text-sm font-semibold text-night-600 hover:text-night-900"
        >
          Open on YouTube →
        </a>
      </div>
    </article>
  );
}
