"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { marriagePremium } from "@/components/marriage/marriage-counseling-premium";
import { readJsonResponse } from "@/lib/read-json-response";

type Stage2LessonBlock = {
  moduleId: string;
  title: string;
  partnerAStatus: string;
  partnerBStatus: string;
  comparisonReady: boolean;
  partnerARequiredComplete: boolean;
  partnerBRequiredComplete: boolean;
  optionalRemainingA: number;
  optionalRemainingB: number;
  lessons: Array<{
    lessonId: string;
    title: string;
    partnerA: { answered: number; total: number; requiredComplete: boolean; optionalRemaining: number };
    partnerB: { answered: number; total: number; requiredComplete: boolean; optionalRemaining: number } | null;
  }>;
};

type Detail = {
  coupleLabel: string;
  journey: { id: string; programType: string; status: string };
  moduleProgress: Array<{ moduleId: string; title: string; bothSubmitted: boolean; awaitingBoth: boolean }>;
  stage2LessonProgress?: Stage2LessonBlock[];
  comparisonSummaries: Array<{
    moduleId: string;
    moduleTitle: string;
    needsAttention: number;
    aligned: number;
    items: Array<{ prompt: string; category: string }>;
  }>;
  attentionAreas: Array<{ prompt: string; category: string; discussionPrompt?: string }>;
  authorizedAnswers: Array<{ moduleTitle: string; userName: string; prompt: string }>;
  sessions: Array<{ id: string; scheduledAt: string; topic?: string; zoomUrl?: string; status?: string }>;
  assignments: Array<{ id: string; title: string; dueAt?: string; completedByUserIds: string[] }>;
  notes: Array<{ body: string; updatedAt: string; createdAt?: string }>;
  revisions: Array<{ id: string; status: string; moduleId: string }>;
};

export function MarriageCounselorJourneyDetail({ journeyId }: { journeyId: string }) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    void (async () => {
      const res = await fetch(`/api/marriage/counselor/journey/${journeyId}`, { cache: "no-store" });
      const data = await readJsonResponse<Detail & { error?: string }>(res);
      if (!res.ok) setError(data.error ?? "Unable to load.");
      else setDetail(data);
    })();
  }, [journeyId]);

  if (error) {
    return (
      <div className={marriagePremium.card}>
        <p className="text-sm text-red-800">{error}</p>
        <Link href="/marriage/counselor" className={`${marriagePremium.secondaryCta} mt-4`}>
          Back
        </Link>
      </div>
    );
  }

  if (!detail) return <p className={marriagePremium.cardMuted}>Loading couple…</p>;

  return (
    <div className="pb-24">
      <Link href="/marriage/counselor" className="text-sm font-semibold text-clay-700">
        ← Counselor list
      </Link>
      <h1 className="mt-2 font-display text-xl font-semibold">{detail.coupleLabel}</h1>
      <p className={`${marriagePremium.cardMuted} capitalize`}>{detail.journey.programType} · {detail.journey.status}</p>

      {detail.attentionAreas.length > 0 && (
        <div className={`${marriagePremium.card} mt-6 border-l-4 border-amber-500`}>
          <p className="font-semibold">Needs conversation</p>
          <ul className="mt-2 space-y-3">
            {detail.attentionAreas.map((area, i) => (
              <li key={i} className="text-sm">
                <span className={marriagePremium.badgeDifferent}>{area.category.replace(/_/g, " ")}</span>
                <p className="mt-1 font-medium">{area.prompt}</p>
                {area.discussionPrompt && (
                  <p className={`${marriagePremium.cardMuted} mt-1`}>{area.discussionPrompt}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className={`${marriagePremium.card} mt-4`} data-testid="counselor-module-progress">
        <p className="font-semibold">Module progress</p>
        <ul className="mt-2 space-y-1 text-sm">
          {detail.moduleProgress.map((m) => (
            <li key={m.moduleId} className="flex justify-between gap-2">
              <span>{m.title}</span>
              <span className="text-xs text-night-500">
                {m.bothSubmitted ? "Both submitted" : m.awaitingBoth ? "Awaiting both" : "In progress"}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {(detail.stage2LessonProgress?.length ?? 0) > 0 && (
        <div className={`${marriagePremium.card} mt-4`} data-testid="counselor-lesson-progress">
          <p className="font-semibold">Lesson progress (Stage 2)</p>
          <p className={`${marriagePremium.cardMuted} text-xs`}>Completion counts only — private answer text is never shown here.</p>
          <ul className="mt-3 space-y-4 text-sm">
            {detail.stage2LessonProgress!.map((block) => (
              <li key={block.moduleId}>
                <p className="font-medium">{block.title}</p>
                <p className="text-xs text-night-500">
                  Partner A: {block.partnerAStatus.replace("_", " ")}
                  {block.partnerARequiredComplete ? " · required complete" : " · required incomplete"} ·{" "}
                  {block.optionalRemainingA} optional left · Partner B: {block.partnerBStatus.replace("_", " ")}
                  {block.partnerBRequiredComplete ? " · required complete" : ""} · Compare{" "}
                  {block.comparisonReady ? "ready" : "not ready"}
                </p>
                <ul className="mt-2 space-y-1 border-l-2 border-stone-200 pl-3 dark:border-stone-700">
                  {block.lessons.map((lesson) => (
                    <li key={lesson.lessonId}>
                      <span className="font-medium">{lesson.title}</span>
                      <span className="text-xs text-night-500">
                        {" "}
                        — A {lesson.partnerA.answered}/{lesson.partnerA.total}
                        {lesson.partnerB ? ` · B ${lesson.partnerB.answered}/${lesson.partnerB.total}` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      )}

      {detail.assignments.length > 0 && (
        <div className={`${marriagePremium.card} mt-4`}>
          <p className="font-semibold">Follow-up assignments</p>
          <ul className="mt-2 space-y-2 text-sm">
            {detail.assignments.map((a) => (
              <li key={a.id}>
                {a.title}
                {a.dueAt && <span className="text-xs text-night-500"> · due {new Date(a.dueAt).toLocaleDateString()}</span>}
                <span className="text-xs text-night-500"> · completed by {a.completedByUserIds.length} partner(s)</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {detail.comparisonSummaries.map((summary) => (
        <div key={summary.moduleId} className={`${marriagePremium.card} mt-4`}>
          <p className="font-semibold">{summary.moduleTitle}</p>
          <p className="text-xs text-night-500">
            {summary.aligned} aligned · {summary.needsAttention} need attention
          </p>
          <ul className="mt-2 space-y-2 text-sm">
            {summary.items
              .filter((i) => i.category !== "aligned")
              .slice(0, 6)
              .map((item, idx) => (
                <li key={idx}>
                  <span className={marriagePremium.badgeTalk}>{item.category}</span> {item.prompt}
                </li>
              ))}
          </ul>
        </div>
      ))}

      <div className={`${marriagePremium.card} mt-4`}>
        <p className="font-semibold">Sessions</p>
        {detail.sessions.length === 0 && <p className={`${marriagePremium.cardMuted} text-sm`}>None scheduled.</p>}
        <ul className="mt-2 space-y-2 text-sm">
          {detail.sessions.map((s) => (
            <li key={s.id}>
              <p className="font-medium">{s.topic ?? "Counseling session"}</p>
              <p>{new Date(s.scheduledAt).toLocaleString()}</p>
              {s.zoomUrl && (
                <a href={s.zoomUrl} className="text-clay-700 underline" target="_blank" rel="noreferrer">
                  Zoom link
                </a>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className={`${marriagePremium.card} mt-4`}>
        <p className="font-semibold">Assign activity</p>
        <form
          className="mt-2 space-y-2 text-sm"
          onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            await fetch("/api/marriage/counselor/assignments", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                journeyId,
                title: String(fd.get("title") ?? ""),
                moduleId: String(fd.get("moduleId") ?? "") || undefined,
                dueAt: String(fd.get("dueAt") ?? "") || undefined,
              }),
            });
            window.location.reload();
          }}
        >
          <input name="title" required placeholder="Activity title" className="min-h-[44px] w-full rounded-xl border px-3" />
          <input name="moduleId" placeholder="Module id (optional)" className="min-h-[44px] w-full rounded-xl border px-3 font-mono text-xs" />
          <input name="dueAt" type="datetime-local" className="min-h-[44px] w-full rounded-xl border px-3" />
          <button type="submit" className={`${marriagePremium.secondaryCta} min-h-[44px]`}>
            Assign to couple
          </button>
        </form>
      </div>

      <div className={`${marriagePremium.card} mt-4`}>
        <p className="font-semibold">Homework</p>
        <ul className="mt-2 space-y-1 text-sm">
          {detail.assignments.map((a) => (
            <li key={a.id}>
              {a.title}
              {a.dueAt && ` · due ${new Date(a.dueAt).toLocaleDateString()}`}
              {a.completedByUserIds.length >= 2 ? " · complete" : " · open"}
            </li>
          ))}
        </ul>
      </div>

      {detail.authorizedAnswers.length > 0 && (
        <div className={`${marriagePremium.card} mt-4`}>
          <p className="font-semibold">Counselor-authorized responses</p>
          <ul className="mt-2 space-y-2 text-sm">
            {detail.authorizedAnswers.map((a, i) => (
              <li key={i}>
                <p className="text-xs font-bold text-night-500">{a.userName} · {a.moduleTitle}</p>
                <p>{a.prompt}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className={`${marriagePremium.card} mt-4`}>
        <p className="font-semibold">Private counselor notes</p>
        {detail.notes.length > 0 && (
          <ul className="mt-2 space-y-2 text-sm">
            {detail.notes.map((n, i) => (
              <li key={i} className="rounded-lg bg-stone-50 p-2">
                <p>{n.body}</p>
                <p className="text-xs text-night-500">{new Date(n.updatedAt).toLocaleString()}</p>
              </li>
            ))}
          </ul>
        )}
        <textarea
          className="mt-3 w-full rounded-xl border px-3 py-2 text-sm"
          rows={3}
          placeholder="Session prep or follow-up (not visible to the couple)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <button
          type="button"
          className={`${marriagePremium.primaryCta} mt-2 min-h-[44px]`}
          disabled={!note.trim()}
          onClick={async () => {
            const res = await fetch(`/api/marriage/counselor/journey/${journeyId}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "save_note", body: note }),
            });
            const data = await readJsonResponse<{ error?: string }>(res);
            if (!res.ok) setError(data.error ?? "Could not save note.");
            else {
              setNote("");
              const refresh = await fetch(`/api/marriage/counselor/journey/${journeyId}`, { cache: "no-store" });
              const refreshed = await readJsonResponse<Detail>(refresh);
              if (refresh.ok) setDetail(refreshed);
            }
          }}
        >
          Save note
        </button>
      </div>

      {detail.revisions.filter((r) => r.status === "pending").length > 0 && (
        <div className={`${marriagePremium.card} mt-4`}>
          <p className="font-semibold">Pending revision requests</p>
          <ul className="mt-2 space-y-2">
            {detail.revisions
              .filter((r) => r.status === "pending")
              .map((r) => (
                <li key={r.id} className="flex flex-wrap gap-2 text-sm">
                  <span>Module {r.moduleId}</span>
                  <button
                    type="button"
                    className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white"
                    onClick={async () => {
                      await fetch("/api/marriage/counselor/revision", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ action: "resolve", requestId: r.id, decision: "approved" }),
                      });
                      window.location.reload();
                    }}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    className="rounded-full bg-stone-600 px-3 py-1 text-xs font-bold text-white"
                    onClick={async () => {
                      await fetch("/api/marriage/counselor/revision", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ action: "resolve", requestId: r.id, decision: "denied" }),
                      });
                      window.location.reload();
                    }}
                  >
                    Deny
                  </button>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}
