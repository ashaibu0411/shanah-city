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
  const { playWatch, playAudio, loading, error, sermon } = useSermonPlayer();
  const seed = mergeHomeSermonVideo(video);
  const [resolved, setResolved] = useState<SermonVideo | null>(seed);

  useEffect(() => {
    const incoming = mergeHomeSermonVideo(video);
    if (!incoming) return;
    setResolved((current) => {
      const newest = pickLatestEligibleSermon([current, incoming].filter(
        (item): item is SermonVideo => Boolean(item),
      ));
      return newest?.id === incoming.id ? incoming : newest;
    });
  }, [video]);

  useEffect(() => {
    let cancelled = false;
    let loading = false;
    const refresh = async () => {
      if (cancelled || loading || document.visibilityState !== "visible") return;
      loading = true;
      try {
        const response = await fetch("/api/sermons?limit=50", { cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json();
        const list = Array.isArray(data.videos) ? (data.videos as SermonVideo[]) : [];
        const latest = pickLatestEligibleSermon(list);
        if (cancelled || !latest) return;
        setResolved((current) => {
          const newest = pickLatestEligibleSermon([current, latest].filter(
            (item): item is SermonVideo => Boolean(item),
          ));
          // Use the fresh metadata if both candidates refer to the same video.
          return newest?.id === latest.id ? latest : newest;
        });
      } catch {
        // Keep the last playable sermon if a feed refresh fails.
      } finally {
        loading = false;
      }
    };
    const onResume = () => { void refresh(); };
    void refresh();
    const interval = window.setInterval(onResume, 5 * 60 * 1000);
    window.addEventListener("focus", onResume);
    document.addEventListener("visibilitychange", onResume);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("focus", onResume);
      document.removeEventListener("visibilitychange", onResume);
    };
  }, []);

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

  function listenToSermon() {
    if (playback) void playAudio(playback);
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
        {playback ? (
          <div className="flex flex-wrap items-center gap-2 px-3 pb-3">
            <button type="button" onClick={listenToSermon}
              disabled={loading && sermon?.id === playback.id}
              className="min-h-11 rounded-full bg-[#123a67] px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-60">
              {loading && sermon?.id === playback.id ? "Preparing audio…" : "Listen in background"}
            </button>
            <button type="button" onClick={openSermon}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border-2 border-[#123a67] bg-white px-5 py-2 text-sm font-extrabold text-[#123a67] shadow-sm transition-colors hover:bg-[#e8f1fb] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#123a67] active:bg-[#d9e8fa]">
              <PremiumHomeV4Play className="h-4 w-4" />
              Watch video
            </button>
            {error && sermon?.id === playback.id ? (
              <p role="status" className="w-full text-xs text-red-700">{error}</p>
            ) : null}
          </div>
        ) : null}
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
