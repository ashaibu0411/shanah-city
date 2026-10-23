"use client";

import Link from "next/link";
import { ChurchFlyerImage } from "@/components/home/ChurchFlyerImage";
import { LiveStreamCountdown } from "@/components/live/LiveStreamCountdown";
import {
  LiveStreamCountdownInline,
  useUpcomingLiveStreamSchedule,
} from "@/components/live/useLiveStreamSchedule";
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
  const mobile = variant === "mobile";

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
        ) : null}
      </div>

      <div className="premium-live__body">
        {!mobile && (
          <div className="premium-section__head premium-section__head--compact">
            <h2 className="premium-section__title">Live Now</h2>
            <Link href="/live" className="premium-section__link">
              Open player →
            </Link>
          </div>
        )}
        {mobile && (
          <div className="premium-section__head premium-section__head--compact">
            <h2 className="premium-section__title">Live Now</h2>
          </div>
        )}

        {showAsLive ? (
          <>
            <p className="premium-live__title">{title}</p>
            <p className="premium-live__meta">
              {anyLive && liveStream.viewerCount > 0
                ? `${liveStream.viewerCount.toLocaleString()} watching · Tap to join`
                : "Tap to join the stream"}
            </p>
          </>
        ) : !loading && schedule && livePhase === "upcoming" ? (
          <>
            <p className="premium-live__title">{schedule.title}</p>
            <p className="premium-live__meta">Upcoming on YouTube & Facebook</p>
            <div className="premium-live__countdown">
              {mobile ? (
                <LiveStreamCountdownInline />
              ) : (
                <LiveStreamCountdown schedule={schedule} variant="desktop-flyer" onComplete={refresh} />
              )}
            </div>
          </>
        ) : (
          <>
            <p className="premium-live__title">Watch live with us</p>
            <p className="premium-live__meta">{serviceSummary}</p>
          </>
        )}

        <Link href="/live" className="premium-btn premium-btn--primary premium-btn--sm premium-live__cta">
          <span className="premium-btn__play" aria-hidden>
            ▶
          </span>
          {showAsLive ? "Watch Live" : "Open live player"}
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
