"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MarriageCounselorSessionDateTimeField } from "@/components/marriage/MarriageCounselorSessionDateTimeField";
import { MarriageCounselorSessionTopicField } from "@/components/marriage/MarriageCounselorSessionTopicField";
import { marriagePremium } from "@/components/marriage/marriage-counseling-premium";
import { MarriageCounselorStage2ReviewPanel } from "@/components/marriage/MarriageCounselorStage2ReviewPanel";
import {
  formatMarriageSessionScheduledAt,
  marriageSessionInstantMs,
} from "@/lib/marriage-session-scheduling";
import { readJsonResponse } from "@/lib/read-json-response";
import { MarriageCounselorPremaritalProgramPanel } from "@/components/marriage/MarriageCounselorPremaritalProgramPanel";
import { MarriageCounselorPremaritalOperationsPanel } from "@/components/marriage/MarriageCounselorPremaritalOperationsPanel";
import { MarriageCounselorPastoralTimelinePanel } from "@/components/marriage/MarriageCounselorPastoralTimelinePanel";
import { MarriageCounselorJourneyNav } from "@/components/marriage/MarriageCounselorJourneyNav";
import type { MarriageCounselorPremaritalProgramView } from "@/lib/marriage-premarital-program-server";

export type MarriageCounselorClinicalDetailView = {
  access: "clinical";
  journeyId: string;
  coupleNames: string;
  journeyStatus: string;
  programType: string;
  moduleProgress: Array<{
    moduleId: string;
    title: string;
    bothSubmitted: boolean;
    awaitingBoth: boolean;
    submittedCount: number;
  }>;
  stage2LessonProgress?: Array<{
    moduleId: string;
    title: string;
    partnerAStatus: string;
    partnerBStatus: string;
    comparisonReady: boolean;
    lessons: Array<{
      lessonId: string;
      title: string;
      partnerA: { answered: number; total: number };
      partnerB: { answered: number; total: number } | null;
    }>;
  }>;
  comparisonSummaries: Array<{
    moduleId: string;
    moduleTitle: string;
    needsAttention: number;
    aligned: number;
    items: Array<{ prompt: string; category: string }>;
  }>;
  attentionAreas: Array<{ prompt: string; category: string; discussionPrompt?: string }>;
  authorizedAnswers: Array<{ moduleTitle: string; userName: string; prompt: string; withheld: boolean; answer?: string }>;
  sessions: Array<{
    id: string;
    scheduledAt: string;
    schedulingTimeZone?: string;
    topic?: string;
    zoomUrl?: string;
    status?: string;
  }>;
  assignments: Array<{
    id: string;
    title: string;
    dueAt?: string;
    dueAtTimeZone?: string;
    completedByUserIds: string[];
  }>;
  notes: Array<{ body: string; updatedAt: string }>;
  revisions: Array<{ id: string; status: string; moduleId: string }>;
  comparisonDisclosurePhase?: string;
  premaritalProgram?: MarriageCounselorPremaritalProgramView | null;
};

function formatProgramSubtitle(programType: string) {
  const normalized = programType.replace(/_/g, " ");
  return `${normalized.charAt(0).toUpperCase()}${normalized.slice(1)} journey`;
}

function moduleStatusLabel(module: MarriageCounselorClinicalDetailView["moduleProgress"][number]) {
  if (module.bothSubmitted) return "Both submitted";
  if (module.submittedCount <= 0) return "Not started";
  if (module.submittedCount === 1) return "Awaiting partner";
  return "In progress";
}

function statusTone(label: string) {
  if (label === "Both submitted") return "marriage-c3m-status marriage-c3m-status-done";
  if (label === "Awaiting partner") return "marriage-c3m-status marriage-c3m-status-wait";
  if (label === "Not started") return "marriage-c3m-status marriage-c3m-status-idle";
  return "marriage-c3m-status marriage-c3m-status-active";
}

function formatJourneyStatus(status: string) {
  return status.replace(/_/g, " ");
}

type MarriageCounselorClinicalDashboardProps = {
  detail: MarriageCounselorClinicalDetailView;
  journeyId: string;
  onRefresh: () => Promise<void>;
  onError: (message: string) => void;
};

export function MarriageCounselorClinicalDashboard({
  detail,
  journeyId,
  onRefresh,
  onError,
}: MarriageCounselorClinicalDashboardProps) {
  const [note, setNote] = useState("");
  const [noteBusy, setNoteBusy] = useState(false);
  const [noteFeedback, setNoteFeedback] = useState<"saved" | "">("");
  const [sessionBusy, setSessionBusy] = useState(false);
  const [sessionFormKey, setSessionFormKey] = useState(0);
  const [assignBusy, setAssignBusy] = useState(false);
  const [showReadinessNav, setShowReadinessNav] = useState(false);

  useEffect(() => {
    if (detail.programType !== "premarital") {
      setShowReadinessNav(false);
      return;
    }
    void (async () => {
      const res = await fetch(
        `/api/marriage/counselor/premarital-operations?journeyId=${encodeURIComponent(journeyId)}`,
        { cache: "no-store" },
      );
      if (!res.ok) {
        setShowReadinessNav(false);
        return;
      }
      const data = await readJsonResponse<{ operations?: { canEditReadiness?: boolean } }>(res);
      setShowReadinessNav(Boolean(data.operations?.canEditReadiness));
    })();
  }, [detail.programType, journeyId]);

  const completedModules = detail.moduleProgress.filter((m) => m.bothSubmitted).length;
  const totalModules = detail.moduleProgress.length;

  const upcomingSessions = useMemo(() => {
    const now = Date.now();
    return [...detail.sessions]
      .filter((s) => marriageSessionInstantMs(s.scheduledAt, s.schedulingTimeZone) >= now - 60_000)
      .sort(
        (a, b) =>
          marriageSessionInstantMs(a.scheduledAt, a.schedulingTimeZone) -
          marriageSessionInstantMs(b.scheduledAt, b.schedulingTimeZone),
      );
  }, [detail.sessions]);

  const nextSession = upcomingSessions[0] ?? null;

  const comparisonByModule = useMemo(() => {
    const map = new Map<string, (typeof detail.comparisonSummaries)[number]>();
    for (const summary of detail.comparisonSummaries) {
      map.set(summary.moduleId, summary);
    }
    return map;
  }, [detail.comparisonSummaries]);

  async function saveNote() {
    if (!note.trim()) return;
    setNoteBusy(true);
    setNoteFeedback("");
    const res = await fetch(`/api/marriage/counselor/journey/${journeyId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "save_note", body: note }),
    });
    const data = await readJsonResponse<{ error?: string }>(res);
    setNoteBusy(false);
    if (!res.ok) {
      onError(data.error ?? "Could not save note.");
      return;
    }
    setNote("");
    setNoteFeedback("saved");
    await onRefresh();
  }

  async function createSession(form: HTMLFormElement) {
    const fd = new FormData(form);
    setSessionBusy(true);
    const res = await fetch("/api/marriage/counselor/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create",
        journeyId,
        scheduledAtLocal: String(fd.get("scheduledAtLocal") ?? ""),
        schedulingTimeZone: String(fd.get("schedulingTimeZone") ?? ""),
        topic: String(fd.get("topic") ?? "") || undefined,
        zoomUrl: String(fd.get("zoomUrl") ?? "") || undefined,
      }),
    });
    const data = await readJsonResponse<{ error?: string }>(res);
    setSessionBusy(false);
    if (!res.ok) {
      onError(data.error ?? "Could not schedule session.");
      return;
    }
    form.reset();
    setSessionFormKey((k) => k + 1);
    await onRefresh();
  }

  async function assignActivity(form: HTMLFormElement) {
    const fd = new FormData(form);
    setAssignBusy(true);
    const res = await fetch("/api/marriage/counselor/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        journeyId,
        title: String(fd.get("title") ?? ""),
        moduleId: String(fd.get("moduleId") ?? "") || undefined,
        dueAtLocal: String(fd.get("dueAtLocal") ?? "") || undefined,
        schedulingTimeZone: String(fd.get("schedulingTimeZone") ?? "") || undefined,
      }),
    });
    setAssignBusy(false);
    if (!res.ok) {
      const data = await readJsonResponse<{ error?: string }>(res);
      onError(data.error ?? "Could not assign activity.");
      return;
    }
    form.reset();
    await onRefresh();
  }

  return (
    <div className="marriage-c3m-dashboard-shell">
      <MarriageCounselorJourneyNav
        journeyId={journeyId}
        programType={detail.programType}
        showReadiness={showReadinessNav}
      />
      <header className="marriage-c3m-header" id="journey-overview">
        <Link href="/marriage/counselor" className="marriage-c3m-back-link">
          ← Counselor workspace
        </Link>
        <div className="marriage-c3m-header-main">
          <div className="min-w-0 flex-1">
            <h1 className="marriage-c3m-title">{detail.coupleNames}</h1>
            <p className="marriage-c3m-subtitle">{formatProgramSubtitle(detail.programType)}</p>
          </div>
        </div>
        <div className="marriage-c3m-header-meta">
          <span className="marriage-c3m-meta-chip">
            Counselor · <span className="capitalize">Assigned to you</span>
          </span>
          <span className="marriage-c3m-meta-chip capitalize">{formatJourneyStatus(detail.journeyStatus)}</span>
          <span className="marriage-c3m-meta-chip">
            Assessments · {completedModules}/{totalModules || "—"}
          </span>
          <span className="marriage-c3m-meta-chip">
            Next session ·{" "}
            {nextSession
              ? formatMarriageSessionScheduledAt(nextSession.scheduledAt, nextSession.schedulingTimeZone)
              : "None scheduled"}
          </span>
        </div>
      </header>

      <div className="marriage-c3m-summary-grid">
        <div className="marriage-c3m-summary-card">
          <p className="marriage-c3m-summary-label">Assessment progress</p>
          <p className="marriage-c3m-summary-value">
            {totalModules > 0 ? `${completedModules} / ${totalModules}` : "—"}
          </p>
          <p className="marriage-c3m-summary-hint">Modules with both partners submitted</p>
        </div>
        <div className="marriage-c3m-summary-card">
          <p className="marriage-c3m-summary-label">Upcoming sessions</p>
          <p className="marriage-c3m-summary-value">{upcomingSessions.length}</p>
          <p className="marriage-c3m-summary-hint">
            {nextSession?.topic ? nextSession.topic : "Schedule when ready"}
          </p>
        </div>
        <div className="marriage-c3m-summary-card">
          <p className="marriage-c3m-summary-label">Assigned activities</p>
          <p className="marriage-c3m-summary-value">{detail.assignments.length}</p>
          <p className="marriage-c3m-summary-hint">Follow-ups for this couple</p>
        </div>
        <div className="marriage-c3m-summary-card">
          <p className="marriage-c3m-summary-label">Counseling status</p>
          <p className="marriage-c3m-summary-value capitalize">{formatJourneyStatus(detail.journeyStatus)}</p>
          <p className="marriage-c3m-summary-hint">{detail.programType.replace(/_/g, " ")}</p>
        </div>
      </div>

      {detail.attentionAreas.length > 0 && (
        <div className="marriage-c3m-attention-banner">
          <p className="marriage-c3m-section-title">Needs conversation</p>
          <ul className="mt-3 space-y-3">
            {detail.attentionAreas.map((area, i) => (
              <li key={i} className="text-sm">
                <span className={marriagePremium.badgeDifferent}>{area.category.replace(/_/g, " ")}</span>
                <p className="mt-1 font-medium text-[#292219] dark:text-sand-100">{area.prompt}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {detail.premaritalProgram && (
        <div id="premarital-program">
          <MarriageCounselorPremaritalProgramPanel
            journeyId={journeyId}
            program={detail.premaritalProgram}
            onRefresh={onRefresh}
            onError={onError}
          />
        </div>
      )}

      {detail.programType === "premarital" && (
        <>
          <MarriageCounselorPremaritalOperationsPanel journeyId={journeyId} onError={onError} />
          <MarriageCounselorPastoralTimelinePanel journeyId={journeyId} />
        </>
      )}

      <div className="marriage-c3m-columns">
        <div className="marriage-c3m-column-main">
          <section className="marriage-c3m-panel" data-testid="counselor-module-progress">
            <h2 className="marriage-c3m-section-title">Assessment progress</h2>
            <ul className="mt-4 space-y-3">
              {detail.moduleProgress.map((module) => {
                const label = moduleStatusLabel(module);
                const comparison = comparisonByModule.get(module.moduleId);
                return (
                  <li key={module.moduleId} className="marriage-c3m-module-row">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-[#292219] dark:text-sand-100">{module.title}</p>
                      <p className="marriage-c3m-muted mt-0.5 text-xs">
                        {comparison
                          ? `${comparison.aligned} aligned · ${comparison.needsAttention} to discuss`
                          : detail.comparisonDisclosurePhase === "withheld_until_explicit_consent"
                            ? "Comparison withheld until consent"
                            : "Comparison not ready"}
                      </p>
                    </div>
                    <span className={statusTone(label)}>{label}</span>
                  </li>
                );
              })}
            </ul>
          </section>

          {(detail.stage2LessonProgress?.length ?? 0) > 0 && (
            <section className="marriage-c3m-panel" data-testid="counselor-lesson-progress">
              <h2 className="marriage-c3m-section-title">Learning modules (Stage 2)</h2>
              <p className="marriage-c3m-muted mt-1 text-xs">
                Completion counts only — answer text is never shown here.
              </p>
              <ul className="mt-4 space-y-4">
                {detail.stage2LessonProgress!.map((block) => (
                  <li key={block.moduleId} className="rounded-xl border border-[#E8E2DA] p-3 dark:border-white/10">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="font-semibold">{block.title}</p>
                      <span className={statusTone(block.comparisonReady ? "Both submitted" : "In progress")}>
                        {block.comparisonReady ? "Comparison ready" : "In progress"}
                      </span>
                    </div>
                    <p className="marriage-c3m-muted mt-1 text-xs capitalize">
                      Partner A · {block.partnerAStatus.replace(/_/g, " ")} · Partner B ·{" "}
                      {block.partnerBStatus.replace(/_/g, " ")}
                    </p>
                    <ul className="mt-3 space-y-1 border-l-2 border-[#E8E2DA] pl-3 text-sm dark:border-white/10">
                      {block.lessons.map((lesson) => (
                        <li key={lesson.lessonId}>
                          <span className="font-medium">{lesson.title}</span>
                          <span className="marriage-c3m-muted text-xs">
                            {" "}
                            — A {lesson.partnerA.answered}/{lesson.partnerA.total}
                            {lesson.partnerB ? ` · B ${lesson.partnerB.answered}/${lesson.partnerB.total}` : ""}
                          </span>
                        </li>
                      ))}
                    </ul>
                    {block.comparisonReady ? (
                      <MarriageCounselorStage2ReviewPanel
                        journeyId={journeyId}
                        moduleId={block.moduleId}
                        moduleTitle={block.title}
                      />
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {detail.comparisonSummaries.length === 0 &&
            detail.comparisonDisclosurePhase === "withheld_until_explicit_consent" && (
              <p className="marriage-c3m-muted text-sm">
                Spouse comparison summaries are withheld until explicit counselor comparison consent exists.
              </p>
            )}

          {detail.comparisonSummaries.map((summary) => (
            <section key={summary.moduleId} className="marriage-c3m-panel">
              <h2 className="marriage-c3m-section-title">{summary.moduleTitle}</h2>
              <p className="marriage-c3m-muted mt-1 text-xs">
                {summary.aligned} aligned · {summary.needsAttention} need attention
              </p>
              <ul className="mt-3 space-y-2 text-sm">
                {summary.items
                  .filter((i) => i.category !== "aligned")
                  .slice(0, 8)
                  .map((item, idx) => (
                    <li key={idx} className="rounded-lg bg-[#F7F4EF] px-3 py-2 dark:bg-white/5">
                      <span className={marriagePremium.badgeTalk}>{item.category.replace(/_/g, " ")}</span>{" "}
                      {item.prompt}
                    </li>
                  ))}
              </ul>
            </section>
          ))}

          <section className="marriage-c3m-panel">
            <h2 className="marriage-c3m-section-title">Consented counselor responses</h2>
            <ul className="mt-4 space-y-3">
              {detail.authorizedAnswers.map((answer, i) => (
                <li key={i} className="marriage-c3m-response-card">
                  <p className="text-xs font-bold uppercase tracking-wide text-[#817466]">
                    {answer.userName} · {answer.moduleTitle}
                  </p>
                  <p className="mt-1 text-sm font-medium">{answer.prompt}</p>
                  {answer.withheld ? (
                    <p className="mt-2 text-xs font-semibold text-amber-900 dark:text-amber-200">
                      Withheld — valid spouse consent required.
                    </p>
                  ) : (
                    <p className="mt-2 rounded-xl border border-[#E8E2DA] bg-[#F7F4EF] px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5">
                      {answer.answer}
                    </p>
                  )}
                </li>
              ))}
              {detail.authorizedAnswers.length === 0 && (
                <p className="marriage-c3m-muted text-sm">No consented responses yet.</p>
              )}
            </ul>
          </section>

          <section className="marriage-c3m-panel">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="marriage-c3m-section-title">Session homework</h2>
              <Link
                href={`/marriage/counselor/journey/${journeyId}/homework`}
                className="marriage-c3m-btn-secondary min-h-[44px] text-sm"
              >
                Homework manager
              </Link>
            </div>
            <p className="marriage-c3m-muted mt-1 text-xs">
              Structured weekly homework with draft/release workflow. Quick legacy assignments remain below.
            </p>
          </section>

          <section className="marriage-c3m-panel">
            <h2 className="marriage-c3m-section-title">Assigned activities</h2>
            {detail.assignments.length > 0 ? (
              <ul className="mt-3 space-y-2 text-sm">
                {detail.assignments.map((assignment) => (
                  <li key={assignment.id} className="marriage-c3m-module-row">
                    <div>
                      <p className="font-medium">{assignment.title}</p>
                      {assignment.dueAt ? (
                        <p className="marriage-c3m-muted text-xs">
                          Due{" "}
                          {formatMarriageSessionScheduledAt(assignment.dueAt, assignment.dueAtTimeZone)}
                        </p>
                      ) : null}
                    </div>
                    <span className="marriage-c3m-muted text-xs">
                      {assignment.completedByUserIds.length > 0
                        ? `${assignment.completedByUserIds.length} completed`
                        : "Open"}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="marriage-c3m-muted mt-2 text-sm">No activities assigned yet.</p>
            )}
            <form
              className="marriage-c3m-form mt-4"
              onSubmit={async (e) => {
                e.preventDefault();
                await assignActivity(e.currentTarget);
              }}
            >
              <p className="text-sm font-semibold">Assign activity</p>
              <input name="title" required placeholder="Activity title" className="marriage-c3m-input" />
              <input name="moduleId" placeholder="Related module id (optional)" className="marriage-c3m-input font-mono text-xs" />
              <MarriageCounselorSessionDateTimeField
                name="dueAtLocal"
                label="Due date & time"
                inputClassName="marriage-c3m-input"
              />
              <button type="submit" disabled={assignBusy} className="marriage-c3m-btn-secondary min-h-[44px]">
                {assignBusy ? "Assigning…" : "Assign to couple"}
              </button>
            </form>
          </section>
        </div>

        <aside className="marriage-c3m-column-side">
          <section className="marriage-c3m-panel" id="journey-sessions">
            <h2 className="marriage-c3m-section-title">Sessions</h2>
            {detail.sessions.length === 0 && (
              <p className="marriage-c3m-muted mt-2 text-sm">None scheduled.</p>
            )}
            <ul className="mt-3 space-y-3 text-sm">
              {detail.sessions.map((session) => (
                <li key={session.id} className="rounded-xl border border-[#E8E2DA] p-3 dark:border-white/10">
                  <p className="font-semibold">{session.topic ?? "Counseling session"}</p>
                  <p className="marriage-c3m-muted mt-0.5">
                    {formatMarriageSessionScheduledAt(session.scheduledAt, session.schedulingTimeZone)}
                  </p>
                  {session.status ? (
                    <p className="marriage-c3m-muted mt-0.5 text-xs capitalize">{session.status.replace(/_/g, " ")}</p>
                  ) : null}
                  {session.zoomUrl ? (
                    <a href={session.zoomUrl} className="mt-2 inline-block text-sm font-semibold text-[#B85C38]" target="_blank" rel="noreferrer">
                      Open Zoom link
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
            <form
              key={sessionFormKey}
              className="marriage-c3m-form mt-4"
              onSubmit={async (e) => {
                e.preventDefault();
                await createSession(e.currentTarget);
              }}
            >
              <p className="text-sm font-semibold">Schedule session</p>
              <MarriageCounselorSessionDateTimeField required inputClassName="marriage-c3m-input" />
              <MarriageCounselorSessionTopicField name="topic" inputClassName="marriage-c3m-input" />
              <input name="zoomUrl" placeholder="Zoom link (optional)" className="marriage-c3m-input" />
              <button type="submit" disabled={sessionBusy} className="marriage-c3m-btn-primary min-h-[44px]">
                {sessionBusy ? "Scheduling…" : "Schedule session"}
              </button>
            </form>
          </section>

          <section className="marriage-c3m-panel" id="journey-private-notes">
            <h2 className="marriage-c3m-section-title">Private counselor notes</h2>
            <p className="marriage-c3m-muted mt-1 text-xs">Not visible to the couple.</p>
            {detail.notes.length > 0 && (
              <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto text-sm">
                {detail.notes.map((n, i) => (
                  <li key={i} className="rounded-xl border border-[#E8E2DA] bg-[#F7F4EF] p-3 dark:border-white/10 dark:bg-white/5">
                    <p className="whitespace-pre-wrap">{n.body}</p>
                    <p className="marriage-c3m-muted mt-1 text-xs">{new Date(n.updatedAt).toLocaleString()}</p>
                  </li>
                ))}
              </ul>
            )}
            <textarea
              className="marriage-c3m-textarea mt-3"
              rows={5}
              placeholder="Session prep, observations, or follow-up (private)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <button
              type="button"
              className="marriage-c3m-btn-primary mt-3 min-h-[44px] w-full"
              disabled={!note.trim() || noteBusy}
              onClick={() => void saveNote()}
            >
              {noteBusy ? "Saving…" : "Save note"}
            </button>
            {noteFeedback === "saved" ? (
              <p className="mt-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300">Note saved.</p>
            ) : null}
          </section>

          {detail.revisions.filter((r) => r.status === "pending").length > 0 && (
            <section className="marriage-c3m-panel">
              <h2 className="marriage-c3m-section-title">Pending revisions</h2>
              <ul className="mt-3 space-y-2">
                {detail.revisions
                  .filter((r) => r.status === "pending")
                  .map((revision) => (
                    <li key={revision.id} className="flex flex-wrap gap-2 text-sm">
                      <span className="font-medium">Module {revision.moduleId}</span>
                      <button
                        type="button"
                        className="marriage-c3m-btn-inline marriage-c3m-btn-inline-approve"
                        onClick={async () => {
                          await fetch("/api/marriage/counselor/revision", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ action: "resolve", requestId: revision.id, decision: "approved" }),
                          });
                          await onRefresh();
                        }}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className="marriage-c3m-btn-inline marriage-c3m-btn-inline-deny"
                        onClick={async () => {
                          await fetch("/api/marriage/counselor/revision", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ action: "resolve", requestId: revision.id, decision: "denied" }),
                          });
                          await onRefresh();
                        }}
                      >
                        Deny
                      </button>
                    </li>
                  ))}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
