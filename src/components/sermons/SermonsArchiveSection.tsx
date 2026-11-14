"use client";

import { useEffect, useState } from "react";
import { SermonCard } from "@/components/sermons/SermonCard";
import { SermonsGrid } from "@/components/sermons/SermonsGrid";
import { ExternalLink } from "@/components/ui";
import type { SermonVideo } from "@/lib/youtube-sermons-shared";
import { getShanahCityYouTubeChannelUrl } from "@/lib/youtube-sermons-shared";
import { pickLatestEligibleSermon } from "@/lib/youtube-sermons-select";

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

  const latest = pickLatestEligibleSermon(videos);
  const moreVideos = latest ? videos.filter((v) => v.id !== latest.id) : videos;

  return (
    <>
      <div className="sc-v4-sermon-feature"><SermonCard video={latest} showAllMessagesLink={false} /></div>

      <section className="mt-10">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="sc-v4-sermon-archive-label text-xs font-bold uppercase tracking-[0.22em] text-sand-600">
              Shanah City on YouTube
            </p>
            <h2 className="sc-v4-sermon-archive-title mt-1 font-display text-2xl font-semibold text-night-900">
              {videos.length > 0 ? "All messages" : "More on YouTube"}
            </h2>
          </div>
          <ExternalLink
            href={getShanahCityYouTubeChannelUrl()}
            className="sc-v4-sermon-channel-link text-sm font-semibold text-night-700 hover:text-night-900"
          >
            Open channel →
          </ExternalLink>
        </div>
        {moreVideos.length > 0 ? (
          <SermonsGrid videos={moreVideos} />
        ) : videos.length === 0 ? (
          <p className="sc-v4-sermon-empty rounded-2xl bg-sand-100 px-4 py-6 text-sm text-night-600 ring-1 ring-night-900/5">
            Loading messages from YouTube…
          </p>
        ) : (
          <p className="sc-v4-sermon-empty rounded-2xl bg-sand-100 px-4 py-6 text-sm text-night-600 ring-1 ring-night-900/5">
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
