"use client";

import Link from "next/link";
import { AlertPublicShare } from "@/components/share/AlertPublicShare";
import { urgentAlertScheduleLabel } from "@/lib/urgent-alert-utils";
import type { UrgentAlert } from "@/lib/urgent-alert-types";

type UrgentAlertBannerProps = {
  alert: UrgentAlert | null;
  variant?: "desktop" | "mobile";
  highlighted?: boolean;
};

export function UrgentAlertBanner({
  alert,
  variant = "desktop",
  highlighted = false,
}: UrgentAlertBannerProps) {
  if (!alert) return null;

  const isMobile = variant === "mobile";
  const ctaLabel = alert.ctaLabel?.trim() || "Learn more";
  const href = alert.href?.trim();
  const hasMedia = Boolean(alert.imageUrl || alert.videoUrl);
  const scheduleLabel = urgentAlertScheduleLabel(alert);

  return (
    <section
      id={`urgent-alert-${alert.id}`}
      role="alert"
      aria-live="assertive"
      className={`relative overflow-hidden border-2 border-red-500/80 bg-gradient-to-r from-red-700 via-red-600 to-orange-600 text-white shadow-lg shadow-red-900/30 ${
        highlighted ? "ring-4 ring-amber-300/80" : ""
      } ${isMobile ? "rounded-[1.25rem] p-4" : "mb-6 rounded-2xl p-5 md:p-6"}`}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_55%)]"
        aria-hidden
      />
      <div
        className={`relative ${hasMedia ? "grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,280px)] md:items-start" : "flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-6"}`}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-70" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
            </span>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-red-100">
              Urgent alert
            </p>
          </div>
          <h2
            className={`mt-2 font-display font-bold leading-tight ${isMobile ? "text-lg" : "text-xl md:text-2xl"}`}
          >
            {alert.title}
          </h2>
          <p
            className={`mt-2 text-red-50/95 ${isMobile ? "text-sm leading-relaxed" : "text-base leading-relaxed"}`}
          >
            {alert.message}
          </p>
          {scheduleLabel ? (
            <p className="mt-2 text-[11px] font-medium text-red-100/80">{scheduleLabel}</p>
          ) : null}

          {href ? (
            <Link
              href={href}
              className={`mt-4 inline-flex items-center justify-center rounded-full bg-white px-4 py-2.5 text-sm font-bold text-red-700 shadow-md transition hover:bg-red-50 ${
                hasMedia ? "" : isMobile ? "w-full md:w-auto" : ""
              }`}
            >
              {ctaLabel}
            </Link>
          ) : null}
        </div>

        {hasMedia ? (
          <div className="space-y-3">
            {alert.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={alert.imageUrl}
                alt=""
                className="w-full rounded-2xl border border-white/20 object-cover shadow-lg md:max-h-52"
              />
            ) : null}
            {alert.videoUrl ? (
              <video
                src={alert.videoUrl}
                controls
                playsInline
                preload="metadata"
                className="w-full rounded-2xl border border-white/20 bg-black/30 shadow-lg md:max-h-52"
              />
            ) : null}
          </div>
        ) : href ? (
          <Link
            href={href}
            className={`inline-flex shrink-0 items-center justify-center rounded-full bg-white px-4 py-2.5 text-sm font-bold text-red-700 shadow-md transition hover:bg-red-50 ${
              isMobile ? "w-full" : ""
            }`}
          >
            {ctaLabel}
          </Link>
        ) : null}
      </div>

      <AlertPublicShare
        alertId={alert.id}
        title={alert.title}
        message={alert.message}
        onDark
      />
    </section>
  );
}
