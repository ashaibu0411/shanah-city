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
  hero = false,
}: {
  value: number;
  label: string;
  onDark: boolean;
  large?: boolean;
  xlarge?: boolean;
  hero?: boolean;
}) {
  const sizeClass = hero
    ? "min-w-0 flex-1 basis-0 px-1 py-3.5 sm:min-w-[4.75rem] sm:flex-none sm:basis-auto sm:px-3"
    : xlarge
      ? "min-w-[4.75rem] px-3 py-3 sm:min-w-[5.25rem]"
      : large
        ? "min-w-[4.5rem] px-3 py-3 sm:min-w-[5rem]"
        : "min-w-[3.25rem] px-2 py-2";
  const numberClass = hero
    ? "text-6xl sm:text-4xl"
    : xlarge
      ? "text-4xl sm:text-5xl"
      : large
        ? "text-3xl sm:text-4xl"
        : "text-xl";
  const labelClass = hero
    ? "mt-1.5 text-[11px] font-bold uppercase tracking-wider"
    : "mt-1 text-[10px] font-semibold uppercase tracking-wider";

  return (
    <div
      className={`rounded-2xl text-center ring-1 ${sizeClass} ${
        onDark
          ? "bg-white/12 text-white ring-white/20"
          : "bg-sand-50 text-night-900 ring-night-900/10"
      }`}
    >
      <p className={`font-display font-bold tabular-nums leading-none ${numberClass}`}>
        {value}
      </p>
      <p className={`${labelClass} ${onDark ? "text-white/80" : "text-night-500"}`}>
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
    const units = [
      ...(parts.days > 0 ? [{ value: parts.days, label: "Days" as const }] : []),
      { value: parts.hours, label: "Hrs" as const },
      { value: parts.minutes, label: "Min" as const },
      { value: parts.seconds, label: "Sec" as const },
    ];

    return (
      <div className="mb-1 w-full">
        <p className="text-sm font-bold uppercase tracking-[0.28em] text-amber-200 sm:text-xs sm:tracking-[0.24em]">
          Live in
        </p>
        <div className="mt-3 flex w-full gap-1.5 sm:mt-2.5 sm:gap-2.5">
          {units.map((unit) => (
            <CountdownUnit
              key={unit.label}
              onDark
              hero
              value={unit.value}
              label={unit.label}
            />
          ))}
        </div>
        <p className="mt-2 line-clamp-1 text-sm font-semibold text-white/90 sm:text-xs sm:text-white/75">
          {schedule.title}
        </p>
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
