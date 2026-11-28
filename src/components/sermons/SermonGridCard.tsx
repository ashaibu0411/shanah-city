"use client";

import { useState } from "react";
import Image from "next/image";
import { SermonMediaPanel } from "@/components/sermons/SermonMediaPanel";
import { formatSermonDate, type SermonVideo } from "@/lib/youtube-sermons-shared";

export function SermonGridCard({ video }: { video: SermonVideo }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <article className="sermon-v5-row overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-night-900/5">
      <button type="button" onClick={() => setExpanded(v => !v)} aria-expanded={expanded} aria-label={`${expanded ? "Close" : "Open"} ${video.title}`} className="flex w-full items-center gap-3 p-3 text-left min-h-[88px]">
        <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md"><Image src={video.thumbnailUrl} alt="" fill sizes="64px" className="object-cover" /></span>
        <span className="min-w-0 flex-1"><span className="block font-semibold leading-snug text-[#c4aa48]">{video.title}</span><span className="mt-1 block text-xs text-[#c6c6c6]">{formatSermonDate(video.publishedAt)}</span></span>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-white text-white" aria-hidden>{expanded ? "−" : "▶"}</span>
      </button>
      {expanded && <>
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
      </>}
    </article>
  );
}
