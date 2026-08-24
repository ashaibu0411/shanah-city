"use client";

import { useEffect, useState } from "react";
import {
  SHIFT_YOUR_EVENING_ID,
  SHIFT_YOUR_MORNING_ID,
  isTrackedJoinMeeting,
} from "@/lib/meeting-catalog";
import { buildTrackedJoinUrl } from "@/lib/meeting-join-utils";
import {
  getActiveHomePrayerMeeting,
  msUntilNextPrayerHomeChange,
} from "@/lib/prayer-schedule";
import type { Meeting } from "@/lib/types";
import { Card } from "@/components/ui";

type PrayerHomeBannerProps = {
  variant?: "desktop" | "mobile";
};

export function PrayerHomeBanner({ variant = "desktop" }: PrayerHomeBannerProps) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [now, setNow] = useState(() => new Date());
  const mobile = variant === "mobile";

  useEffect(() => {
    fetch("/api/meetings")
      .then((response) => response.json())
      .then((data) => setMeetings(data.meetings ?? []))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | undefined;

    const tick = () => {
      setNow(new Date());
      timeout = setTimeout(tick, msUntilNextPrayerHomeChange());
    };

    tick();
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, []);

  const active = getActiveHomePrayerMeeting(meetings, now);
  if (!active) return null;

  const href = isTrackedJoinMeeting(active.id)
    ? buildTrackedJoinUrl({ meetingId: active.id, source: "home" })
    : "/meetings";
  const eyebrow =
    active.id === SHIFT_YOUR_MORNING_ID
      ? "Morning prayer · live now"
      : active.id === SHIFT_YOUR_EVENING_ID
        ? "Evening prayer · live now"
        : "Prayer · live now";

  if (mobile) {
    return (
      <a
        href={href}
        className="mobile-card block border border-amber-200/80 bg-gradient-to-r from-amber-50/95 to-sand-50/95 p-3.5 transition active:scale-[0.99]"
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-700">
          {eyebrow}
        </p>
        <h3 className="mt-1 font-display text-lg font-semibold tracking-tight text-night-900">
          {active.title}
        </h3>
        <p className="mt-1 text-sm text-night-600">{active.schedule} · Zoom</p>
        <p className="mt-2 text-sm font-semibold text-night-800">Tap to join prayer →</p>
      </a>
    );
  }

  return (
    <Card href={href} className="mb-8 border-amber-200/80 bg-gradient-to-r from-amber-50/95 to-sand-50/95">
      <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">{eyebrow}</p>
      <h3 className="mt-2 font-display text-xl font-semibold text-night-900">{active.title}</h3>
      <p className="mt-1 text-sm text-night-600">{active.schedule} · Zoom</p>
      <p className="mt-3 text-sm font-semibold text-night-800">Tap to join prayer →</p>
    </Card>
  );
}
