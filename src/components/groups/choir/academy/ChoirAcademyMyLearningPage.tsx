"use client";

import { useCallback, useEffect, useState } from "react";
import { ChoirAcademyCourseCard, ChoirAcademyShell } from "@/components/groups/choir/academy/ChoirAcademyShell";
import type { ChoirAcademyCourseCardView } from "@/lib/choir-academy-types";

type ChoirAcademyMyLearningPageProps = {
  groupId: string;
};

type AssignedRow = {
  assignmentId: string;
  assignedAt: string;
  dueDate?: string;
  course: ChoirAcademyCourseCardView;
};

export function ChoirAcademyMyLearningPage({ groupId }: ChoirAcademyMyLearningPageProps) {
  const [inProgress, setInProgress] = useState<ChoirAcademyCourseCardView[]>([]);
  const [completed, setCompleted] = useState<ChoirAcademyCourseCardView[]>([]);
  const [assigned, setAssigned] = useState<AssignedRow[]>([]);
  const [groupChatHref, setGroupChatHref] = useState("");
  const [tab, setTab] = useState<"progress" | "completed" | "assigned">("progress");
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/groups/choir-academy?groupId=${encodeURIComponent(groupId)}&view=my-learning`)
      .then((response) => response.json())
      .then((data) => {
        if (data.payload) {
          setInProgress(data.payload.inProgress ?? []);
          setCompleted(data.payload.completed ?? []);
          setAssigned(data.payload.assigned ?? []);
          setGroupChatHref(data.payload.groupChatHref);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [groupId]);

  useEffect(() => {
    load();
    window.scrollTo(0, 0);
  }, [load]);

  return (
    <ChoirAcademyShell groupId={groupId} groupChatHref={groupChatHref} title="My learning" subtitle="Your courses and assignments.">
      <div className="choir-calendar-filter-row">
        {(
          [
            ["progress", "In progress"],
            ["completed", "Completed"],
            ["assigned", "Assigned to me"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`choir-calendar-filter ${tab === id ? "is-active" : ""}`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? <p className="text-sm text-[var(--choir-muted)]">Loading…</p> : null}

      {!loading && tab === "progress" ? (
        inProgress.length === 0 ? (
          <p className="text-sm text-[var(--choir-muted)]">No courses in progress.</p>
        ) : (
          <ul className="space-y-3">
            {inProgress.map((course) => (
              <li key={course.id}><ChoirAcademyCourseCard course={course} /></li>
            ))}
          </ul>
        )
      ) : null}

      {!loading && tab === "completed" ? (
        completed.length === 0 ? (
          <p className="text-sm text-[var(--choir-muted)]">No completed courses yet.</p>
        ) : (
          <ul className="space-y-3">
            {completed.map((course) => (
              <li key={course.id}><ChoirAcademyCourseCard course={course} actionLabel="Review" /></li>
            ))}
          </ul>
        )
      ) : null}

      {!loading && tab === "assigned" ? (
        assigned.length === 0 ? (
          <p className="text-sm text-[var(--choir-muted)]">No assigned training.</p>
        ) : (
          <ul className="space-y-3">
            {assigned.map((row) => (
              <li key={row.assignmentId}>
                <ChoirAcademyCourseCard course={row.course} />
                <p className="mt-1 text-xs text-[var(--choir-muted)]">
                  Assigned {new Date(row.assignedAt).toLocaleDateString()}
                  {row.dueDate ? ` · Due ${row.dueDate}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )
      ) : null}
    </ChoirAcademyShell>
  );
}
