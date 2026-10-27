"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { marriagePremium } from "@/components/marriage/marriage-counseling-premium";
import type { MarriageCounselorStructuredFeedback } from "@/lib/marriage-self-paced-types";
import { SELF_PACED_ASYNC_DISCLAIMER } from "@/lib/marriage-counseling-delivery-mode";
import { readJsonResponse } from "@/lib/read-json-response";

const EMPTY_FEEDBACK: MarriageCounselorStructuredFeedback = {
  strengths: "",
  concerns: "",
  discussionTopics: "",
  biblicalGuidance: "",
  practicalExercises: "",
  individualRecommendations: "",
  jointRecommendations: "",
  homeworkNotes: "",
  finalComments: "",
  sharedFeedback: "",
  counselorInternalNotes: "",
};

export function MarriageCounselorSessionReviewClient({
  journeyId,
  sessionKey,
}: {
  journeyId: string;
  sessionKey: string;
}) {
  const [feedback, setFeedback] = useState<MarriageCounselorStructuredFeedback>(EMPTY_FEEDBACK);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(
      `/api/marriage/counselor/self-paced?journeyId=${encodeURIComponent(journeyId)}&sessionKey=${encodeURIComponent(sessionKey)}`,
      { cache: "no-store" },
    );
    const data = await readJsonResponse<{
      review?: { workflowStatus: string; feedbackDraft?: MarriageCounselorStructuredFeedback | null };
      error?: string;
    }>(res);
    if (!res.ok) {
      setError(data.error ?? "Could not load session.");
      return;
    }
    setStatus(data.review?.workflowStatus ?? "");
    if (data.review?.feedbackDraft) setFeedback({ ...EMPTY_FEEDBACK, ...data.review.feedbackDraft });
  }, [journeyId, sessionKey]);

  useEffect(() => {
    void load();
  }, [load]);

  async function post(action: string) {
    setBusy(true);
    setError("");
    const res = await fetch("/api/marriage/counselor/self-paced", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, journeyId, sessionKey, feedback }),
    });
    const data = await readJsonResponse<{ error?: string }>(res);
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Request failed.");
      return;
    }
    await load();
  }

  function field(
    key: keyof MarriageCounselorStructuredFeedback,
    label: string,
    rows = 3,
  ) {
    if (key === "optionalMeetingRecommended") return null;
    return (
      <label className="block text-sm">
        <span className="font-semibold">{label}</span>
        <textarea
          className="mt-1 w-full rounded-lg border border-stone-200 p-2 text-sm dark:border-white/10 dark:bg-night-900"
          rows={rows}
          value={String(feedback[key] ?? "")}
          onChange={(e) => setFeedback((f) => ({ ...f, [key]: e.target.value }))}
        />
      </label>
    );
  }

  return (
    <div className={marriagePremium.counselorDashboardPage}>
      <div className={marriagePremium.counselorDashboardInset}>
        <Link href="/marriage/counselor" className="text-sm font-semibold text-clay-700">
          ← Counselor workspace
        </Link>
        <h1 className="mt-2 font-display text-xl font-semibold">Session review</h1>
        <p className={marriagePremium.cardMuted}>{sessionKey.replace(/-/g, " ")} · {status || "…"}</p>
        <p className="mt-2 text-xs text-night-600">{SELF_PACED_ASYNC_DISCLAIMER}</p>

        <div className={`${marriagePremium.card} mt-6 space-y-4`}>
          {field("strengths", "Areas of strength")}
          {field("concerns", "Areas of concern")}
          {field("discussionTopics", "Recommended discussion topics")}
          {field("biblicalGuidance", "Biblical / pastoral guidance", 4)}
          {field("practicalExercises", "Practical exercises")}
          {field("individualRecommendations", "Individual recommendations", 4)}
          {field("jointRecommendations", "Joint recommendations", 4)}
          {field("homeworkNotes", "Homework notes")}
          {field("sharedFeedback", "Shared feedback (both partners)", 4)}
          {field("finalComments", "Final comments")}
          {field("counselorInternalNotes", "Counselor-only notes (never published)", 3)}
        </div>

        {error ? <p className="mt-4 text-sm text-red-800">{error}</p> : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={busy}
            className={marriagePremium.primaryCta}
            onClick={() => void post("save_feedback_draft")}
          >
            Save draft
          </button>
          <button
            type="button"
            disabled={busy}
            className={marriagePremium.secondaryCta}
            onClick={() => void post("publish_feedback")}
          >
            Publish to couple
          </button>
          <button
            type="button"
            disabled={busy}
            className={marriagePremium.secondaryCta}
            onClick={() => void post("approve_session")}
          >
            Approve session completion
          </button>
        </div>
      </div>
    </div>
  );
}
