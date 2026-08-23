"use client";

import { useCallback, useEffect, useState } from "react";
import { LiveStreamCountdown } from "@/components/live/LiveStreamCountdown";
import type { LiveStreamSchedule } from "@/lib/live-schedule-types";
import { formatLiveStreamCountdown, getLiveStreamCountdown } from "@/lib/live-schedule-utils";

export function useUpcomingLiveStreamSchedule() {
  const [schedule, setSchedule] = useState<LiveStreamSchedule | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const response = await fetch("/api/live/schedule");
    const data = await response.json();
    if (response.ok) {
      setSchedule(data.schedule ?? null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { schedule, loading, refresh, clearSchedule: () => setSchedule(null) };
}

type LiveStreamCountdownBannerProps = {
  variant?: "card" | "inline" | "on-dark";
};

export function LiveStreamCountdownBanner({ variant = "card" }: LiveStreamCountdownBannerProps) {
  const { schedule, loading, clearSchedule } = useUpcomingLiveStreamSchedule();

  if (loading || !schedule) return null;

  return (
    <LiveStreamCountdown schedule={schedule} variant={variant} onComplete={clearSchedule} />
  );
}

export function LiveStreamCountdownInline() {
  const { schedule, loading } = useUpcomingLiveStreamSchedule();
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!schedule) {
      setLabel(null);
      return;
    }
    const tick = () => {
      const parts = getLiveStreamCountdown(schedule.startsAt);
      setLabel(parts.done ? null : formatLiveStreamCountdown(parts));
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [schedule]);

  if (loading || !schedule || !label) return null;

  return (
    <span className="inline-flex items-center rounded-full bg-amber-400/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-night-950 shadow-sm">
      Live in {label}
    </span>
  );
}
