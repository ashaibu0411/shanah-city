"use client";

import Image from "next/image";
import type { ChoirTeamAssignmentView } from "@/lib/choir-team-types";
import { CHOIR_HERO_IMAGE_PATH } from "@/lib/choir-group-constants";

const STATUS_LABEL: Record<ChoirTeamAssignmentView["status"], string> = {
  confirmed: "Confirmed",
  assigned: "Assigned",
  past: "Past assignment",
};

type TeamAssignmentCardProps = {
  assignment: ChoirTeamAssignmentView;
  onSelect: () => void;
  showStatusBadge?: boolean;
};

export function TeamAssignmentCard({ assignment, onSelect, showStatusBadge }: TeamAssignmentCardProps) {
  const date = new Date(`${assignment.serviceDate}T12:00:00`);
  const month = date.toLocaleDateString(undefined, { month: "short" }).toUpperCase();
  const day = date.getDate();
  const weekday = date.toLocaleDateString(undefined, { weekday: "short" }).toUpperCase();

  return (
    <button type="button" onClick={onSelect} className="choir-calendar-event-card w-full text-left">
      <div className="choir-calendar-event-date">
        <span className="choir-calendar-event-month">{month}</span>
        <span className="choir-calendar-event-day">{day}</span>
        <span className="choir-calendar-event-dow">{weekday}</span>
      </div>
      <div className="choir-calendar-event-thumb-wrap">
        <Image src={CHOIR_HERO_IMAGE_PATH} alt="" width={56} height={56} className="choir-calendar-event-thumb" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="choir-calendar-event-title">{assignment.title}</p>
        <p className="choir-calendar-event-meta">
          <span aria-hidden>🕐</span> {assignment.timeLabel}
        </p>
        <p className="choir-calendar-event-meta">
          <span aria-hidden>📍</span> {assignment.location}
        </p>
        <p className="choir-calendar-event-meta">
          <span aria-hidden>♫</span> {assignment.songCount} song{assignment.songCount === 1 ? "" : "s"} assigned
          {assignment.status === "past" ? " · Served" : ""}
        </p>
      </div>
      {showStatusBadge && assignment.status === "past" ? (
        <span className="choir-team-status-badge choir-team-status-past">{STATUS_LABEL.past}</span>
      ) : (
        <span className="choir-team-role-badge">{assignment.roleLabel}</span>
      )}
      <span className="choir-calendar-event-chevron" aria-hidden>›</span>
    </button>
  );
}
