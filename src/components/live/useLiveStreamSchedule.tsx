"use client";

import { useCallback, useEffect, useState } from "react";
import { LiveStreamCountdown } from "@/components/live/LiveStreamCountdown";
import type { LiveStreamSchedule } from "@/lib/live-schedule-types";
import type { LiveStreamPhase } from "@/lib/live-schedule-utils";

export function useUpcomingLiveStreamSchedule() {
  const [schedule, setSchedule] = useState<LiveStreamSchedule | null>(null);
  const [livePhase, setLivePhase] = useState<LiveStreamPhase | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const response = await fetch("/api/live/schedule");
    const data = await response.json();
    if (response.ok) {
      setSchedule(data.schedule ?? null);
      setLivePhase(data.livePhase ?? null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (livePhase !== "live") return;
    const id = window.setInterval(() => void refresh(), 60_000);
    return () => window.clearInterval(id);
  }, [livePhase, refresh]);

  return {
    schedule,
    livePhase,
    loading,
    refresh,
    clearSchedule: refresh,
  };
}

type LiveStreamCountdownBannerProps = {
  variant?: "card" | "inline" | "on-dark" | "home-flyer" | "desktop-flyer";
};

export function LiveStreamCountdownBanner({ variant = "card" }: LiveStreamCountdownBannerProps) {
  const { schedule, livePhase, loading, refresh } = useUpcomingLiveStreamSchedule();

  if (loading || !schedule || livePhase !== "upcoming") return null;

  return (
    <LiveStreamCountdown schedule={schedule} variant={variant} onComplete={refresh} />
  );
}

export function LiveStreamCountdownInline() {
  const { schedule, livePhase, loading, refresh } = useUpcomingLiveStreamSchedule();

  if (loading || !schedule || livePhase !== "upcoming") return null;

  return (
    <LiveStreamCountdown
      schedule={schedule}
      variant="home-flyer"
      onComplete={refresh}
    />
  );
}
