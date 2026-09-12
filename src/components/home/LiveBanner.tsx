"use client";

import Link from "next/link";
import { ChurchFlyerImage } from "@/components/home/ChurchFlyerImage";
import { LiveStreamCountdown } from "@/components/live/LiveStreamCountdown";
import { useUpcomingLiveStreamSchedule } from "@/components/live/useLiveStreamSchedule";
import { LiveStreamPublicShare } from "@/components/live/LiveStreamPublicShare";
import { liveStream, site } from "@/lib/site";
import { streamPreviews } from "@/lib/streams";
import { Badge, ExternalLink } from "@/components/ui";

const serviceSummary = site.serviceTimes
  .map(
    (service) =>
      `${service.day.replace(" Evenings", "").replace(" Mornings", "")} ${service.time.split(" – ")[0]}`,
  )
  .join(" · ");

type LiveBannerProps = {
  liveFlyerImage?: string;
};

export function LiveBanner({ liveFlyerImage }: LiveBannerProps) {
  const { schedule, livePhase, loading, refresh } = useUpcomingLiveStreamSchedule();
  const anyLive =
    liveStream.isLive ||
    liveStream.youtube.isLive ||
    liveStream.facebook.isLive;
  const scheduledLive = livePhase === "live";
  const showAsLive = anyLive || scheduledLive;

  if (showAsLive) {
    const liveTitle = scheduledLive && schedule ? schedule.title : liveStream.title;
    return (
      <Link
        href="/live"
        className="group mb-6 block overflow-hidden rounded-[2rem] bg-gradient-to-r from-red-600 via-rose-600 to-night-900 p-6 text-white shadow-xl transition hover:scale-[1.01] sm:p-8"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Badge variant="live">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
              Live now
            </Badge>
            <h2 className="mt-3 font-display text-2xl font-semibold sm:text-3xl">
              {liveTitle}
            </h2>
            <p className="mt-1 text-sm text-white/80">
              {anyLive
                ? `${liveStream.viewerCount.toLocaleString()} watching · Tap to join`
                : "Tap to join the stream"}
            </p>
            <div className="mt-4">
              <LiveStreamPublicShare title={liveTitle} isLive onDark compact />
            </div>
          </div>
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/15 text-2xl transition group-hover:bg-white/25">
            ▶
          </span>
        </div>
      </Link>
    );
  }

  if (!loading && schedule && livePhase === "upcoming") {
    return (
      <Link
        href="/live"
        className="group mb-6 block overflow-hidden rounded-[2rem] shadow-xl ring-1 ring-night-900/10 transition hover:scale-[1.005]"
      >
        <div className="relative min-h-[16rem] sm:min-h-[14rem]">
          {liveFlyerImage ? (
            <>
              <ChurchFlyerImage
                src={liveFlyerImage}
                alt=""
                sizes="(max-width: 768px) 100vw, 960px"
                className="object-cover transition duration-700 group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-night-950/94 via-night-950/82 to-night-900/60" />
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-night-950 via-night-900 to-teal-950" />
          )}
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(45,212,191,0.12),transparent_45%)]"
            aria-hidden
          />
          <div className="relative flex min-h-[16rem] flex-col justify-center px-6 py-8 sm:min-h-[14rem] sm:px-10 sm:py-10">
            <LiveStreamCountdown
              schedule={schedule}
              variant="desktop-flyer"
              onComplete={refresh}
            />
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div className="group mb-6 overflow-hidden rounded-[2rem] shadow-xl ring-1 ring-night-900/10">
      <div className="relative min-h-[14rem]">
        {liveFlyerImage ? (
          <>
            <ChurchFlyerImage
              src={liveFlyerImage}
              alt=""
              sizes="(max-width: 768px) 100vw, 960px"
              className="object-cover transition duration-700 group-hover:scale-[1.02]"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-night-950/94 via-night-950/85 to-night-900/70" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-night-950 via-night-900 to-night-800" />
        )}
        <div className="relative px-6 py-8 sm:px-8 sm:py-10">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-sand-200/90">
            Shanah City Live
          </p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-white sm:text-3xl">
            Watch live with us
          </h2>
          <p className="mt-2 text-sm text-white/75">{serviceSummary}</p>
          <p className="mt-1 text-sm text-white/50">Aurora · Accra · Online</p>
          <Link
            href="/live"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-night-900 transition hover:bg-sand-100"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-800 text-[10px] text-white">
              ▶
            </span>
            Open live player
          </Link>
        </div>
      </div>

      <div className="border-t border-white/10 bg-night-950/90 px-4 py-4 sm:px-6">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-white/45">
          Follow & watch
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {streamPreviews.map((preview) => (
            <ExternalLink
              key={preview.id}
              href={preview.url}
              className="shrink-0 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white ring-1 ring-white/10 transition hover:bg-white/15"
            >
              {preview.platform === "Instagram"
                ? `@${preview.handle ?? "shanahcity"}`
                : `${preview.label} · ${preview.platform}`}
            </ExternalLink>
          ))}
        </div>
      </div>
    </div>
  );
}
