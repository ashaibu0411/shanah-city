"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ChoirAssignmentDetailSheet } from "@/components/groups/choir/ChoirAssignmentDetailSheet";
import { OpportunityCard } from "@/components/groups/choir/availability/OpportunityCard";
import { SHANAH_WORSHIP_GROUP_ID } from "@/lib/choir-group-constants";
import { choirAvailabilityHref } from "@/lib/choir-availability-links";
import type {
  ChoirAvailabilityAssignmentPreview,
  ChoirAvailabilityOpportunityView,
  ChoirMySchedulePayload,
} from "@/lib/choir-availability-types";

type ChoirMyScheduleTabProps = {
  groupId: string;
  initialData?: ChoirMySchedulePayload | null;
  initialError?: string | null;
};

export function ChoirMyScheduleTab({
  groupId,
  initialData = null,
  initialError = null,
}: ChoirMyScheduleTabProps) {
  const [data, setData] = useState<ChoirMySchedulePayload | null>(initialData);
  const [loading, setLoading] = useState(!initialData && !initialError);
  const [error, setError] = useState<string | null>(initialError);
  const [selectedAssignment, setSelectedAssignment] = useState<ChoirAvailabilityAssignmentPreview | null>(null);
  const [selectedAvailability, setSelectedAvailability] = useState<ChoirAvailabilityOpportunityView | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/groups/choir-availability?groupId=${encodeURIComponent(groupId)}&view=my_schedule`, {
      credentials: "include",
    })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok || !body.mySchedule) {
          setError(body.error ?? "Could not load your schedule.");
          setData(null);
        } else {
          setData(body.mySchedule);
          setError(null);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Network error. Check your connection and try again.");
        setLoading(false);
      });
  }, [groupId]);

  useEffect(() => {
    if (initialData || initialError) return;
    load();
  }, [load, initialData, initialError]);

  async function confirmAssignment(assignment: ChoirAvailabilityAssignmentPreview, ready: boolean) {
    const response = await fetch("/api/worship", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "mark_ready",
        serviceDate: assignment.serviceDate,
        serviceTime: assignment.serviceTime,
        ready,
      }),
    });
    if (response.ok) {
      load();
      setSelectedAssignment((current) =>
        current && current.id === assignment.id
          ? { ...current, status: ready ? "confirmed" : "assigned" }
          : current,
      );
    }
  }

  if (loading) {
    return <p className="text-sm text-[var(--choir-muted)]">Loading your schedule…</p>;
  }

  if (error) {
    return (
      <div className="choir-card p-4">
        <p className="text-sm text-red-700">{error}</p>
        <button type="button" className="choir-setlist-manage-link mt-3" onClick={load}>
          Retry
        </button>
      </div>
    );
  }

  if (!data) {
    return <p className="text-sm text-[var(--choir-muted)]">Schedule unavailable.</p>;
  }

  const hasAssignments = data.assignments.length > 0 || data.rehearsals.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-[var(--choir-heading)]">My schedule</h2>
        <p className="mt-1 text-sm text-[var(--choir-muted)]">
          Your published assignments and availability responses are shown separately below.
        </p>
      </div>

      <section className="space-y-3">
        <h3 className="font-display text-lg font-bold text-[var(--choir-heading)]">My assignments</h3>
        <p className="text-xs text-[var(--choir-muted)]">
          Services and rehearsals where worship leadership has scheduled you to serve.
        </p>
        {!hasAssignments ? (
          <div className="choir-card p-5 text-center">
            <p className="font-display text-lg font-bold text-[var(--choir-heading)]">No upcoming assignments</p>
            <p className="mt-2 text-sm text-[var(--choir-muted)]">
              You haven&apos;t been scheduled for an upcoming worship service yet. Check your availability and upcoming
              opportunities.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <Link href={choirAvailabilityHref(groupId, "home")} className="choir-btn-primary text-center">
                Update availability
              </Link>
              <Link href={`/groups/${SHANAH_WORSHIP_GROUP_ID}/calendar`} className="choir-btn-secondary text-center">
                View worship calendar
              </Link>
            </div>
          </div>
        ) : (
          <>
            <ul className="space-y-2">
              {data.assignments.map((assignment) => (
                <li key={assignment.id}>
                  <button
                    type="button"
                    className="choir-avail-assignment-card w-full text-left"
                    onClick={() => setSelectedAssignment(assignment)}
                  >
                    <div>
                      <p className="font-semibold text-[var(--choir-heading)]">{assignment.title}</p>
                      <p className="text-xs text-[var(--choir-muted)]">{assignment.dateTimeLabel}</p>
                      <p className="text-xs text-[var(--choir-body)]">{assignment.roleLabel}</p>
                      {assignment.changeRequestPending ? (
                        <p className="mt-1 text-[10px] font-bold text-[#9a5b12]">Change request pending</p>
                      ) : null}
                    </div>
                    <span
                      className={`choir-avail-status-badge ${
                        assignment.status === "confirmed" ? "choir-avail-status-available" : "choir-avail-status-pending"
                      }`}
                    >
                      {assignment.status === "confirmed" ? "Confirmed" : "Awaiting confirmation"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            {data.rehearsals.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {data.rehearsals.map((rehearsal) => (
                  <li key={rehearsal.id} className="choir-card p-3">
                    <p className="font-semibold text-[var(--choir-heading)]">{rehearsal.title}</p>
                    <p className="text-xs text-[var(--choir-muted)]">{rehearsal.dateTimeLabel}</p>
                    <p className="text-xs text-[var(--choir-body)]">{rehearsal.location}</p>
                    <p className="mt-1 text-[10px] text-[var(--choir-muted)]">For: {rehearsal.relatedServiceTitle}</p>
                  </li>
                ))}
              </ul>
            ) : null}
          </>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="font-display text-lg font-bold text-[var(--choir-heading)]">My availability</h3>
        <p className="text-xs text-[var(--choir-muted)]">
          Responses you have submitted for upcoming services and events. This is not the same as being assigned.
        </p>
        {data.availabilitySubmitted.length === 0 && data.availabilityAwaiting.length === 0 ? (
          <p className="text-sm text-[var(--choir-muted)]">No upcoming opportunities to respond to right now.</p>
        ) : null}
        {data.availabilitySubmitted.length > 0 ? (
          <ul className="space-y-2">
            {data.availabilitySubmitted.map((row) => (
              <li key={row.event.id}>
                <OpportunityCard row={row} onSelect={() => setSelectedAvailability(row)} />
              </li>
            ))}
          </ul>
        ) : null}
        {data.availabilityAwaiting.length > 0 ? (
          <div className="mt-2">
            <p className="text-xs font-bold text-[var(--choir-heading)]">Awaiting your response</p>
            <ul className="mt-2 space-y-2">
              {data.availabilityAwaiting.slice(0, 5).map((row) => (
                <li key={row.event.id}>
                  <OpportunityCard row={row} onSelect={() => setSelectedAvailability(row)} />
                </li>
              ))}
            </ul>
            {data.availabilityAwaiting.length > 5 ? (
              <Link href={choirAvailabilityHref(groupId, "upcoming")} className="choir-song-see-all mt-2 inline-block">
                See all opportunities
              </Link>
            ) : null}
          </div>
        ) : null}
      </section>

      {selectedAssignment ? (
        <ChoirAssignmentDetailSheet
          assignment={selectedAssignment}
          onClose={() => setSelectedAssignment(null)}
          onConfirm={(ready) => confirmAssignment(selectedAssignment, ready)}
          onRequestChange={() => {
            setSelectedAssignment(null);
            setSelectedAvailability(null);
          }}
        />
      ) : null}

      {selectedAvailability ? (
        <AvailabilityQuickSheet row={selectedAvailability} onClose={() => setSelectedAvailability(null)} onSaved={load} />
      ) : null}
    </div>
  );
}

function AvailabilityQuickSheet({
  row,
  onClose,
  onSaved,
}: {
  row: ChoirAvailabilityOpportunityView;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [busy, setBusy] = useState(false);

  async function save(response: string) {
    setBusy(true);
    const res = await fetch("/api/groups/choir-availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "save_response",
        groupId: SHANAH_WORSHIP_GROUP_ID,
        eventId: row.event.id,
        response,
      }),
    });
    setBusy(false);
    if (res.ok) {
      onSaved();
      onClose();
    }
  }

  return (
    <div className="choir-setlist-sheet-backdrop" role="presentation" onClick={onClose}>
      <div className="choir-setlist-sheet" role="dialog" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-xl font-bold text-[var(--choir-heading)]">{row.event.title}</h2>
        <p className="text-sm text-[var(--choir-muted)]">Update availability for this event.</p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {(["available", "unavailable", "maybe"] as const).map((response) => (
            <button
              key={response}
              type="button"
              className="choir-avail-response-btn"
              disabled={busy || !row.canEdit}
              onClick={() => save(response)}
            >
              {response === "available" ? "Available" : response === "unavailable" ? "Unavailable" : "Maybe"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
