"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { UrgentAlertFlyerImage } from "@/components/urgent-alert/UrgentAlertFlyerImage";
import type { UrgentAlert } from "@/lib/urgent-alert-types";

const AUTO_ADVANCE_MS = 9000;

type UrgentAlertCarouselProps = {
  alerts: UrgentAlert[];
  variant?: "desktop" | "mobile";
  highlightAlertId?: string | null;
};

export function UrgentAlertCarousel({
  alerts,
  variant = "desktop",
  highlightAlertId = null,
}: UrgentAlertCarouselProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const isMobile = variant === "mobile";
  const count = alerts.length;

  const highlightedIndex = useMemo(
    () => (highlightAlertId ? alerts.findIndex((alert) => alert.id === highlightAlertId) : -1),
    [alerts, highlightAlertId],
  );

  useEffect(() => {
    if (highlightedIndex >= 0) {
      setIndex(highlightedIndex);
    }
  }, [highlightedIndex]);

  useEffect(() => {
    if (count <= 1 || paused) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % count);
    }, AUTO_ADVANCE_MS);
    return () => window.clearInterval(timer);
  }, [count, paused]);

  const goTo = useCallback(
    (nextIndex: number) => {
      if (count === 0) return;
      setIndex(((nextIndex % count) + count) % count);
    },
    [count],
  );

  if (count === 0) return null;

  const alert = alerts[index];
  const highlighted = Boolean(highlightAlertId && alert.id === highlightAlertId);
  const hasFlyer = Boolean(alert.imageUrl);
  const detailHref = `/alerts/${encodeURIComponent(alert.id)}`;

  return (
    <section
      id="urgent-alerts-carousel"
      aria-roledescription="carousel"
      aria-label="Urgent alerts"
      className={`relative overflow-hidden border-2 border-red-500/80 bg-gradient-to-r from-red-700 via-red-600 to-orange-600 text-white shadow-lg shadow-red-900/30 ${
        highlighted ? "ring-4 ring-amber-300/80" : ""
      } ${isMobile ? "rounded-[1.25rem] p-4" : "mb-6 rounded-2xl p-5 md:p-6"}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_55%)]"
        aria-hidden
      />

      <div className="relative">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-70" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
            </span>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-red-100">
              {count > 1 ? `Urgent alert · ${index + 1} of ${count}` : "Urgent alert"}
            </p>
          </div>
          {count > 1 ? (
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Previous urgent alert"
                className="rounded-full bg-white/15 px-2.5 py-1 text-sm font-bold text-white hover:bg-white/25"
                onClick={() => goTo(index - 1)}
              >
                ‹
              </button>
              <button
                type="button"
                aria-label="Next urgent alert"
                className="rounded-full bg-white/15 px-2.5 py-1 text-sm font-bold text-white hover:bg-white/25"
                onClick={() => goTo(index + 1)}
              >
                ›
              </button>
            </div>
          ) : null}
        </div>

        <div className="mt-3" id={`urgent-alert-${alert.id}`}>
          <Link href={detailHref} className="block w-full text-left transition hover:opacity-95">
            <div className={`grid gap-3 ${hasFlyer ? "sm:grid-cols-[minmax(0,1fr)_120px]" : ""}`}>
              <div className="min-w-0">
                <h2
                  className={`font-display font-bold leading-tight ${isMobile ? "text-lg" : "text-xl md:text-2xl"}`}
                >
                  {alert.title}
                </h2>
                <p
                  className={`mt-2 line-clamp-3 text-red-50/95 ${isMobile ? "text-sm" : "text-base"}`}
                >
                  {alert.message}
                </p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-white underline decoration-white/40 underline-offset-2">
                  View full details
                </span>
              </div>
              {hasFlyer && alert.imageUrl ? (
                <UrgentAlertFlyerImage
                  src={alert.imageUrl}
                  alt=""
                  context="home"
                  className="max-h-28 border border-white/20 sm:max-h-32"
                />
              ) : null}
            </div>
          </Link>
          <Link
            href={`${detailHref}#urgent-alert-share`}
            className="mt-3 inline-flex text-sm font-semibold text-red-50 underline decoration-white/35 underline-offset-2 hover:text-white"
          >
            Share with others — no app needed
          </Link>
        </div>

        {count > 1 ? (
          <div className="mt-4 flex justify-center gap-1.5" role="tablist" aria-label="Choose urgent alert">
            {alerts.map((entry, dotIndex) => {
              const active = dotIndex === index;
              return (
                <button
                  key={entry.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-label={`Show urgent alert ${dotIndex + 1}: ${entry.title}`}
                  className={`h-2 rounded-full transition ${
                    active ? "w-6 bg-white" : "w-2 bg-white/40 hover:bg-white/60"
                  }`}
                  onClick={() => goTo(dotIndex)}
                />
              );
            })}
          </div>
        ) : null}
      </div>
    </section>
  );
}
