"use client";

import { useEffect, useState } from "react";
import { LiveStreamCountdown } from "@/components/live/LiveStreamCountdown";
import { LiveStreamNotifyPanel } from "@/components/live/LiveStreamNotifyPanel";
import { LiveStreamSchedulePanel } from "@/components/live/LiveStreamSchedulePanel";
import { LiveStreamPlayer } from "@/components/live/LiveStreamPlayer";
import { useUpcomingLiveStreamSchedule } from "@/components/live/useLiveStreamSchedule";
import { formatLiveStreamStartLabel, liveStreamPlatformLabel } from "@/lib/live-schedule-utils";
import { StreamPreviewImage } from "@/components/live/StreamPreviewImage";
import { liveStream, site } from "@/lib/site";
import { getStreamPreviewForPlatform, streamPreviews } from "@/lib/streams";
import type { StreamPreview } from "@/lib/types";
import { Badge, ExternalLink } from "@/components/ui";

const followLinks = [
  { label: "YouTube", url: site.social.youtube },
  ...site.social.instagram.map((account) => ({
    label: `@${account.handle}`,
    url: account.url,
  })),
  ...site.social.facebook.map((account) => ({
    label: account.name,
    url: account.url,
  })),
];

type MediaLiveStageProps = {
  layout?: "default" | "mobile";
};

export function MediaLiveStage({ layout = "default" }: MediaLiveStageProps) {
  const isMobile = layout === "mobile";
  const [active, setActive] = useState<StreamPreview>(streamPreviews[0]);
  const anyLive =
    liveStream.isLive ||
    liveStream.youtube.isLive ||
    liveStream.facebook.isLive;
  const { schedule, livePhase, loading: scheduleLoading, refresh } = useUpcomingLiveStreamSchedule();
  const scheduledLive = livePhase === "live";
  const showAsLive = anyLive || scheduledLive;
  const showStageCountdown =
    !showAsLive && !scheduleLoading && Boolean(schedule) && livePhase === "upcoming";
  const stagePreview =
    scheduledLive && schedule
      ? getStreamPreviewForPlatform(schedule.platform)
      : active;
  const stageTitle = showStageCountdown
    ? schedule!.title
    : showAsLive
      ? scheduledLive && schedule
        ? schedule.title
        : liveStream.title
      : active.label;
  const stageSubtitle = showStageCountdown
    ? formatLiveStreamStartLabel(schedule!.startsAt)
    : showAsLive
      ? scheduledLive
        ? liveStreamPlatformLabel(schedule?.platform)
        : liveStream.scheduledAt
      : `${active.platform} · Shanah City`;
  const stagePlatformLabel = showStageCountdown
    ? liveStreamPlatformLabel(schedule!.platform)
    : stagePreview.platform;

  useEffect(() => {
    if (scheduledLive && schedule) {
      setActive(getStreamPreviewForPlatform(schedule.platform));
    }
  }, [scheduledLive, schedule]);

  const stageFrameClass = showStageCountdown
    ? "relative w-full min-h-[10.5rem] bg-black sm:min-h-[12rem]"
    : isMobile
      ? "relative w-full aspect-[16/10] bg-black"
      : "relative w-full aspect-video bg-black";

  return (
    <div className={isMobile ? "space-y-2.5" : "space-y-3"}>
      <div className="overflow-hidden rounded-2xl bg-night-950 shadow-app-lg ring-1 ring-night-900/10">
        <div className={stageFrameClass}>
          {showStageCountdown ? (
            <LiveStreamCountdown
              schedule={schedule!}
              variant="stage"
              onComplete={refresh}
            />
          ) : (
            <LiveStreamPlayer preview={stagePreview} compact />
          )}
          {!showStageCountdown ? (
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-night-950/50 via-transparent to-night-950/25" />
          ) : null}
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-3">
            {showAsLive ? (
              <Badge variant="live">
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
                Live now
              </Badge>
            ) : showStageCountdown ? (
              <span className="rounded-full bg-amber-400/95 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-night-950 backdrop-blur-md">
                Starts soon
              </span>
            ) : (
              <span className="rounded-full bg-black/50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white/90 backdrop-blur-md">
                Watch anytime
              </span>
            )}
            <span className="rounded-full bg-black/50 px-3 py-1 text-[10px] font-semibold text-white/85 backdrop-blur-md">
              {stagePlatformLabel}
            </span>
          </div>
        </div>
        <div
          className={
            isMobile
              ? "border-t border-night-900/8 bg-white px-3.5 py-3.5 text-night-900"
              : "border-t border-white/8 bg-gradient-to-r from-night-950 via-night-900 to-night-800 px-3.5 py-3.5 text-white"
          }
        >
          <p
            className={`text-[10px] font-bold uppercase tracking-[0.2em] ${
              isMobile ? "text-night-500" : "text-sand-300/80"
            }`}
          >
            {showAsLive ? "Now streaming" : showStageCountdown ? "Upcoming livestream" : "Featured channel"}
          </p>
          <h2 className={`mt-1 font-home-hero font-semibold leading-snug tracking-tight ${isMobile ? "text-xl" : "text-2xl"}`}>
            {stageTitle}
          </h2>
          <p className={`mt-1 text-xs leading-relaxed ${isMobile ? "text-night-600" : "text-white/65"}`}>
            {stageSubtitle}
          </p>
          {showStageCountdown ? (
            <p className={`mt-2 text-[11px] leading-snug ${isMobile ? "text-night-500" : "text-white/45"}`}>
              The player will appear here when we go live on {stagePlatformLabel}.
            </p>
          ) : null}
        </div>
      </div>

      <div>
        <p className="mb-2 px-0.5 text-[11px] font-bold uppercase tracking-[0.22em] text-night-500">
          Channels
        </p>
        <div className="flex gap-2.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {streamPreviews.map((preview) => {
            const selected = active.id === preview.id;
            return (
              <button
                key={preview.id}
                type="button"
                onClick={() => setActive(preview)}
                className="flex shrink-0 flex-col items-center gap-1.5"
              >
                <span
                  className={`relative overflow-hidden rounded-full p-[2px] ${
                    selected
                      ? "bg-gradient-to-tr from-amber-400 via-rose-500 to-violet-600"
                      : "bg-night-300"
                  }`}
                >
                  <span className="relative block h-14 w-14 overflow-hidden rounded-full bg-night-900 ring-2 ring-white">
                    <StreamPreviewImage
                      preview={preview}
                      alt=""
                      className="mobile-media h-full w-full object-cover"
                    />
                  </span>
                </span>
                <span className="max-w-[4.5rem] truncate text-[10px] font-semibold text-night-700">
                  {preview.label.split(" ")[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <ExternalLink
        href={active.url}
        className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-night-900 via-night-800 to-night-900 px-4 py-3 text-sm font-bold tracking-tight text-white shadow-app-md transition active:scale-[0.99]"
      >
        Open on {active.platform} ↗
      </ExternalLink>

      <div className="mobile-surface !p-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-night-500">
          Follow us
        </p>
        <div className="mt-2 flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {followLinks.map((link) => (
            <ExternalLink
              key={link.url}
              href={link.url}
              className="shrink-0 rounded-full bg-night-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-night-800"
            >
              {link.label}
            </ExternalLink>
          ))}
        </div>
      </div>

      <LiveStreamNotifyPanel
        compact={isMobile}
        isLive={showAsLive}
        platform={stagePreview.id}
        streamTitle={showAsLive ? stageTitle : active.label}
      />

      <LiveStreamSchedulePanel compact={isMobile} />
    </div>
  );
}
