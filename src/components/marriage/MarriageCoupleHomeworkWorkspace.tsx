"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { marriagePremium } from "@/components/marriage/marriage-counseling-premium";
import { homeworkAnswerKey } from "@/lib/marriage-homework-types";
import { formatMarriageSessionScheduledAt } from "@/lib/marriage-session-scheduling";
import { readJsonResponse } from "@/lib/read-json-response";

type Activity = {
  id: string;
  kind: string;
  title: string;
  instructions?: string;
  discussionPrompt?: string;
  scriptureRefs?: string[];
  moduleIds?: string[];
  optionalModuleIds?: string[];
  questions: Array<{ id: string; prompt: string }>;
};

type Workspace = {
  homework: {
    id: string;
    title: string;
    instructions?: string;
    dueAt?: string;
    dueAtTimeZone?: string;
    activities: Activity[];
  };
  response: { answers: Record<string, string>; lastSavedAt: string; submittedAt?: string };
  progress: { answered: number; total: number };
  status: string;
  counselorFeedback?: string;
};

export function MarriageCoupleHomeworkWorkspace({ homeworkId }: { homeworkId: string }) {
  const [data, setData] = useState<Workspace | null>(null);
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    setError("");
    const res = await fetch(`/api/marriage/homework/${homeworkId}`, { cache: "no-store" });
    const body = await readJsonResponse<Workspace & { error?: string }>(res);
    if (!res.ok) {
      setError(body.error ?? "Could not load homework.");
      setData(null);
      return;
    }
    setData(body);
    setAnswers(body.response.answers ?? {});
  }, [homeworkId]);

  useEffect(() => {
    void load();
  }, [load]);

  const activities = data?.homework.activities ?? [];
  const activity = activities[step] ?? null;
  const submitted = Boolean(data?.response.submittedAt);

  const progressPct = useMemo(() => {
    if (!data?.progress.total) return 0;
    return Math.round((data.progress.answered / data.progress.total) * 100);
  }, [data]);

  function queueSave(patch: Record<string, string>) {
    if (submitted) return;
    setSaveState("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/marriage/homework/${homeworkId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers: patch }),
        });
        const body = await readJsonResponse<{ error?: string; progress?: { answered: number; total: number } }>(res);
        if (!res.ok) throw new Error(body.error ?? "Save failed.");
        setSaveState("saved");
        if (body.progress && data) {
          setData({ ...data, progress: body.progress });
        }
      } catch {
        setSaveState("idle");
      }
    }, 600);
  }

  function updateAnswer(key: string, value: string) {
    setAnswers((prev) => {
      const next = { ...prev, [key]: value };
      queueSave({ [key]: value });
      return next;
    });
  }

  async function submitAll() {
    if (!confirm("Submit your homework? You can ask your counselor to reopen if you need changes.")) return;
    setError("");
    const res = await fetch(`/api/marriage/homework/${homeworkId}/submit`, { method: "POST" });
    const body = await readJsonResponse<{ error?: string }>(res);
    if (!res.ok) {
      setError(body.error ?? "Submit failed.");
      return;
    }
    await load();
  }

  if (error && !data) {
    return (
      <div className={marriagePremium.page}>
        <div className={marriagePremium.inset}>
          <p className="text-sm text-red-800">{error}</p>
          <Link href="/marriage/homework" className={`${marriagePremium.secondaryCta} mt-4 inline-block`}>
            Back
          </Link>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={marriagePremium.page}>
        <div className={marriagePremium.inset}>
          <p className={marriagePremium.cardMuted}>Loading homework…</p>
        </div>
      </div>
    );
  }

  return (
    <div className={marriagePremium.page}>
      <div className={marriagePremium.inset}>
        <Link href="/marriage/homework" className="text-sm font-semibold text-clay-700 underline dark:text-clay-300">
          ← My homework
        </Link>
        <h1 className="mt-3 font-display text-xl font-semibold">{data.homework.title}</h1>
        {data.homework.instructions ? (
          <p className={`${marriagePremium.cardMuted} mt-2 text-sm whitespace-pre-wrap`}>{data.homework.instructions}</p>
        ) : null}
        {data.homework.dueAt ? (
          <p className="mt-2 text-sm font-medium">
            Due {formatMarriageSessionScheduledAt(data.homework.dueAt, data.homework.dueAtTimeZone)}
          </p>
        ) : null}
        <div className="mt-4">
          <div className="h-2 overflow-hidden rounded-full bg-stone-200 dark:bg-white/10">
            <div className="h-full bg-clay-600 transition-all" style={{ width: `${progressPct}%` }} />
          </div>
          <p className="mt-1 text-xs text-night-500">
            {data.progress.answered}/{data.progress.total} reflection questions ·{" "}
            {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : "Autosave on"}
          </p>
        </div>

        {data.counselorFeedback ? (
          <div className={`${marriagePremium.card} mt-4 border border-clay-200`}>
            <p className={marriagePremium.sectionLabel}>Counselor feedback</p>
            <p className="mt-2 text-sm whitespace-pre-wrap">{data.counselorFeedback}</p>
          </div>
        ) : null}

        {submitted ? (
          <div className={`${marriagePremium.card} mt-6`}>
            <p className="font-semibold text-emerald-800 dark:text-emerald-200">Submitted</p>
            <p className="mt-1 text-sm">Thank you. Your counselor can review before your next session.</p>
          </div>
        ) : null}

        {activity && !submitted && (
          <div className={`${marriagePremium.card} mt-6`}>
            <p className="text-xs font-bold uppercase tracking-wide text-clay-800 dark:text-clay-300">
              Activity {step + 1} of {activities.length}
            </p>
            <h2 className="mt-1 text-lg font-semibold">{activity.title}</h2>
            {activity.instructions ? <p className="mt-2 text-sm">{activity.instructions}</p> : null}
            {activity.discussionPrompt ? (
              <p className="mt-3 rounded-xl bg-clay-50 px-3 py-2 text-sm italic dark:bg-white/5">
                Together: {activity.discussionPrompt}
              </p>
            ) : null}
            {activity.scriptureRefs?.length ? (
              <p className="mt-2 text-sm font-medium">Read: {activity.scriptureRefs.join(" · ")}</p>
            ) : null}
            {activity.kind === "curriculum_link" ? (
              <div className="mt-4 space-y-2">
                {activity.moduleIds?.map((mod) => (
                  <Link key={mod} href={`/marriage/module/${mod}`} className={marriagePremium.primaryCta}>
                    Open {mod.replace(/-/g, " ")}
                  </Link>
                ))}
                {activity.optionalModuleIds?.map((mod) => (
                  <Link key={mod} href={`/marriage/module/${mod}`} className={marriagePremium.secondaryCta}>
                    Optional: {mod.replace(/-/g, " ")}
                  </Link>
                ))}
              </div>
            ) : (
              <ul className="mt-4 space-y-4">
                {activity.questions.map((q) => {
                  const key = homeworkAnswerKey(activity.id, q.id);
                  return (
                    <li key={q.id}>
                      <label className="block text-sm font-semibold">{q.prompt}</label>
                      <textarea
                        className="mt-2 min-h-[120px] w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-night-900"
                        value={answers[key] ?? ""}
                        onChange={(e) => updateAnswer(key, e.target.value)}
                      />
                    </li>
                  );
                })}
              </ul>
            )}
            <div className="mt-6 flex flex-wrap gap-2">
              <button
                type="button"
                className={marriagePremium.secondaryCta}
                disabled={step <= 0}
                onClick={() => setStep((s) => Math.max(0, s - 1))}
              >
                Previous
              </button>
              {step < activities.length - 1 ? (
                <button type="button" className={marriagePremium.primaryCta} onClick={() => setStep((s) => s + 1)}>
                  Continue
                </button>
              ) : (
                <button type="button" className={marriagePremium.primaryCta} onClick={() => void submitAll()}>
                  Submit homework
                </button>
              )}
            </div>
          </div>
        )}

        {!submitted && (
          <p className="mt-4 text-center text-sm">
            <button type="button" className="font-semibold text-clay-700 underline" onClick={() => void load()}>
              Continue later
            </button>
          </p>
        )}

        {error ? <p className="mt-3 text-sm text-red-800">{error}</p> : null}
      </div>
    </div>
  );
}
