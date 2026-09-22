"use client";

import Link from "next/link";
import { AlertPublicShare } from "@/components/share/AlertPublicShare";
import { UrgentAlertFlyerImage } from "@/components/urgent-alert/UrgentAlertFlyerImage";
import { urgentAlertScheduleLabel } from "@/lib/urgent-alert-utils";
import type { UrgentAlert } from "@/lib/urgent-alert-types";

type UrgentAlertDetailViewProps = {
  alert: UrgentAlert;
};

export function UrgentAlertDetailView({ alert }: UrgentAlertDetailViewProps) {
  const ctaLabel = alert.ctaLabel?.trim() || "Learn more";
  const href = alert.href?.trim();
  const scheduleLabel = urgentAlertScheduleLabel(alert);
  const hasMedia = Boolean(alert.imageUrl || alert.videoUrl);

  return (
    <article className="mx-auto max-w-2xl space-y-5">
      <Link
        href="/"
        className="inline-flex text-sm font-semibold text-night-600 transition hover:text-night-900 dark:text-sand-300 dark:hover:text-sand-50"
      >
        ← Back to home
      </Link>

      <div className="overflow-hidden rounded-2xl border-2 border-red-500/80 bg-gradient-to-br from-red-700 via-red-600 to-orange-600 p-5 text-white shadow-xl shadow-red-900/25 sm:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-red-100">
          Urgent alert
        </p>
        <h1 className="mt-3 font-display text-3xl font-bold leading-tight sm:text-4xl">
          {alert.title}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-red-50/95 sm:text-lg">{alert.message}</p>
        {scheduleLabel ? (
          <p className="mt-3 text-xs font-medium text-red-100/85">{scheduleLabel}</p>
        ) : null}

        {hasMedia ? (
          <div className="mt-6 space-y-4">
            {alert.imageUrl ? (
              <UrgentAlertFlyerImage
                src={alert.imageUrl}
                alt=""
                context="home"
                className="border border-white/20"
              />
            ) : null}
            {alert.videoUrl ? (
              <video
                src={alert.videoUrl}
                controls
                playsInline
                preload="metadata"
                className="w-full max-h-[min(70vh,560px)] rounded-2xl border border-white/20 bg-black/30 object-contain"
              />
            ) : null}
          </div>
        ) : null}

        {href ? (
          <Link
            href={href}
            className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-white px-5 py-3.5 text-sm font-bold text-red-700 shadow-md transition hover:bg-red-50 sm:w-auto"
          >
            {ctaLabel}
          </Link>
        ) : null}

        <div className="mt-6 border-t border-white/20 pt-5">
          <AlertPublicShare alertId={alert.id} title={alert.title} message={alert.message} onDark />
        </div>
      </div>
    </article>
  );
}
