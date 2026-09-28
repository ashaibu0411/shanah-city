"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { UrgentAlert } from "@/lib/urgent-alert-types";
import { urgentAlertCommunityPostHref } from "@/lib/urgent-alert-utils";

const AUTO_ADVANCE_MS = 7000;

type UrgentNewsHomeStripProps = {
  alerts: UrgentAlert[];
  highlightAlertId?: string | null;
  variant?: "mobile" | "desktop";
};

export function UrgentNewsHomeStrip({
  alerts,
  highlightAlertId = null,
  variant = "mobile",
}: UrgentNewsHomeStripProps) {
  const [index, setIndex] = useState(0);
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
    if (count <= 1) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % count);
    }, AUTO_ADVANCE_MS);
    return () => window.clearInterval(timer);
  }, [count]);

  if (count === 0) return null;

  const alert = alerts[index];
  const href = urgentAlertCommunityPostHref(alert.id);
  const highlighted = Boolean(highlightAlertId && alert.id === highlightAlertId);
  const embedded = variant === "mobile";

  return (
    <div
      id="urgent-news-home-strip"
      className={`urgent-news-home-strip ${embedded ? "urgent-news-home-strip--embedded" : "urgent-news-home-strip--desktop"} ${
        highlighted ? "urgent-news-home-strip--highlight" : ""
      }`}
    >
      <div className="urgent-news-home-strip__marquee" aria-hidden>
        <span className="urgent-news-home-strip__marquee-track">
          Read · Read · Read · Read · Read · Read · Read · Read ·
        </span>
      </div>

      <Link
        href={href}
        id={`urgent-news-home-${alert.id}`}
        className="urgent-news-home-strip__link"
      >
        <span className="urgent-news-home-strip__pulse" aria-hidden />
        <span className="urgent-news-home-strip__badge">Urgent</span>
        <span className="urgent-news-home-strip__title" key={alert.id}>
          {alert.title}
        </span>
        <span className="urgent-news-home-strip__cta">
          Read
          <span className="urgent-news-home-strip__cta-arrow" aria-hidden>
            →
          </span>
        </span>
      </Link>

      {count > 1 ? (
        <div className="urgent-news-home-strip__dots" role="tablist" aria-label="Urgent news items">
          {alerts.map((entry, dotIndex) => (
            <button
              key={entry.id}
              type="button"
              role="tab"
              aria-selected={dotIndex === index}
              aria-label={`Show urgent item ${dotIndex + 1}: ${entry.title}`}
              className={`urgent-news-home-strip__dot ${dotIndex === index ? "is-active" : ""}`}
              onClick={(event) => {
                event.preventDefault();
                setIndex(dotIndex);
              }}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
