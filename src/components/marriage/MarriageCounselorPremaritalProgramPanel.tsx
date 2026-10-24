"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { MarriageCounselorPremaritalProgramView } from "@/lib/marriage-premarital-program-server";
import { readJsonResponse } from "@/lib/read-json-response";

type Props = {
  journeyId: string;
  program: MarriageCounselorPremaritalProgramView;
  onRefresh: () => Promise<void>;
  onError: (message: string) => void;
};

export function MarriageCounselorPremaritalProgramPanel({
  journeyId,
  program,
  onRefresh,
  onError,
}: Props) {
  const [activeKey, setActiveKey] = useState(
    program.currentSessionKey ?? program.sessions[0]?.sessionKey ?? "",
  );
  const [busy, setBusy] = useState(false);
  const [notesDraft, setNotesDraft] = useState("");

  const active =
    program.sessions.find((s) => s.sessionKey === activeKey) ?? program.sessions[0] ?? null;

  useEffect(() => {
    if (active) setNotesDraft(active.privateNotes ?? "");
  }, [active?.sessionKey, active?.privateNotes]);

  const loadNotesForSession = useCallback((sessionKey: string) => {
    const session = program.sessions.find((s) => s.sessionKey === sessionKey);
    setNotesDraft(session?.privateNotes ?? "");
  }, [program.sessions]);

  async function post(body: Record<string, unknown>) {
    setBusy(true);
    const res = await fetch("/api/marriage/premarital-program", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await readJsonResponse<{ error?: string }>(res);
    setBusy(false);
    if (!res.ok) {
      onError(data.error ?? "Update failed.");
      return false;
    }
    await onRefresh();
    return true;
  }

  if (!active) return null;

  return (
    <section className="marriage-c3m-panel" data-testid="counselor-premarital-program">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="marriage-c3m-section-title">Eight-session counseling program</h2>
          <p className="marriage-c3m-muted mt-1 text-sm">
            {program.sessionsCompleted}/{program.sessionsTotal} sessions completed
            {program.paused ? " · Journey paused" : ""}
          </p>
        </div>
        <Link
          href={`/marriage/counselor/journey/${journeyId}/homework`}
          className="marriage-c3m-inline-link shrink-0 text-sm font-semibold"
        >
          Homework manager →
        </Link>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {program.sessions.map((session) => (
          <button
            key={session.sessionKey}
            type="button"
            onClick={() => {
              setActiveKey(session.sessionKey);
              loadNotesForSession(session.sessionKey);
            }}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
              session.sessionKey === activeKey
                ? "bg-night-900 text-sand-50"
                : "bg-[#F7F4EF] text-night-800 dark:bg-white/10 dark:text-sand-100"
            }`}
          >
            {session.order}. {session.status === "completed" ? "✓ " : ""}
            {session.title.split(" ")[0]}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-[#292219] dark:text-sand-100">{active.title}</h3>
          <p className="marriage-c3m-muted mt-1 text-sm">{active.purpose}</p>
          <p className="mt-1 text-xs text-night-500">
            Recommended {active.recommendedMinutesMin}–{active.recommendedMinutesMax} minutes
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-wide text-night-500">Session status</span>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {(["not_started", "in_progress", "completed"] as const).map((status) => (
              <button
                key={status}
                type="button"
                disabled={busy || active.status === status}
                className="rounded-full border border-night-900/15 px-4 py-2 text-sm font-semibold capitalize disabled:opacity-60"
                onClick={() =>
                  void post({
                    action: "update_session_status",
                    journeyId,
                    sessionKey: active.sessionKey,
                    status,
                  })
                }
              >
                {status.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold">Scriptures</p>
          <ul className="mt-2 space-y-2 text-sm">
            {active.scriptures.map((s) => (
              <li key={s.reference} className="rounded-lg bg-[#F7F4EF] px-3 py-2 dark:bg-white/5">
                <span className="font-semibold">{s.reference}</span> — {s.text}
              </li>
            ))}
          </ul>
        </div>

        {active.teachingSections.map((section) => (
          <div key={section.heading}>
            <p className="text-sm font-semibold">{section.heading}</p>
            {section.paragraphs.map((p, i) => (
              <p key={i} className="marriage-c3m-muted mt-2 text-sm leading-relaxed">
                {p}
              </p>
            ))}
          </div>
        ))}

        <div>
          <p className="text-sm font-semibold">Discussion questions</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {active.discussionQuestions.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold">Individual reflection prompts (in session or homework)</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {active.reflectionPrompts.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>
        </div>

        {active.suggestedHomeworkTemplateKeys.length > 0 && (
          <div className="rounded-xl border border-[#E8E2DA] bg-[#F7F4EF] px-3 py-3 dark:border-white/10 dark:bg-white/5">
            <p className="text-sm font-semibold">Homework after this session</p>
            <p className="marriage-c3m-muted mt-1 text-xs">
              Draft in Homework Manager, review, set due date, then release — nothing is sent automatically.
            </p>
            {active.suggestedHomeworkTemplateKeys.map((templateKey) => (
              <Link
                key={templateKey}
                href={`/marriage/counselor/journey/${journeyId}/homework?template=${encodeURIComponent(templateKey)}`}
                className="marriage-c3m-btn-primary mt-3 inline-flex min-h-[44px] w-full items-center justify-center sm:w-auto"
              >
                Open homework manager
              </Link>
            ))}
            {active.homeworkRows.length > 0 && (
              <ul className="mt-3 space-y-1 text-sm">
                {active.homeworkRows.map((h) => (
                  <li key={h.homeworkId}>
                    {h.title} · <span className="capitalize">{h.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div>
          <p className="text-sm font-semibold">Linked assessments</p>
          <ul className="mt-2 space-y-1 text-sm">
            {active.linkedModulesDetailed.map((m) => (
              <li key={m.moduleId}>
                {m.title}
                {m.recommendedForSession ? "" : " (optional)"} —{" "}
                {m.bothSubmitted ? "both submitted" : "in progress"}
              </li>
            ))}
          </ul>
        </div>

        {active.homeworkRows.length > 0 && (
          <div>
            <p className="text-sm font-semibold">Homework templates for this session</p>
            <ul className="mt-2 text-sm">
              {active.homeworkRows.map((h) => (
                <li key={h.homeworkId}>
                  {h.title} · {h.status}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <p className="text-sm font-semibold">Completion checklist</p>
          <ul className="mt-2 space-y-2">
            {active.completionChecklist.map((item, index) => {
              const done = Boolean(active.checklistCompleted[String(index)]);
              return (
                <li key={item} className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={done}
                    disabled={busy}
                    onChange={(e) =>
                      void post({
                        action: "update_checklist",
                        journeyId,
                        sessionKey: active.sessionKey,
                        checklistIndex: index,
                        completed: e.target.checked,
                      })
                    }
                    className="mt-1"
                  />
                  <span>{item}</span>
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          <label className="block text-sm font-semibold">Private session notes</label>
          <textarea
            className="mt-2 w-full min-h-[100px] rounded-xl border border-night-900/12 bg-white px-3 py-2 text-sm dark:border-white/12 dark:bg-[var(--color-bg-muted)]"
            value={notesDraft}
            onChange={(e) => setNotesDraft(e.target.value)}
            disabled={busy}
          />
          <button
            type="button"
            disabled={busy}
            className="mt-2 w-full rounded-full bg-night-900 px-4 py-3 text-sm font-semibold text-sand-50 sm:max-w-xs"
            onClick={() =>
              void post({
                action: "save_session_notes",
                journeyId,
                sessionKey: active.sessionKey,
                privateNotes: notesDraft,
              })
            }
          >
            Save session notes
          </button>
        </div>

        <button
          type="button"
          disabled={busy}
          className="w-full rounded-full border border-night-900/15 px-4 py-2 text-sm font-semibold"
          onClick={() =>
            void post({ action: "set_paused", journeyId, paused: !program.paused })
          }
        >
          {program.paused ? "Resume journey" : "Mark journey paused"}
        </button>
      </div>
    </section>
  );
}
