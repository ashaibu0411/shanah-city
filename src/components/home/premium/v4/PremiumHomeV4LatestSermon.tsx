"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { homeSermonInlineThumbnail, mergeHomeSermonVideo } from "@/lib/home-sermon-display";
import { pickLatestEligibleSermon } from "@/lib/youtube-sermons-select";
import { latestSermon, site } from "@/lib/site";
import { formatSermonDate, type SermonVideo } from "@/lib/youtube-sermons-shared";
import { PremiumHomeV4Chevron, PremiumHomeV4Play } from "@/components/home/premium/v4/PremiumHomeV4Icons";
import { useSermonPlayer } from "@/components/sermons/SermonPlayerProvider";

type PremiumHomeV4LatestSermonProps = {
  video: SermonVideo | null;
};

export function PremiumHomeV4LatestSermon({ video }: PremiumHomeV4LatestSermonProps) {
  const { playWatch } = useSermonPlayer();
  const seed = mergeHomeSermonVideo(video);
  const [resolved, setResolved] = useState<SermonVideo | null>(seed);

  useEffect(() => {
    setResolved(mergeHomeSermonVideo(video));
  }, [video]);

  useEffect(() => {
    if (resolved?.id) return;
    let cancelled = false;
    fetch("/api/sermons?limit=50", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data.videos) ? (data.videos as SermonVideo[]) : [];
        const latest = pickLatestEligibleSermon(list);
        if (!cancelled && latest?.id) setResolved(latest);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [resolved?.id, video?.id]);

  const playback = resolved?.id ? resolved : null;
  const title = playback?.title ?? video?.title ?? latestSermon.title;
  const thumbnail = homeSermonInlineThumbnail(
    playback?.thumbnailUrl ?? video?.thumbnailUrl ?? "/sermons/latest-message.svg",
  );
  const dateLabel = playback
    ? formatSermonDate(playback.publishedAt)
    : video?.publishedAt
      ? formatSermonDate(video.publishedAt)
      : latestSermon.date;

  function openSermon() {
    if (playback) void playWatch(playback);
  }

  return (
    <section className="ph4-section" aria-labelledby="ph4-sermon-heading">
      <div className="ph4-section__head">
        <h2 id="ph4-sermon-heading" className="ph4-section__title">
          Latest Sermon
        </h2>
        <Link href="/sermons" className="ph4-section__link">
          View all →
        </Link>
      </div>
      <div className="ph4-sermon ph4-sermon--stack">
        <button
          type="button"
          className="ph4-sermon__thumb"
          onClick={openSermon}
          aria-label={`Play ${title}`}
        >
          <Image
            src={thumbnail}
            alt=""
            fill
            unoptimized={thumbnail.startsWith("http")}
            className="object-cover"
            sizes="(max-width: 512px) 92vw, 400px"
            quality={92}
          />
          <span className="ph4-sermon__play">
            <PremiumHomeV4Play className="h-8 w-8" />
          </span>
        </button>
        <SermonBody title={title} dateLabel={dateLabel} speaker={site.leadPastor} onPlay={openSermon} />
        <Link href="/sermons" className="ph4-sermon__all" aria-label="All sermons">
          <PremiumHomeV4Chevron />
        </Link>
      </div>
    </section>
  );
}

function SermonBody({
  title,
  dateLabel,
  speaker,
  onPlay,
}: {
  title: string;
  dateLabel: string;
  speaker: string;
  onPlay: () => void;
}) {
  return (
    <button type="button" className="ph4-sermon__body" onClick={onPlay}>
      <span className="ph4-sermon__date">{dateLabel}</span>
      <span className="ph4-sermon__title">{title}</span>
      <span className="ph4-sermon__speaker">{speaker}</span>
    </button>
  );
}
