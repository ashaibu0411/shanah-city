"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MarriageAnswerSharingConsent } from "@/components/marriage/MarriageAnswerSharingConsent";
import { MarriageCounselorAnswerConsent } from "@/components/marriage/MarriageCounselorAnswerConsent";
import { MarriageQuestionInput } from "@/components/marriage/MarriageQuestionInput";
import { MarriageSubmittedReadOnlyNotice } from "@/components/marriage/MarriageSubmittedReadOnlyNotice";
import { marriagePremium } from "@/components/marriage/marriage-counseling-premium";
import { isMarriageStage2ClientEnabled } from "@/lib/marriage-stage2-feature";
import type { MarriageModuleDefinition, MarriageQuestionDefinition } from "@/lib/marriage-counseling-types";
import { readJsonResponse } from "@/lib/read-json-response";

type AssessmentPayload = {
  module: MarriageModuleDefinition;
  journeyId: string;
  migrationNotices?: Array<{ questionId: string; message: string }>;
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

function visibilityNote(q: MarriageQuestionDefinition) {
  if (q.visibility === "private_reflection") return "Private — not shared with your partner.";
  if (q.visibility === "private_financial_disclosure") {
    return "Private financial — never shared automatically.";
  }
  if (q.visibility === "counselor_with_consent") return "Counselor-only with your consent.";
  if (q.visibility === "explicit_consent_to_share") {
    return "You choose whether to share this in comparison after both submit.";
  }
  if (q.sensitivity === "high") {
    return "Sensitive — you will confirm sharing before your partner can see this in compare.";
  }
  return "Shared with your partner after you both submit.";
}

export function MarriageAssessmentRunner({ moduleId }: { moduleId: string }) {
  const router = useRouter();
  const [data, setData] = useState<AssessmentPayload | null>(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

  const questions = data?.module.questions ?? [];
  const question = questions[index];
  const progress = questions.length ? (index + 1) / questions.length : 0;
  const locked = data?.myResponse?.status === "submitted";

  const completedCount = useMemo(() => {
    return questions.filter((q) => {
      const v = answers[q.id];
      return v !== undefined && v !== "" && v !== null;
    }).length;
  }, [answers, questions]);

  async function persist(nextAnswers: Record<string, unknown>) {
    if (locked) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/marriage/assessment/${moduleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: nextAnswers }),
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
        <Link href="/marriage" className={`${marriagePremium.secondaryCta} mt-4`}>
          Back to hub
        </Link>
      </div>
    );
  }

  if (!data || !question) return null;

  const revisionNotice = data.migrationNotices?.find((n) => n.questionId === question.id);

  return (
    <div className="marriage-assessment-runner pb-[calc(11rem+env(safe-area-inset-bottom,0px))] lg:pb-32">
      <div className="mb-4">
        <Link href="/marriage" className="text-sm font-semibold text-clay-700">
          ← Hub
        </Link>
        <h1 className="mt-2 font-display text-xl font-semibold">{data.module.title}</h1>
        <p className={marriagePremium.cardMuted}>{data.module.summary}</p>
        <div className={`${marriagePremium.progressTrack} mt-4`}>
          <div className={marriagePremium.progressFill} style={{ width: `${progress * 100}%` }} />
        </div>
        <p className="mt-2 text-xs text-night-500">
          Question {index + 1} of {questions.length} · {completedCount} answered
          {savedAt && !saving ? ` · Saved ${new Date(savedAt).toLocaleTimeString()}` : saving ? " · Saving…" : ""}
        </p>
        {data.partnerProgress.status === "submitted" && !data.comparisonUnlocked && (
          <p className="mt-2 text-sm text-sky-800 dark:text-sky-200">Your partner has submitted — finish yours to unlock comparison.</p>
        )}
      </div>

      {locked && (
        <MarriageSubmittedReadOnlyNotice
          comparisonUnlocked={data.comparisonUnlocked}
          partnerSubmitted={data.partnerProgress.status === "submitted"}
          moduleId={moduleId}
        />
      )}

      <div className={marriagePremium.questionCard}>
        {question.visibility === "counselor_with_consent" && data.journeyId ? (
          <MarriageCounselorAnswerConsent
            journeyId={data.journeyId}
            moduleId={moduleId}
            questionId={question.id}
            submitted={locked}
            localAnswer={answers[question.id]}
            answerDisclosable={
              answers[question.id] !== undefined &&
              answers[question.id] !== "" &&
              answers[question.id] !== null &&
              answers[question.id] !== "__skip__"
            }
          />
        ) : isMarriageStage2ClientEnabled() && data.journeyId ? (
          <MarriageAnswerSharingConsent
            journeyId={data.journeyId}
            moduleId={moduleId}
            question={question}
            disabled={locked}
          />
        ) : (
          <p className="text-xs font-semibold uppercase tracking-wide text-clay-700">{visibilityNote(question)}</p>
        )}
        {revisionNotice ? (
          <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
            {revisionNotice.message}
          </p>
        ) : null}
        <p className="mt-3 text-base font-medium leading-snug">{question.prompt}</p>
        {question.explanation && (
          <p className={`${marriagePremium.cardMuted} mt-2`}>{question.explanation}</p>
        )}
        <MarriageQuestionInput question={question} value={answers[question.id]} onChange={setAnswer} disabled={locked} />
        {question.allowSkip && !locked && (
          <button
            type="button"
            className="mt-4 text-sm font-semibold text-night-500 underline"
            onClick={() => setAnswer("__skip__")}
          >
            Prefer not to answer
          </button>
        )}
      </div>

      {error && <p className="mt-3 text-sm text-red-800">{error}</p>}

      <div className="marriage-assessment-sticky-footer grid grid-cols-2 gap-2">
        <button
          type="button"
          className={marriagePremium.secondaryCta}
          disabled={index === 0}
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
        >
          Back
        </button>
        {index < questions.length - 1 ? (
          <button
            type="button"
            className={marriagePremium.primaryCta}
            onClick={() => setIndex((i) => Math.min(questions.length - 1, i + 1))}
          >
            Continue
          </button>
        ) : locked ? (
          <Link href="/marriage" className={`${marriagePremium.primaryCta} text-center`}>
            Back to hub
          </Link>
        ) : (
          <button
            type="button"
            className={marriagePremium.primaryCta}
            disabled={submitting}
            onClick={() => submitAll()}
          >
            {submitting ? "Submitting…" : "Submit assessment"}
          </button>
        )}
      </div>
    </div>
  );
}

