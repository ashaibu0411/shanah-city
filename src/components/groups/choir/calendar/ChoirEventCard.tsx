"use client";

import Image from "next/image";
import type { ChoirCalendarEvent } from "@/lib/choir-calendar-types";
import { CHOIR_HERO_IMAGE_PATH } from "@/lib/choir-group-constants";

const BADGE_LABEL: Record<ChoirCalendarEvent["category"], string> = {
  service: "Service",
  rehearsal: "Rehearsal",
  event: "Event",
  other: "Other",
};

type ChoirEventCardProps = {
  event: ChoirCalendarEvent;
  selected?: boolean;
  onSelect: () => void;
};

export function ChoirEventCard({ event, selected, onSelect }: ChoirEventCardProps) {
  const date = new Date(`${event.dateKey}T12:00:00`);
  const month = date.toLocaleDateString(undefined, { month: "short" }).toUpperCase();
  const day = date.getDate();
  const weekday = date.toLocaleDateString(undefined, { weekday: "short" }).toUpperCase();

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`choir-calendar-event-card w-full text-left ${selected ? "is-selected" : ""}`}
    >
      <div className="choir-calendar-event-date">
        <span className="choir-calendar-event-month">{month}</span>
        <span className="choir-calendar-event-day">{day}</span>
        <span className="choir-calendar-event-dow">{weekday}</span>
      </div>
      <div className="choir-calendar-event-thumb-wrap">
        <Image src={CHOIR_HERO_IMAGE_PATH} alt="" width={56} height={56} className="choir-calendar-event-thumb" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="choir-calendar-event-title">{event.title}</p>
        <p className="choir-calendar-event-meta">
          <span aria-hidden>🕐</span> {event.timeLabel}
        </p>
        <p className="choir-calendar-event-meta">
          <span aria-hidden>📍</span> {event.location}
        </p>
        {event.teamLabel ? (
          <p className="choir-calendar-event-meta">
            <span aria-hidden>♫</span> {event.teamLabel}
          </p>
        ) : null}
      </div>
      <span className={`choir-calendar-event-badge choir-calendar-event-badge-${event.category}`}>
        {BADGE_LABEL[event.category]}
      </span>
      <span className="choir-calendar-event-chevron" aria-hidden>›</span>
    </button>
  );
}
