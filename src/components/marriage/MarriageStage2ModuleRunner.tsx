"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { marriagePremium } from "@/components/marriage/marriage-counseling-premium";
import { MarriageQuestionInput } from "@/components/marriage/MarriageQuestionInput";
import type {
  MarriageModuleDefinition,
  MarriageQuestionDefinition,
  MarriageStage2LessonDefinition,
} from "@/lib/marriage-counseling-types";
import { MarriageAnswerSharingConsent } from "@/components/marriage/MarriageAnswerSharingConsent";
import { MarriageSubmittedReadOnlyNotice } from "@/components/marriage/MarriageSubmittedReadOnlyNotice";
import { computeModuleSubmissionProgress } from "@/lib/marriage-module-progress";
import { readJsonResponse } from "@/lib/read-json-response";

type AssessmentPayload = {
  journeyId: string;
  module: MarriageModuleDefinition;
  myResponse: {
    status: string;
    answers: Record<string, unknown>;
    lastSavedAt: string;
    submittedAt?: string;
  } | null;
  partnerProgress: { status: string };
  comparisonUnlocked: boolean;
  error?: string;
};

const STAGE_LABELS: Record<string, string> = {
  learn: "Learn",
  reflect: "Reflect",
  answer: "Answer privately",
  compare: "Compare safely",
  discuss: "Discuss",
  practice: "Practice",
  agree: "Agree",
  review: "Review",
};

function visibilityNote(q: MarriageQuestionDefinition) {
  if (q.visibility === "private_reflection") return "Private — not shared with your partner.";
  if (q.visibility === "private_financial_disclosure") return "Private financial — never shared automatically.";
  if (q.visibility === "counselor_with_consent") return "Counselor-only with your consent.";
  if (q.visibility === "explicit_consent_to_share") return "You choose whether to share in comparison.";
  if (q.sensitivity === "high") return "Sensitive — confirm sharing before compare shows this.";
  return "Shared after you both submit.";
}

function lessonProgress(lesson: MarriageStage2LessonDefinition, questions: MarriageQuestionDefinition[], answers: Record<string, unknown>) {
  const qs = questions.filter((q) => q.lessonId === lesson.id);
  if (!qs.length) return { done: 0, total: 0, pct: 0 };
  const done = qs.filter((q) => {
    const v = answers[q.id];
    return v !== undefined && v !== "" && v !== null && v !== "__skip__";
  }).length;
  return { done, total: qs.length, pct: done / qs.length };
}

export function MarriageStage2ModuleRunner({ moduleId }: { moduleId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lessonParam = searchParams.get("lesson");

  const [data, setData] = useState<AssessmentPayload | null>(null);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [activeLessonId, setActiveLessonId] = useState<string | null>(lessonParam);
  const [index, setIndex] = useState(0);

  const load = useCallback(async () => {
    setError("");
    const res = await fetch(`/api/marriage/assessment/${moduleId}`, { cache: "no-store" });
    const payload = await readJsonResponse<AssessmentPayload>(res);
    if (!res.ok) {
      setError(payload.error ?? "Unable to load module.");
      return;
    }
    setData(payload);
    setAnswers(payload.myResponse?.answers ?? {});
    setSavedAt(payload.myResponse?.lastSavedAt ?? null);
  }, [moduleId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (lessonParam) setActiveLessonId(lessonParam);
  }, [lessonParam]);

  const lessons = data?.module.lessons ?? [];
  const allQuestions = data?.module.questions ?? [];
  const lessonQuestions = useMemo(() => {
    if (!activeLessonId) return [];
    return allQuestions.filter((q) => q.lessonId === activeLessonId);
  }, [activeLessonId, allQuestions]);

  const question = lessonQuestions[index];
  const locked = data?.myResponse?.status === "submitted";
  const activeLesson = lessons.find((l) => l.id === activeLessonId);

  async function persist(patch: Record<string, unknown>) {
    if (locked) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/marriage/assessment/${moduleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: patch }),
      });
      const body = await readJsonResponse<{ error?: string; lastSavedAt?: string }>(res);
      if (!res.ok) throw new Error(body.error ?? "Save failed.");
      if (body.lastSavedAt) setSavedAt(body.lastSavedAt);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  function setAnswer(value: unknown) {
    if (!question || locked) return;
    const next = { ...answers, [question.id]: value };
    setAnswers(next);
    void persist({ [question.id]: value });
  }

  async function submitAll() {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/marriage/assessment/${moduleId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "submit" }),
      });
      const body = await readJsonResponse<{ error?: string }>(res);
      if (!res.ok) throw new Error(body.error ?? "Submit failed.");
      await load();
      router.push(`/marriage/module/${moduleId}/review`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submit failed.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!data && !error) {
    return <p className={marriagePremium.cardMuted}>Loading module…</p>;
  }

  if (error && !data) {
    return (
      <div className={marriagePremium.card}>
        <p className="text-sm text-red-800">{error}</p>
        <Link href="/marriage/learn" className={`${marriagePremium.secondaryCta} mt-4`}>
          Learning center
        </Link>
      </div>
    );
  }

  if (!data) return null;

  const submission = computeModuleSubmissionProgress(data?.module ?? { questions: [] }, answers);

  if (!activeLessonId || !activeLesson) {
    return (
      <div className="pb-16" data-testid="marriage-module-lessons">
        <Link href="/marriage/learn" className="text-sm font-semibold text-clay-700">
          ← Learning center
        </Link>
        <h1 className="mt-2 font-display text-xl font-semibold">{data.module.title}</h1>
        <p className={marriagePremium.cardMuted}>{data.module.summary}</p>
        <div className={`${marriagePremium.card} mt-4`}>
          <p className="text-sm font-semibold">Required: {submission.requiredDone}/{submission.requiredTotal}</p>
          <p className={`${marriagePremium.cardMuted} text-xs`}>
            Optional answered: {submission.optionalDone}/{submission.optionalTotal}
          </p>
          {submission.canSubmit && !locked && (
            <p className="mt-2 text-sm text-emerald-900 dark:text-emerald-200">
              All required activities are complete. You can submit now or explore additional questions.
            </p>
          )}
        </div>
        <p className="mt-2 text-xs text-night-500">
          Journey: learn → reflect → answer → compare → discuss → practice → agree → review. Save anytime.
        </p>
        {data.partnerProgress.status === "submitted" && !data.comparisonUnlocked && (
          <p className="mt-2 text-sm text-sky-800">Your partner submitted — finish required items to compare.</p>
        )}
        {locked && (
          <div className="mt-4">
            <MarriageSubmittedReadOnlyNotice
              comparisonUnlocked={data.comparisonUnlocked}
              partnerSubmitted={data.partnerProgress.status === "submitted"}
              moduleId={moduleId}
            />
          </div>
        )}
        <ul className="mt-6 space-y-3">
          {lessons.map((lesson) => {
            const prog = lessonProgress(lesson, allQuestions, answers);
            return (
              <li key={lesson.id}>
                <button
                  type="button"
                  data-testid={`lesson-${lesson.id}`}
                  className={`${marriagePremium.card} w-full text-left`}
                  onClick={() => {
                    setActiveLessonId(lesson.id);
                    setIndex(0);
                    router.replace(`/marriage/module/${moduleId}?lesson=${encodeURIComponent(lesson.id)}`);
                  }}
                >
                  <p className="text-xs font-bold uppercase text-clay-700">{STAGE_LABELS[lesson.journeyStage] ?? lesson.journeyStage}</p>
                  <p className="mt-1 font-semibold">{lesson.title}</p>
                  <p className={`${marriagePremium.cardMuted} mt-1 text-sm`}>{lesson.summary}</p>
                  {lesson.learnContent && (
                    <p className="mt-2 text-sm leading-relaxed text-night-700 dark:text-night-200">{lesson.learnContent}</p>
                  )}
                  <div className={`${marriagePremium.progressTrack} mt-3`}>
                    <div className={marriagePremium.progressFill} style={{ width: `${prog.pct * 100}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-night-500">
                    {prog.done}/{prog.total} responses · ~{lesson.estimatedMinutes ?? 10} min
                  </p>
                </button>
              </li>
            );
          })}
        </ul>
        {!locked && (
          <Link
            href={`/marriage/module/${moduleId}/submit`}
            data-testid="marriage-module-review-submit"
            className={`${marriagePremium.primaryCta} mt-6 flex w-full justify-center ${!submission.canSubmit ? "pointer-events-none opacity-50" : ""}`}
            aria-disabled={!submission.canSubmit}
          >
            Review and submit
          </Link>
        )}
      </div>
    );
  }

  if (!question) {
    return (
      <div className={marriagePremium.card}>
        <p className="text-sm">No questions in this lesson.</p>
        <button type="button" className={`${marriagePremium.secondaryCta} mt-4`} onClick={() => setActiveLessonId(null)}>
          Back to lessons
        </button>
      </div>
    );
  }

  const progress = lessonQuestions.length ? (index + 1) / lessonQuestions.length : 0;

  return (
    <div className="pb-32">
      <button
        type="button"
        className="text-sm font-semibold text-clay-700"
        onClick={() => {
          setActiveLessonId(null);
          router.replace(`/marriage/module/${moduleId}`);
        }}
      >
        ← Lessons
      </button>
      <p className="mt-2 text-xs font-bold uppercase text-clay-700">{STAGE_LABELS[activeLesson.journeyStage]}</p>
      <h1 className="font-display text-lg font-semibold">{activeLesson.title}</h1>
      <div className={`${marriagePremium.progressTrack} mt-3`}>
        <div className={marriagePremium.progressFill} style={{ width: `${progress * 100}%` }} />
      </div>
      <p className="mt-2 text-xs text-night-500">
        Item {index + 1} of {lessonQuestions.length}
        {savedAt && !saving ? ` · Saved ${new Date(savedAt).toLocaleTimeString()}` : saving ? " · Saving…" : ""}
      </p>

      {locked && (
        <MarriageSubmittedReadOnlyNotice
          comparisonUnlocked={data.comparisonUnlocked}
          partnerSubmitted={data.partnerProgress.status === "submitted"}
          moduleId={moduleId}
        />
      )}

      <div className={`${marriagePremium.questionCard} mt-4`}>
        <p className="text-xs font-semibold uppercase tracking-wide text-clay-700">{visibilityNote(question)}</p>
        <p className="mt-3 text-base font-medium leading-snug">{question.prompt}</p>
        {question.explanation && <p className={`${marriagePremium.cardMuted} mt-2`}>{question.explanation}</p>}
        <MarriageAnswerSharingConsent
          journeyId={data.journeyId}
          moduleId={moduleId}
          question={question}
          disabled={locked}
        />
        <MarriageQuestionInput question={question} value={answers[question.id]} onChange={setAnswer} disabled={locked} />
        {question.allowSkip && !locked && (
          <button type="button" className="mt-4 text-sm font-semibold text-night-500 underline" onClick={() => setAnswer("__skip__")}>
            Prefer not to answer
          </button>
        )}
      </div>

      {error && <p className="mt-3 text-sm text-red-800">{error}</p>}

      <div className="marriage-assessment-sticky-footer grid grid-cols-2 gap-2">
        <button type="button" className={marriagePremium.secondaryCta} disabled={index === 0} onClick={() => setIndex((i) => Math.max(0, i - 1))}>
          Back
        </button>
        {index < lessonQuestions.length - 1 ? (
          <button type="button" className={marriagePremium.primaryCta} onClick={() => setIndex((i) => i + 1)}>
            Continue
          </button>
        ) : (
          <button
            type="button"
            className={marriagePremium.primaryCta}
            onClick={() => {
              setActiveLessonId(null);
              router.replace(`/marriage/module/${moduleId}`);
            }}
          >
            {locked ? "Back to lessons" : "Done with lesson"}
          </button>
        )}
      </div>
    </div>
  );
}
