"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { SermonMediaPanel } from "@/components/sermons/SermonMediaPanel";
import { SermonCardMedia } from "@/components/sermons/SermonCardMedia";
import { mergeHomeSermonVideo } from "@/lib/home-sermon-display";
import { latestSermon, site } from "@/lib/site";
import { formatSermonDate, type SermonVideo } from "@/lib/youtube-sermons-shared";

type PremiumSermonSectionProps = {
  video: SermonVideo | null;
  variant?: "desktop" | "mobile";
};

export function PremiumSermonSection({ video, variant = "desktop" }: PremiumSermonSectionProps) {
  const seed = mergeHomeSermonVideo(video);
  const [resolved, setResolved] = useState<SermonVideo | null>(seed);
  const mobile = variant === "mobile";

  useEffect(() => {
    setResolved(mergeHomeSermonVideo(video));
  }, [video]);

  useEffect(() => {
    if (resolved?.id) return;

    let cancelled = false;
    fetch("/api/sermons?limit=1", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        const first = Array.isArray(data.videos) ? (data.videos[0] as SermonVideo | undefined) : undefined;
        if (!cancelled && first?.id) setResolved(first);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [resolved?.id, video?.id]);

  const playbackVideo = resolved?.id ? resolved : null;
  const title = playbackVideo?.title ?? video?.title ?? latestSermon.title;
  const thumbnail = playbackVideo?.thumbnailUrl ?? video?.thumbnailUrl ?? "/sermons/latest-message.svg";
  const dateLabel = playbackVideo
    ? formatSermonDate(playbackVideo.publishedAt)
    : video?.publishedAt
      ? formatSermonDate(video.publishedAt)
      : latestSermon.date;
  const speaker = site.leadPastor;
  const watchUrl = playbackVideo?.watchUrl ?? video?.watchUrl ?? latestSermon.youtubeUrl;

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
        ) : (
          <Link
            href={watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="premium-sermon__fallback-thumb"
            aria-label={`Watch ${title} on YouTube`}
          >
            <Image
              src={thumbnail}
              alt=""
              fill
              unoptimized={thumbnail.startsWith("http")}
              className="object-cover"
              sizes="100vw"
            />
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
