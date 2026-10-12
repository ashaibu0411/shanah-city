"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { choirMyScheduleHref } from "@/lib/choir-availability-links";
import type { ChoirAvailabilityAssignmentPreview } from "@/lib/choir-availability-types";

type ChoirAvailabilityAssignmentsPreviewProps = {
  groupId: string;
  fallback?: ChoirAvailabilityAssignmentPreview[];
};

export function ChoirAvailabilityAssignmentsPreview({
  groupId,
  fallback = [],
}: ChoirAvailabilityAssignmentsPreviewProps) {
  const [assignments, setAssignments] = useState<ChoirAvailabilityAssignmentPreview[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/groups/choir-availability?groupId=${encodeURIComponent(groupId)}&view=my_schedule`, {
      credentials: "include",
    })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok || !body.mySchedule) {
          setError(body.error ?? "Could not load assignments.");
          setAssignments(null);
        } else {
          setAssignments(body.mySchedule.assignments.slice(0, 3));
          setError(null);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Could not load assignments.");
        setLoading(false);
      });
  }, [groupId]);

  useEffect(() => {
    load();
  }, [load]);

  const displayRows =
    assignments ?? (error && fallback.length > 0 ? fallback.slice(0, 3) : []);

  return (
    <section aria-labelledby="choir-avail-assignments-preview">
      <div className="choir-song-section-head">
        <h2 id="choir-avail-assignments-preview" className="choir-song-section-title">
          My assignments
        </h2>
        <Link href={choirMyScheduleHref(groupId)} className="choir-song-see-all">
          View My Schedule
        </Link>
      </div>
      {loading ? (
        <p className="text-sm text-[var(--choir-muted)]">Loading assignments…</p>
      ) : error ? (
        <div className="choir-card p-3">
          <p className="text-sm text-red-700">{error}</p>
          {fallback.length > 0 ? (
            <p className="mt-1 text-xs text-[var(--choir-muted)]">Showing last known preview from availability home.</p>
          ) : null}
          <button type="button" className="choir-setlist-manage-link mt-2" onClick={load}>
            Retry
          </button>
        </div>
      ) : null}
      {!loading && !error && displayRows.length === 0 ? (
        <p className="text-sm text-[var(--choir-muted)]">You have no upcoming worship assignments.</p>
      ) : null}
      {displayRows.length > 0 ? (
        <div className="space-y-2">
          {displayRows.map((assignment) => (
            <Link
              key={assignment.id}
              href={choirMyScheduleHref(groupId)}
              className="choir-avail-assignment-card"
            >
              <div>
                <p className="font-semibold text-[var(--choir-heading)]">{assignment.title}</p>
                <p className="text-xs text-[var(--choir-muted)]">{assignment.dateTimeLabel}</p>
                <p className="text-xs text-[var(--choir-body)]">{assignment.roleLabel}</p>
              </div>
              <span
                className={`choir-avail-status-badge ${
                  assignment.status === "confirmed" ? "choir-avail-status-available" : "choir-avail-status-pending"
                }`}
              >
                {assignment.status === "confirmed" ? "Confirmed" : "Awaiting confirmation"}
              </span>
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  );
}
