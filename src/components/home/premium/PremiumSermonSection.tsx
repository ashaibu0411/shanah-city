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

export function PremiumSermonSection({ video, variant = "desktop" }: PremiumSermonSectionProps) {
  const [resolved, setResolved] = useState<SermonVideo | null>(video);
  const mobile = variant === "mobile";

  useEffect(() => {
    setResolved(video);
  }, [video]);

  useEffect(() => {
    if (video?.id) return;
    fetch("/api/sermons?limit=1", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        const first = Array.isArray(data.videos) ? (data.videos[0] as SermonVideo | undefined) : undefined;
        if (first?.id) setResolved(first);
      })
      .catch(() => undefined);
  }, [video?.id]);

  const title = resolved?.title ?? latestSermon.title;
  const thumbnail = resolved?.thumbnailUrl ?? "/sermons/latest-message.svg";
  const dateLabel = resolved ? formatSermonDate(resolved.publishedAt) : latestSermon.date;
  const speaker = site.leadPastor;

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
        {resolved ? (
          mobile ? (
            <SermonMediaPanel video={resolved} title={title} thumbnail={thumbnail} compact className="bg-night-950" />
          ) : (
            <SermonCardMedia video={resolved} title={title} thumbnail={thumbnail} compact />
          )
        ) : (
          <div className="premium-sermon__loading">Loading latest message…</div>
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
