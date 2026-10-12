"use client";

import Image from "next/image";
import type { ChoirAvailabilityOpportunityView } from "@/lib/choir-availability-types";
import { CHOIR_HERO_IMAGE_PATH } from "@/lib/choir-group-constants";

type OpportunityCardProps = {
  row: ChoirAvailabilityOpportunityView;
  onSelect: () => void;
};

function statusClass(status: string) {
  if (status === "available") return "choir-avail-status-available";
  if (status === "unavailable") return "choir-avail-status-unavailable";
  if (status === "maybe") return "choir-avail-status-maybe";
  return "choir-avail-status-pending";
}

export function OpportunityCard({ row, onSelect }: OpportunityCardProps) {
  const event = row.event;
  const date = new Date(`${event.dateKey}T12:00:00`);
  const month = date.toLocaleDateString(undefined, { month: "short" }).toUpperCase();
  const day = date.getDate();
  const weekday = date.toLocaleDateString(undefined, { weekday: "short" }).toUpperCase();

  return (
    <button type="button" className="choir-calendar-event-card w-full text-left" onClick={onSelect}>
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
        {row.conflicts.length > 0 ? (
          <p className="mt-1 text-[10px] font-bold text-red-700">Scheduling note — review details</p>
        ) : null}
      </div>
      <span className={`choir-avail-status-badge ${statusClass(row.availabilityStatus)}`}>
        {row.availabilityLabel}
      </span>
      <span className="choir-calendar-event-chevron" aria-hidden>›</span>
    </button>
  );
}
