"use client";

import { useCallback, useEffect, useState } from "react";
import { LiveStreamCountdown } from "@/components/live/LiveStreamCountdown";
import type { LiveStreamSchedule } from "@/lib/live-schedule-types";

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
  variant?: "card" | "inline" | "on-dark" | "home-flyer" | "desktop-hero";
};

export function LiveStreamCountdownBanner({ variant = "card" }: LiveStreamCountdownBannerProps) {
  const { schedule, loading, clearSchedule } = useUpcomingLiveStreamSchedule();

  if (loading || !schedule) return null;

  return (
    <LiveStreamCountdown schedule={schedule} variant={variant} onComplete={clearSchedule} />
  );
}

export function LiveStreamCountdownInline() {
  const { schedule, loading, clearSchedule } = useUpcomingLiveStreamSchedule();

  if (loading || !schedule) return null;

  return (
    <LiveStreamCountdown
      schedule={schedule}
      variant="home-flyer"
      onComplete={clearSchedule}
    />
  );
}
