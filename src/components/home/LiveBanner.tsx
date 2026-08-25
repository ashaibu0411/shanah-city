"use client";

import Link from "next/link";
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

export function LiveBanner() {
  const { schedule, loading, clearSchedule } = useUpcomingLiveStreamSchedule();
  const anyLive =
    liveStream.isLive ||
    liveStream.youtube.isLive ||
    liveStream.facebook.isLive;

  if (anyLive) {
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
              {liveStream.title}
            </h2>
            <p className="mt-1 text-sm text-white/80">
              {liveStream.viewerCount.toLocaleString()} watching · Tap to join
            </p>
            <div className="mt-4">
              <LiveStreamPublicShare title={liveStream.title} isLive onDark compact />
            </div>
          </div>
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/15 text-2xl transition group-hover:bg-white/25">
            ▶
          </span>
        </div>
      </Link>
    );
  }

  if (!loading && schedule) {
    return (
      <Link href="/live" className="mb-6 block transition hover:scale-[1.005]">
        <LiveStreamCountdown
          schedule={schedule}
          variant="desktop-hero"
          onComplete={clearSchedule}
        />
      </Link>
    );
  }

  return (
    <div className="mb-6 overflow-hidden rounded-[2rem] bg-gradient-to-br from-night-950 via-night-900 to-night-800 text-white shadow-xl ring-1 ring-night-900/10">
      <div className="px-6 py-8 sm:px-8 sm:py-10">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-200/90">
          Watch live
        </p>
        <h2 className="mt-2 font-display text-2xl font-semibold sm:text-3xl">
          Shanah City Live
        </h2>
        <p className="mt-2 text-sm text-white/75">{serviceSummary}</p>
        <p className="mt-1 text-sm text-white/50">Aurora · Accra · Online</p>
        <Link
          href="/live"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-night-900 transition hover:bg-amber-100"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-night-900 text-[10px] text-white">
            ▶
          </span>
          Open live player
        </Link>
      </div>

      <div className="border-t border-white/10 px-4 py-4 sm:px-6">
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
