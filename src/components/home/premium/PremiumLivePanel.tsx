"use client";

import Link from "next/link";
import { ChurchFlyerImage } from "@/components/home/ChurchFlyerImage";
import { LiveStreamCountdown } from "@/components/live/LiveStreamCountdown";
import { useUpcomingLiveStreamSchedule } from "@/components/live/useLiveStreamSchedule";
import { homeLiveBannerMediaClass } from "@/lib/home-explore-tile-images";
import { liveStream, site } from "@/lib/site";
import { getYouTubeThumbnail } from "@/lib/streams";

type PremiumLivePanelProps = {
  liveFlyerImage?: string;
  variant?: "desktop" | "mobile";
};

export function PremiumLivePanel({ liveFlyerImage, variant = "desktop" }: PremiumLivePanelProps) {
  const { schedule, livePhase, loading, refresh } = useUpcomingLiveStreamSchedule();
  const anyLive =
    liveStream.isLive || liveStream.youtube.isLive || liveStream.facebook.isLive;
  const scheduledLive = livePhase === "live";
  const showAsLive = anyLive || scheduledLive;
  const upcoming = !loading && schedule && livePhase === "upcoming";
  const offline = !showAsLive && !upcoming;
  const mobile = variant === "mobile";

  const sectionTitle = showAsLive
    ? "Live now"
    : upcoming
      ? "Starting soon"
      : "Live stream";

  const ctaLabel = showAsLive ? "Watch live" : upcoming ? "Remind me on live page" : "Open live player";

  const liveVideoId = liveStream.youtube.videoId?.trim();
  const liveThumbnail = liveVideoId ? getYouTubeThumbnail(liveVideoId) : null;
  const title =
    showAsLive && scheduledLive && schedule
      ? schedule.title
      : showAsLive
        ? liveStream.title
        : schedule?.title ?? "Watch Live";

  const serviceSummary = site.serviceTimes
    .map((s) => `${s.day.replace(" Evenings", "").replace(" Mornings", "")} ${s.time.split(" – ")[0]}`)
    .join(" · ");

  const imageSrc =
    showAsLive && liveThumbnail ? liveThumbnail : liveFlyerImage?.trim() || undefined;

  const card = (
    <div className={`premium-live ${mobile ? "premium-live--mobile" : "premium-live--desktop"}`}>
      <div className="premium-live__media">
        {imageSrc ? (
          liveThumbnail && showAsLive ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageSrc} alt="" className={`h-full w-full object-cover ${homeLiveBannerMediaClass}`} />
          ) : (
            <ChurchFlyerImage
              src={imageSrc}
              alt=""
              sizes={mobile ? "100vw" : "480px"}
              className={`h-full w-full object-cover ${homeLiveBannerMediaClass}`}
            />
          )
        ) : (
          <div className="premium-live__fallback" aria-hidden />
        )}
        <div className="premium-live__scrim" aria-hidden />
        {showAsLive ? (
          <span className="premium-live__badge premium-live__badge--live">Live</span>
        ) : upcoming ? (
          <span className="premium-live__badge premium-live__badge--upcoming">Upcoming</span>
        ) : null}
      </div>

      <div className="premium-live__body">
        <div className="premium-section__head premium-section__head--compact">
          <h2 className="premium-section__title">{sectionTitle}</h2>
          {!mobile ? (
            <Link href="/live" className="premium-section__link">
              Open player →
            </Link>
          ) : null}
        </div>

        {showAsLive ? (
          <>
            <p className="premium-live__title">{title}</p>
            <p className="premium-live__meta">
              {anyLive && liveStream.viewerCount > 0
                ? `${liveStream.viewerCount.toLocaleString()} watching · Tap to join`
                : "Tap to join the stream"}
            </p>
          </>
        ) : upcoming && schedule ? (
          mobile ? (
            <div className="premium-live__countdown premium-live__countdown--mobile">
              <LiveStreamCountdown schedule={schedule} variant="card" onComplete={refresh} />
            </div>
          ) : (
            <div className="premium-live__countdown">
              <LiveStreamCountdown schedule={schedule} variant="card" onComplete={refresh} />
            </div>
          )
        ) : (
          <>
            <p className="premium-live__title">{offline ? "Watch live with us" : "Next broadcast"}</p>
            <p className="premium-live__meta">{serviceSummary}</p>
          </>
        )}

        <Link href="/live" className="premium-btn premium-btn--secondary premium-btn--sm premium-live__cta">
          <span className="premium-btn__play" aria-hidden>
            ▶
          </span>
          {ctaLabel}
        </Link>
      </div>
    </div>
  );

  if (mobile) {
    return (
      <section className="premium-section" aria-label="Live worship">
        {card}
      </section>
    );
  }

  return <section aria-label="Live worship">{card}</section>;
}
