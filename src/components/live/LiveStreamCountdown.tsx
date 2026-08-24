"use client";

import { useEffect, useState } from "react";
import {
  formatLiveStreamCountdown,
  formatLiveStreamStartLabel,
  getLiveStreamCountdown,
  liveStreamPlatformLabel,
} from "@/lib/live-schedule-utils";
import type { LiveStreamSchedule } from "@/lib/live-schedule-types";

type LiveStreamCountdownProps = {
  schedule: LiveStreamSchedule;
  variant?: "card" | "inline" | "on-dark" | "stage" | "home-flyer";
  onComplete?: () => void;
};

function CountdownUnit({
  value,
  label,
  onDark,
  large = false,
  xlarge = false,
}: {
  value: number;
  label: string;
  onDark: boolean;
  large?: boolean;
  xlarge?: boolean;
}) {
  const sizeClass = xlarge
    ? "min-w-[4.75rem] px-3 py-3 sm:min-w-[5.25rem]"
    : large
      ? "min-w-[4.5rem] px-3 py-3 sm:min-w-[5rem]"
      : "min-w-[3.25rem] px-2 py-2";
  const numberClass = xlarge
    ? "text-4xl sm:text-5xl"
    : large
      ? "text-3xl sm:text-4xl"
      : "text-xl";

  return (
    <div
      className={`rounded-xl text-center ring-1 ${sizeClass} ${
        onDark
          ? "bg-white/10 text-white ring-white/15"
          : "bg-sand-50 text-night-900 ring-night-900/10"
      }`}
    >
      <p className={`font-display font-bold tabular-nums leading-none ${numberClass}`}>
        {value}
      </p>
      <p
        className={`mt-1 text-[10px] font-semibold uppercase tracking-wider ${
          onDark ? "text-white/70" : "text-night-500"
        }`}
      >
        {label}
      </p>
    </div>
  );
}

export function LiveStreamCountdown({
  schedule,
  variant = "card",
  onComplete,
}: LiveStreamCountdownProps) {
  const [parts, setParts] = useState(() => getLiveStreamCountdown(schedule.startsAt));

  useEffect(() => {
    const tick = () => {
      const next = getLiveStreamCountdown(schedule.startsAt);
      setParts(next);
      if (next.done) onComplete?.();
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [schedule.startsAt, onComplete]);

  if (parts.done) return null;

  const compact = formatLiveStreamCountdown(parts);
  const startLabel = formatLiveStreamStartLabel(schedule.startsAt);
  const platformLabel = liveStreamPlatformLabel(schedule.platform);

  if (variant === "inline") {
    return (
      <p className="text-xs font-semibold text-night-700">
        Next live in <span className="tabular-nums text-night-900">{compact}</span>
        {startLabel ? <span className="text-night-500"> · {startLabel}</span> : null}
      </p>
    );
  }

  if (variant === "home-flyer") {
    return (
      <div className="mb-1">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-200/95 sm:text-sm">
          Live in
        </p>
        <div className="mt-2.5 flex flex-wrap gap-2 sm:gap-2.5">
          {parts.days > 0 ? (
            <CountdownUnit onDark xlarge value={parts.days} label="Days" />
          ) : null}
          <CountdownUnit onDark xlarge value={parts.hours} label="Hrs" />
          <CountdownUnit onDark xlarge value={parts.minutes} label="Min" />
          <CountdownUnit onDark xlarge value={parts.seconds} label="Sec" />
        </div>
      </div>
    );
  }

  if (variant === "stage") {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-night-950 px-4 py-8 text-center text-white">
        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-amber-200/90">
          Livestream starts in
        </p>
        <h3 className="mt-3 max-w-md font-display text-2xl font-semibold leading-tight sm:text-3xl">
          {schedule.title}
        </h3>
        <p className="mt-2 text-sm text-white/70">
          {startLabel} · {platformLabel}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2.5 sm:gap-3">
          {parts.days > 0 ? (
            <CountdownUnit onDark large value={parts.days} label="Days" />
          ) : null}
          <CountdownUnit onDark large value={parts.hours} label="Hours" />
          <CountdownUnit onDark large value={parts.minutes} label="Min" />
          <CountdownUnit onDark large value={parts.seconds} label="Sec" />
        </div>
        <p className="mt-5 text-xs text-white/50">
          The player will appear here when we go live on {platformLabel}.
        </p>
      </div>
    );
  }

  const shellClass =
    variant === "on-dark"
      ? "rounded-2xl border border-white/15 bg-black/20 p-5 text-white backdrop-blur-sm sm:p-6"
      : "rounded-2xl border border-night-900/10 bg-white p-4 shadow-sm ring-1 ring-night-900/5";

  const titleClass =
    variant === "on-dark"
      ? "text-xs font-bold uppercase tracking-[0.22em] text-amber-200/90 sm:text-sm"
      : "text-[11px] font-bold uppercase tracking-[0.2em] text-night-500";

  const onDark = variant === "on-dark";

  return (
    <div className={shellClass}>
      <p className={titleClass}>Next livestream</p>
      <h3
        className={`mt-1.5 font-display font-semibold ${
          onDark ? "text-xl text-white sm:text-2xl" : "text-lg text-night-900"
        }`}
      >
        {schedule.title}
      </h3>
      <p className={`mt-1.5 text-sm ${onDark ? "text-white/75" : "text-night-600"}`}>
        {startLabel} · {platformLabel}
      </p>

      <div className="mt-5 flex flex-wrap gap-2.5 sm:gap-3">
        {parts.days > 0 ? (
          <CountdownUnit onDark={onDark} large value={parts.days} label="Days" />
        ) : null}
        <CountdownUnit onDark={onDark} large value={parts.hours} label="Hours" />
        <CountdownUnit onDark={onDark} large value={parts.minutes} label="Min" />
        <CountdownUnit onDark={onDark} large value={parts.seconds} label="Sec" />
      </div>
    </div>
  );
}
