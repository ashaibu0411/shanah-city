"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChoirAssignmentDetailSheet } from "@/components/groups/choir/ChoirAssignmentDetailSheet";
import { ChoirSetlistHeader } from "@/components/groups/choir/setlist/ChoirSetlistHeader";
import { choirAvailabilityHref } from "@/lib/choir-availability-links";
import { SHANAH_WORSHIP_GROUP_ID } from "@/lib/choir-group-constants";
import type {
  ChoirAvailabilityAssignmentPreview,
  ChoirMySchedulePayload,
  ChoirMyScheduleRehearsalView,
} from "@/lib/choir-availability-types";
import type { ChoirTeamAssignmentView } from "@/lib/choir-team-types";
import "../choir-premium.css";

const PAST_PAGE_SIZE = 5;

type ChoirMySchedulePageProps = {
  groupId: string;
  embedded?: boolean;
  initialData?: ChoirMySchedulePayload | null;
  initialError?: string | null;
};

function assignmentEventId(assignment: ChoirTeamAssignmentView) {
  return `worship-service-${assignment.planKey}`;
}

function statusLabel(status: ChoirTeamAssignmentView["status"]) {
  if (status === "confirmed") return "Confirmed";
  if (status === "past") return "Completed";
  return "Awaiting confirmation";
}

function changeStatusLabel(status: "pending" | "approved" | "declined") {
  if (status === "approved") return "Approved";
  if (status === "declined") return "Declined";
  return "Pending review";
}

export function ChoirMySchedulePage({
  groupId,
  embedded = false,
  initialData = null,
  initialError = null,
}: ChoirMySchedulePageProps) {
  const [data, setData] = useState<ChoirMySchedulePayload | null>(initialData);
  const [loading, setLoading] = useState(!initialData && !initialError);
  const [error, setError] = useState<string | null>(initialError);
  const [section, setSection] = useState<"upcoming" | "past">("upcoming");
  const [pastVisible, setPastVisible] = useState(PAST_PAGE_SIZE);
  const [selectedAssignment, setSelectedAssignment] = useState<ChoirTeamAssignmentView | null>(null);
  const [changeTarget, setChangeTarget] = useState<ChoirTeamAssignmentView | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

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

  const pastSlice = useMemo(() => {
    if (!data) return [];
    return data.pastAssignments.slice(0, pastVisible);
  }, [data, pastVisible]);

  const hasUpcoming =
    (data?.assignments.length ?? 0) > 0 || (data?.rehearsals.length ?? 0) > 0;

  async function confirmAssignment(assignment: ChoirTeamAssignmentView, ready: boolean) {
    setConfirmBusy(true);
    setActionError(null);
    setActionMessage(null);
    const response = await fetch("/api/worship", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        action: "mark_ready",
        serviceDate: assignment.serviceDate,
        serviceTime: assignment.serviceTime,
        ready,
      }),
    });
    setConfirmBusy(false);
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setActionError(body.error ?? "Could not update confirmation.");
      return;
    }
    setActionMessage(ready ? "Assignment confirmed." : "Confirmation cleared.");
    load();
    setSelectedAssignment((current) =>
      current && current.id === assignment.id
        ? { ...current, status: ready ? "confirmed" : "assigned" }
        : current,
    );
  }

  async function submitChangeRequest(assignment: ChoirTeamAssignmentView, reason: string) {
    setActionError(null);
    const response = await fetch("/api/groups/choir-availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        action: "request_change",
        groupId: SHANAH_WORSHIP_GROUP_ID,
        eventId: assignmentEventId(assignment),
        reason,
        requestType: "cannot_serve",
      }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      setActionError(body.error ?? "Could not submit change request.");
      return;
    }
    setActionMessage("Change request submitted for leadership review.");
    setChangeTarget(null);
    setSelectedAssignment(null);
    load();
  }

  const body = (
    <div className={`choir-my-schedule-page space-y-5 ${embedded ? "" : "pb-8"}`}>
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--choir-heading)]">My Schedule</h1>
        <p className="mt-1 text-sm text-[var(--choir-muted)]">
          Published worship assignments from the service planner — not availability responses.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-[var(--choir-muted)]">Loading your schedule…</p>
      ) : error ? (
        <div className="choir-card p-4">
          <p className="text-sm font-medium text-[var(--choir-heading)]">Could not load schedule</p>
          <p className="mt-1 text-sm text-red-700">{error}</p>
          <button type="button" className="choir-setlist-manage-link mt-3" onClick={load}>
            Retry
          </button>
        </div>
      ) : !data ? (
        <div className="choir-card p-4">
          <p className="text-sm text-[var(--choir-muted)]">Schedule unavailable.</p>
          <button type="button" className="choir-setlist-manage-link mt-3" onClick={load}>
            Retry
          </button>
        </div>
      ) : (
        <>
          <section className="choir-my-schedule-summary" aria-label="Schedule summary">
            <div className="choir-my-schedule-metric">
              <p className="choir-my-schedule-metric-value">{data.summary.upcomingCount}</p>
              <p className="choir-my-schedule-metric-label">Upcoming</p>
            </div>
            <div className="choir-my-schedule-metric">
              <p className="choir-my-schedule-metric-value">{data.summary.confirmedCount}</p>
              <p className="choir-my-schedule-metric-label">Confirmed</p>
            </div>
            <div className="choir-my-schedule-metric">
              <p className="choir-my-schedule-metric-value">{data.summary.awaitingConfirmationCount}</p>
              <p className="choir-my-schedule-metric-label">Awaiting</p>
            </div>
          </section>

          <div className="choir-my-schedule-segments" role="tablist" aria-label="Assignment timeframe">
            <button
              type="button"
              role="tab"
              aria-selected={section === "upcoming"}
              className={section === "upcoming" ? "is-active" : ""}
              onClick={() => setSection("upcoming")}
            >
              Upcoming
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={section === "past"}
              className={section === "past" ? "is-active" : ""}
              onClick={() => setSection("past")}
            >
              Past
            </button>
          </div>

          {section === "upcoming" ? (
            <section className="space-y-3" aria-label="Upcoming assignments">
              {!hasUpcoming ? (
                <div className="choir-card p-5 text-center">
                  <p className="font-display text-lg font-bold text-[var(--choir-heading)]">
                    No Upcoming Assignments
                  </p>
                  <p className="mt-2 text-sm text-[var(--choir-muted)]">
                    You haven&apos;t been scheduled for an upcoming worship service yet.
                  </p>
                  <div className="mt-4 flex flex-col gap-2">
                    <Link href={choirAvailabilityHref(groupId, "home")} className="choir-btn-primary text-center">
                      Update Availability
                    </Link>
                    <Link
                      href={`/groups/${encodeURIComponent(groupId)}/calendar`}
                      className="choir-btn-secondary text-center"
                    >
                      View Worship Calendar
                    </Link>
                  </div>
                </div>
              ) : (
                <ul className="space-y-2">
                  {data.assignments.map((assignment) => (
                    <li key={assignment.id}>
                      <AssignmentCard
                        assignment={assignment}
                        onOpen={() => setSelectedAssignment(assignment)}
                      />
                    </li>
                  ))}
                  {data.rehearsals.map((rehearsal) => (
                    <li key={rehearsal.id}>
                      <RehearsalCard rehearsal={rehearsal} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ) : (
            <section className="space-y-3" aria-label="Past assignments">
              {data.pastAssignments.length === 0 ? (
                <p className="text-sm text-[var(--choir-muted)]">No past assignments in the last few services.</p>
              ) : (
                <>
                  <ul className="space-y-2">
                    {pastSlice.map((assignment) => (
                      <li key={assignment.id}>
                        <AssignmentCard assignment={assignment} onOpen={() => setSelectedAssignment(assignment)} past />
                      </li>
                    ))}
                  </ul>
                  {pastVisible < data.pastAssignments.length ? (
                    <button
                      type="button"
                      className="choir-setlist-manage-link w-full text-center"
                      onClick={() => setPastVisible((count) => count + PAST_PAGE_SIZE)}
                    >
                      Load more
                    </button>
                  ) : null}
                </>
              )}
            </section>
          )}

          {data.changeRequests.length > 0 ? (
            <section className="space-y-2" aria-label="Schedule change requests">
              <h2 className="font-display text-lg font-bold text-[var(--choir-heading)]">Change requests</h2>
              <ul className="space-y-2">
                {data.changeRequests.map((request) => (
                  <li key={request.id} className="choir-card p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-[var(--choir-heading)]">{request.eventTitle}</p>
                        <p className="mt-1 text-xs text-[var(--choir-muted)] line-clamp-2">{request.reason}</p>
                      </div>
                      <span className="choir-avail-status-badge choir-avail-status-pending shrink-0 text-[10px]">
                        {changeStatusLabel(request.status)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <Link
            href={`/groups/${encodeURIComponent(groupId)}/calendar`}
            className="choir-btn-secondary block w-full text-center"
          >
            View Worship Calendar
          </Link>

          {actionMessage ? <p className="text-sm text-[var(--choir-body)]">{actionMessage}</p> : null}
          {actionError ? <p className="text-sm text-red-700">{actionError}</p> : null}
        </>
      )}

      {selectedAssignment ? (
        <ChoirAssignmentDetailSheet
          assignment={selectedAssignment}
          onClose={() => setSelectedAssignment(null)}
          onConfirm={(ready) => confirmAssignment(selectedAssignment, ready)}
          onRequestChange={() => {
            setChangeTarget(selectedAssignment);
            setSelectedAssignment(null);
          }}
          confirmBusy={confirmBusy}
        />
      ) : null}

      {changeTarget ? (
        <ChangeRequestSheet
          assignment={changeTarget}
          onClose={() => setChangeTarget(null)}
          onSubmit={(reason) => submitChangeRequest(changeTarget, reason)}
        />
      ) : null}
    </div>
  );

  if (embedded) {
    return body;
  }

  return (
    <div className="choir-group-home choir-page-shell space-y-[18px] pt-1">
      <ChoirSetlistHeader groupId={groupId} chatHref={data?.groupChatHref ?? `/groups/${groupId}?chat=1`} />
      {body}
    </div>
  );
}

function AssignmentCard({
  assignment,
  onOpen,
  past = false,
}: {
  assignment: ChoirAvailabilityAssignmentPreview | ChoirTeamAssignmentView;
  onOpen: () => void;
  past?: boolean;
}) {
  const pending = "changeRequestPending" in assignment && assignment.changeRequestPending;
  return (
    <button type="button" className="choir-my-schedule-assignment w-full text-left" onClick={onOpen}>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-[var(--choir-heading)]">{assignment.title}</p>
        <p className="text-xs text-[var(--choir-muted)]">{assignment.dateTimeLabel}</p>
        <p className="text-xs text-[var(--choir-body)]">{assignment.roleLabel}</p>
        <p className="text-xs text-[var(--choir-muted)]">{assignment.location}</p>
        {pending ? (
          <p className="mt-1 text-[10px] font-bold text-[#9a5b12]">Change request pending</p>
        ) : null}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        <span
          className={`choir-avail-status-badge ${
            assignment.status === "confirmed" ? "choir-avail-status-available" : "choir-avail-status-pending"
          }`}
        >
          {statusLabel(assignment.status)}
        </span>
        {!past ? <span className="text-[10px] font-bold text-[var(--choir-gold)]">View details</span> : null}
      </div>
    </button>
  );
}

function RehearsalCard({ rehearsal }: { rehearsal: ChoirMyScheduleRehearsalView }) {
  return (
    <div className="choir-my-schedule-assignment">
      <div>
        <p className="font-semibold text-[var(--choir-heading)]">{rehearsal.title}</p>
        <p className="text-xs text-[var(--choir-muted)]">{rehearsal.dateTimeLabel}</p>
        <p className="text-xs text-[var(--choir-body)]">{rehearsal.location}</p>
        <p className="mt-1 text-[10px] text-[var(--choir-muted)]">For {rehearsal.relatedServiceTitle}</p>
      </div>
      <span className="choir-avail-status-badge choir-avail-status-pending">Rehearsal</span>
    </div>
  );
}

function ChangeRequestSheet({
  assignment,
  onClose,
  onSubmit,
}: {
  assignment: ChoirTeamAssignmentView;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit() {
    if (!reason.trim()) return;
    setBusy(true);
    await onSubmit(reason.trim());
    setBusy(false);
  }

  return (
    <div className="choir-setlist-sheet-backdrop" role="presentation" onClick={onClose}>
      <div className="choir-setlist-sheet" role="dialog" onClick={(event) => event.stopPropagation()}>
        <h2 className="font-display text-xl font-bold text-[var(--choir-heading)]">Request schedule change</h2>
        <p className="mt-1 text-sm text-[var(--choir-muted)]">
          {assignment.title} · {assignment.dateTimeLabel}
        </p>
        <p className="mt-2 text-xs text-[var(--choir-muted)]">
          Leadership will review your request. You remain on the roster until it is approved.
        </p>
        <label className="mt-4 block text-sm font-semibold text-[var(--choir-heading)]">
          Reason
          <textarea
            className="choir-input mt-1 min-h-[96px] w-full"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Briefly explain why you cannot serve…"
          />
        </label>
        <div className="mt-4 flex flex-col gap-2">
          <button
            type="button"
            className="choir-btn-primary"
            disabled={busy || !reason.trim()}
            onClick={handleSubmit}
          >
            Submit request
          </button>
          <button type="button" className="choir-btn-secondary" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
