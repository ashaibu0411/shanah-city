"use client";

import Link from "next/link";
import { SHANAH_WORSHIP_GROUP_ID } from "@/lib/choir-group-constants";
import type { ChoirTeamAssignmentView } from "@/lib/choir-team-types";
import { worshipPlannerPath } from "@/lib/worship-plan-links";

type ChoirAssignmentDetailSheetProps = {
  assignment: ChoirTeamAssignmentView;
  onClose: () => void;
  onConfirm: (ready: boolean) => void;
  onRequestChange?: () => void;
};

export function ChoirAssignmentDetailSheet({
  assignment,
  onClose,
  onConfirm,
  onRequestChange,
}: ChoirAssignmentDetailSheetProps) {
  const setlistHref = `/groups/${SHANAH_WORSHIP_GROUP_ID}/setlists?date=${encodeURIComponent(assignment.serviceDate)}&time=${encodeURIComponent(assignment.serviceTime)}`;
  const rehearsalHref = `/groups/${SHANAH_WORSHIP_GROUP_ID}/rehearsal?date=${encodeURIComponent(assignment.serviceDate)}&time=${encodeURIComponent(assignment.serviceTime)}`;

  return (
    <div className="choir-setlist-sheet-backdrop" role="presentation" onClick={onClose}>
      <div className="choir-setlist-sheet" role="dialog" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-bold text-[var(--choir-heading)]">{assignment.title}</h2>
            <p className="mt-1 text-sm text-[var(--choir-muted)]">{assignment.dateTimeLabel}</p>
            <p className="text-sm text-[var(--choir-body)]">{assignment.location}</p>
          </div>
          <button type="button" className="choir-header-icon-btn !h-10 !w-10" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <p className="mt-3 text-sm">
          <span className="font-semibold">Role:</span> {assignment.roleLabel}
        </p>
        <p className="text-sm">
          <span className="font-semibold">Songs:</span> {assignment.songCount}
        </p>
        {assignment.status !== "past" ? (
          <p className="mt-2 text-sm">
            <span className="font-semibold">Assignment:</span>{" "}
            {assignment.status === "confirmed" ? "Confirmed" : "Awaiting confirmation"}
          </p>
        ) : (
          <p className="mt-2 text-sm text-[var(--choir-muted)]">Past assignment (attendance not recorded here).</p>
        )}
        <div className="mt-4 flex flex-col gap-2">
          <Link href={setlistHref} className="choir-btn-primary text-center">Open setlist</Link>
          <Link href={rehearsalHref} className="choir-btn-secondary text-center">Rehearsal room</Link>
          <Link
            href={worshipPlannerPath({ serviceDate: assignment.serviceDate, serviceTime: assignment.serviceTime })}
            className="choir-setlist-manage-link text-center"
          >
            Worship plan
          </Link>
          {assignment.status !== "past" ? (
            assignment.status === "confirmed" ? (
              <button type="button" className="choir-btn-secondary" onClick={() => onConfirm(false)}>
                Mark not confirmed
              </button>
            ) : (
              <button type="button" className="choir-btn-primary" onClick={() => onConfirm(true)}>
                Confirm assignment
              </button>
            )
          ) : null}
          {onRequestChange ? (
            <button type="button" className="choir-avail-response-btn" onClick={onRequestChange}>
              Request schedule change
            </button>
          ) : null}
          <Link
            href={`/groups/${SHANAH_WORSHIP_GROUP_ID}/availability`}
            className="choir-setlist-manage-link text-center"
          >
            Update availability
          </Link>
        </div>
      </div>
    </div>
  );
}
