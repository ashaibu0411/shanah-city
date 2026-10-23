"use client";

import Link from "next/link";
import { ChurchFlyerImage } from "@/components/home/ChurchFlyerImage";
import { LiveStreamCountdown } from "@/components/live/LiveStreamCountdown";
import { useUpcomingLiveStreamSchedule } from "@/components/live/useLiveStreamSchedule";
import { homeLiveSpotlightMediaClass } from "@/lib/home-explore-tile-images";
import { liveStream } from "@/lib/site";
import { getYouTubeThumbnail } from "@/lib/streams";
type PremiumMobileLiveCinemaProps = {
  liveFlyerImage?: string;
};

export function PremiumMobileLiveCinema({ liveFlyerImage }: PremiumMobileLiveCinemaProps) {
  const { schedule, livePhase, loading, refresh } = useUpcomingLiveStreamSchedule();
  const anyLive =
    liveStream.isLive || liveStream.youtube.isLive || liveStream.facebook.isLive;
  const scheduledLive = livePhase === "live";
  const showAsLive = anyLive || scheduledLive;
  const liveVideoId = liveStream.youtube.videoId?.trim();
  const liveThumbnail = liveVideoId ? getYouTubeThumbnail(liveVideoId) : null;

  const upcoming = !loading && schedule && livePhase === "upcoming" ? schedule : null;
  const imageSrc =
    showAsLive && liveThumbnail ? liveThumbnail : liveFlyerImage?.trim() || undefined;

  return (
    <section className="premium-section" aria-label="Live worship">
      <div className="premium-section__head">
        <h2 className="premium-section__title">Live Now</h2>
        <Link href="/live" className="premium-section__link">
          Open player →
        </Link>
      </div>

      <Link href="/live" className="premium-live-cinema group block overflow-hidden rounded-[1.35rem] ring-1 ring-[var(--color-border)]">
        <div className="relative min-h-[15.5rem]">
          <div className="absolute inset-0">
            {imageSrc ? (
              liveThumbnail && showAsLive ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={liveThumbnail}
                  alt=""
                  className={`h-full w-full object-cover transition duration-700 group-active:scale-[1.02] ${homeLiveSpotlightMediaClass}`}
                />
              ) : (
                <ChurchFlyerImage
                  src={imageSrc}
                  alt="Watch live"
                  sizes="100vw"
                  className={`h-full w-full object-cover transition duration-700 group-active:scale-[1.02] ${homeLiveSpotlightMediaClass}`}
                />
              )
            ) : (
              <div className={`h-full w-full bg-night-900 ${homeLiveSpotlightMediaClass}`} />
            )}
          </div>

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-night-950/92 via-night-950/45 to-night-950/25" />

          <div className="relative flex min-h-[15.5rem] flex-col justify-between p-4 text-white">
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-sand-200/95">
              Shanah City Live
            </p>

            <div className="pointer-events-none">
              {showAsLive ? (
                <span className="mb-2 inline-flex w-fit items-center gap-1.5 rounded-full bg-red-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                  <span className="h-1.5 w-1.5 rounded-full bg-white" aria-hidden />
                  Live now
                </span>
              ) : upcoming ? (
                <div className="premium-live-cinema__countdown mb-2">
                  <LiveStreamCountdown schedule={upcoming} variant="home-flyer" onComplete={refresh} />
                </div>
              ) : null}

              <p className="font-display text-xl font-bold leading-tight tracking-tight drop-shadow-md">
                {showAsLive
                  ? scheduledLive && schedule
                    ? schedule.title
                    : liveStream.title
                  : upcoming?.title ?? "Watch Live"}
              </p>

              <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-100/85">
                {showAsLive
                  ? "Join the stream"
                  : upcoming
                    ? "Upcoming on YouTube & Facebook"
                    : "Sundays & special services"}
              </p>

              <span className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/95 px-3.5 py-2 text-[11px] font-bold text-teal-900 shadow-lg">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-night-950 text-[10px] text-white">
                  ▶
                </span>
                {showAsLive ? "Join stream" : "Open live player"}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </section>
  );
}
