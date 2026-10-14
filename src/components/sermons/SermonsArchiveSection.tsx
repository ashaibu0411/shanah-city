"use client";

import { useEffect, useState } from "react";
import { SermonCard } from "@/components/sermons/SermonCard";
import { SermonsGrid } from "@/components/sermons/SermonsGrid";
import { ExternalLink } from "@/components/ui";
import type { SermonVideo } from "@/lib/youtube-sermons-shared";
import { getShanahCityYouTubeChannelUrl } from "@/lib/youtube-sermons-shared";

type SermonsArchiveSectionProps = {
  initialVideos: SermonVideo[];
};

export function SermonsArchiveSection({ initialVideos }: SermonsArchiveSectionProps) {
  const [videos, setVideos] = useState(initialVideos);

  useEffect(() => {
    setVideos(initialVideos);
  }, [initialVideos]);

  useEffect(() => {
    if (initialVideos.length > 0) return;

    fetch("/api/sermons?limit=50", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        const list = Array.isArray(data.videos) ? (data.videos as SermonVideo[]) : [];
        if (list.length > 0) setVideos(list);
      })
      .catch(() => undefined);
  }, [initialVideos.length]);

  const latest = videos[0] ?? null;
  const moreVideos = latest ? videos.slice(1) : videos;

  return (
    <>
      <SermonCard video={latest} showAllMessagesLink={false} />

      <section className="mt-10">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-sand-600">
              Shanah City on YouTube
            </p>
            <h2 className="mt-1 font-display text-2xl font-semibold text-night-900">
              {videos.length > 0 ? "All messages" : "More on YouTube"}
            </h2>
          </div>
          <ExternalLink
            href={getShanahCityYouTubeChannelUrl()}
            className="text-sm font-semibold text-night-700 hover:text-night-900"
          >
            Open channel →
          </ExternalLink>
        </div>
        {moreVideos.length > 0 ? (
          <SermonsGrid videos={moreVideos} />
        ) : videos.length === 0 ? (
          <p className="rounded-2xl bg-sand-100 px-4 py-6 text-sm text-night-600 ring-1 ring-night-900/5">
            Loading messages from YouTube…
          </p>
        ) : (
          <p className="rounded-2xl bg-sand-100 px-4 py-6 text-sm text-night-600 ring-1 ring-night-900/5">
            Browse the full message archive on{" "}
            <ExternalLink href={getShanahCityYouTubeChannelUrl()} className="font-semibold text-night-800">
              YouTube
            </ExternalLink>
            .
          </p>
        )}
      </section>
    </>
  );
}
