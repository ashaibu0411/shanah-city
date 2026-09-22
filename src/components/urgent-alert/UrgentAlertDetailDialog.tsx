"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AlertPublicShare } from "@/components/share/AlertPublicShare";
import { UrgentAlertFlyerImage } from "@/components/urgent-alert/UrgentAlertFlyerImage";
import { urgentAlertScheduleLabel } from "@/lib/urgent-alert-utils";
import type { UrgentAlert } from "@/lib/urgent-alert-types";

type UrgentAlertDetailDialogProps = {
  alert: UrgentAlert | null;
  open: boolean;
  onClose: () => void;
};

export function UrgentAlertDetailDialog({
  alert,
  open,
  onClose,
}: UrgentAlertDetailDialogProps) {
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open || !alert) return null;

  const ctaLabel = alert.ctaLabel?.trim() || "Learn more";
  const href = alert.href?.trim();
  const scheduleLabel = urgentAlertScheduleLabel(alert);
  const hasMedia = Boolean(alert.imageUrl || alert.videoUrl);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-night-950/70 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={`urgent-alert-detail-${alert.id}`}
      onClick={onClose}
    >
      <div
        className="max-h-[min(92vh,720px)] w-full max-w-lg overflow-y-auto rounded-2xl border-2 border-red-500/80 bg-gradient-to-br from-red-700 via-red-600 to-orange-600 p-5 text-white shadow-2xl sm:max-w-xl sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-red-100">
            Announcement
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white hover:bg-white/25"
          >
            Close
          </button>
        </div>

        <h2
          id={`urgent-alert-detail-${alert.id}`}
          className="mt-3 font-display text-2xl font-bold leading-tight"
        >
          {alert.title}
        </h2>
        <p className="mt-3 text-base leading-relaxed text-red-50/95">{alert.message}</p>
        {scheduleLabel ? (
          <p className="mt-2 text-xs font-medium text-red-100/80">{scheduleLabel}</p>
        ) : null}

        {hasMedia ? (
          <div className="mt-4 space-y-3">
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
                className="w-full max-h-[min(60vh,480px)] rounded-2xl border border-white/20 bg-black/30 object-contain"
              />
            ) : null}
          </div>
        ) : null}

        {href ? (
          <Link
            href={href}
            className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-white px-4 py-3 text-sm font-bold text-red-700 shadow-md transition hover:bg-red-50 sm:w-auto"
            onClick={onClose}
          >
            {ctaLabel}
          </Link>
        ) : null}

        <div className="mt-5 border-t border-white/20 pt-4">
          <AlertPublicShare alertId={alert.id} title={alert.title} message={alert.message} onDark />
        </div>
      </div>
    </div>
  );
}
