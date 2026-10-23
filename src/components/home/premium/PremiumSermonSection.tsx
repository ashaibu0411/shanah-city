"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SermonMediaPanel } from "@/components/sermons/SermonMediaPanel";
import { SermonCardMedia } from "@/components/sermons/SermonCardMedia";
import { latestSermon, site } from "@/lib/site";
import { formatSermonDate, type SermonVideo } from "@/lib/youtube-sermons-shared";

type PremiumSermonSectionProps = {
  video: SermonVideo | null;
  variant?: "desktop" | "mobile";
};

async function fetchLatestSermonVideo(): Promise<SermonVideo | null> {
  const response = await fetch("/api/sermons?limit=1", { cache: "no-store" });
  if (!response.ok) return null;
  const data = (await response.json()) as { videos?: SermonVideo[] };
  const first = Array.isArray(data.videos) ? data.videos[0] : undefined;
  return first?.id ? first : null;
}

export function PremiumSermonSection({ video, variant = "desktop" }: PremiumSermonSectionProps) {
  const [resolved, setResolved] = useState<SermonVideo | null>(video?.id ? video : null);
  const [loading, setLoading] = useState(!video?.id);
  const mobile = variant === "mobile";

  useEffect(() => {
    if (video?.id) {
      setResolved(video);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    void fetchLatestSermonVideo()
      .then((next) => {
        if (!cancelled && next) setResolved(next);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [video?.id, video?.thumbnailUrl, video?.title]);

  const title = resolved?.title ?? video?.title ?? latestSermon.title;
  const thumbnail = resolved?.thumbnailUrl ?? video?.thumbnailUrl ?? "/sermons/latest-message.svg";
  const dateLabel = resolved
    ? formatSermonDate(resolved.publishedAt)
    : video?.publishedAt
      ? formatSermonDate(video.publishedAt)
      : latestSermon.date;
  const speaker = site.leadPastor;
  const watchUrl = resolved?.watchUrl ?? video?.watchUrl ?? latestSermon.youtubeUrl;
  const playbackVideo = resolved ?? (video?.id ? video : null);

  return (
    <section className="premium-section" aria-labelledby="premium-sermon-heading">
      <div className="premium-section__head">
        <h2 id="premium-sermon-heading" className="premium-section__title">
          Latest Sermon
        </h2>
        <Link href="/sermons" className="premium-section__link">
          View all →
        </Link>
      </div>

      <div className={`premium-sermon ${mobile ? "premium-sermon--mobile" : "premium-sermon--desktop"}`}>
        {playbackVideo ? (
          mobile ? (
            <SermonMediaPanel
              video={playbackVideo}
              title={title}
              thumbnail={thumbnail}
              compact
              className="bg-night-950"
            />
          ) : (
            <SermonCardMedia video={playbackVideo} title={title} thumbnail={thumbnail} compact />
          )
        ) : loading ? (
          <div className="premium-sermon__loading">Loading latest message…</div>
        ) : (
          <Link
            href={watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="premium-sermon__fallback-thumb"
            aria-label={`Watch ${title} on YouTube`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={thumbnail} alt="" className="h-full w-full object-cover" />
            <span className="premium-sermon__fallback-play" aria-hidden>
              ▶
            </span>
          </Link>
        )}
        <div className="premium-sermon__copy">
          <p className="premium-sermon__eyebrow">{dateLabel}</p>
          <h3 className="premium-sermon__title">{title}</h3>
          <p className="premium-sermon__speaker">{speaker}</p>
          {!mobile && (
            <Link href="/sermons" className="premium-btn premium-btn--secondary premium-btn--sm">
              All messages
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
