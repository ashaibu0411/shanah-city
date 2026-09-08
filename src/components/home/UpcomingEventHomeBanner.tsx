"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { nextUpcomingOccurrence } from "@/lib/mobile-page-chrome";
import type { ChurchEvent } from "@/lib/types";

export function UpcomingEventHomeBanner() {
  const [next, setNext] = useState<{ item: ChurchEvent; isoDate: string } | null>(null);

  useEffect(() => {
    fetch("/api/events?groupId=church")
      .then((response) => response.json())
      .then((data) => {
        const events = (data.events ?? []) as ChurchEvent[];
        setNext(nextUpcomingOccurrence(events));
      })
      .catch(() => undefined);
  }, []);

  if (!next) return null;

  const when = new Date(`${next.isoDate}T12:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <Link
      href={`/calendar?event=${encodeURIComponent(next.item.id)}`}
      className="block rounded-2xl border border-violet-200/80 bg-gradient-to-r from-violet-50/95 to-sand-50/90 px-4 py-3 ring-1 ring-violet-100 transition hover:border-violet-300 active:scale-[0.99]"
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-700">
        Coming up
      </p>
      <p className="mt-1 font-display text-base font-semibold text-night-900">
        {next.item.title}
      </p>
      <p className="mt-1 text-sm text-night-600">
        {when}
        {next.item.time ? ` · ${next.item.time}` : ""}
        {next.item.location ? ` · ${next.item.location}` : ""}
      </p>
      <p className="mt-2 text-sm font-semibold text-violet-900">Open church calendar →</p>
    </Link>
  );
}
