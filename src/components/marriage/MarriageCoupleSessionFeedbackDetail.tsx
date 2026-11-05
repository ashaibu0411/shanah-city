"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { marriagePremium } from "@/components/marriage/marriage-counseling-premium";
import { readJsonResponse } from "@/lib/read-json-response";

type Detail = {
  journeyId: string;
  sessionKey: string;
  title: string;
  kind: string;
  workflowStatus: string;
  statusLabel: string;
  approvedAt: string | null;
  feedbackPublishedAt: string | null;
  feedback: {
    sharedFeedback?: string;
    strengths?: string;
    concerns?: string;
    discussionTopics?: string;
    biblicalGuidance?: string;
    practicalExercises?: string;
    jointRecommendations?: string;
    partnerSpecific?: string | null;
    publishedAt?: string | null;
    asyncDisclaimer?: string;
  } | null;
  clarifications: Array<{
    id: string;
    authorRole: string;
    isMine: boolean;
    body: string;
    createdAt: string;
  }>;
  sessionHomework: Array<{
    id: string;
    title: string;
    counselorReviewStatus?: string;
    actionRequired?: boolean;
    revisionNote?: string;
  }>;
};

function FeedbackBlock({ label, text }: { label: string; text?: string }) {
  if (!text?.trim()) return null;
  return (
    <div className="mt-3">
      <p className="text-xs font-bold uppercase tracking-wide text-night-500">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm">{text}</p>
    </div>
  );
}

export function MarriageCoupleSessionFeedbackDetail({ sessionKey }: { sessionKey: string }) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState("");
  const [clarify, setClarify] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError("");
    const res = await fetch(
      `/api/marriage/self-paced?view=session&sessionKey=${encodeURIComponent(sessionKey)}`,
      { cache: "no-store" },
    );
    const data = await readJsonResponse<Detail & { error?: string }>(res);
    if (!res.ok) {
      setError(data.error ?? "Could not load session.");
      setDetail(null);
      return;
    }
    setDetail(data);
  }, [sessionKey]);

  useEffect(() => {
    void load();
  }, [load]);

  async function sendClarification() {
    if (!clarify.trim()) return;
    setBusy(true);
    const res = await fetch("/api/marriage/self-paced", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "post_clarification",
        journeyId: detail?.journeyId ?? "",
        sessionKey,
        body: clarify,
      }),
    });
    const data = await readJsonResponse<{ error?: string }>(res);
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Could not send message.");
      return;
    }
    setClarify("");
    await load();
  }

  if (error && !detail) {
    return (
      <div className={marriagePremium.page}>
        <div className={marriagePremium.inset}>
          <p className="text-sm text-red-800">{error}</p>
          <Link href="/marriage/feedback" className={`${marriagePremium.secondaryCta} mt-4 inline-block`}>
            Back to feedback
          </Link>
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className={marriagePremium.page}>
        <div className={marriagePremium.inset}>
          <p className={marriagePremium.cardMuted}>Loading…</p>
        </div>
      </div>
    );
  }

  const fb = detail.feedback;

  return (
    <div className={marriagePremium.page}>
      <div className={`${marriagePremium.inset} min-w-0`}>
        <Link href="/marriage/feedback" className="text-sm font-semibold text-clay-700 dark:text-clay-300">
          ← My counselor&apos;s feedback
        </Link>
        <h1 className="mt-2 font-display text-xl font-semibold">{detail.title}</h1>
        <p className={`${marriagePremium.cardMuted} mt-1 text-sm`}>{detail.statusLabel}</p>

        {fb ? (
          <section className={`${marriagePremium.card} mt-6`} aria-labelledby="shared-feedback">
            <h2 id="shared-feedback" className={marriagePremium.sectionLabel}>
              For both of you
            </h2>
            <FeedbackBlock label="Summary" text={fb.sharedFeedback} />
            <FeedbackBlock label="Strengths" text={fb.strengths} />
            <FeedbackBlock label="Areas to discuss" text={fb.concerns} />
            <FeedbackBlock label="Discussion topics" text={fb.discussionTopics} />
            <FeedbackBlock label="Biblical guidance" text={fb.biblicalGuidance} />
            <FeedbackBlock label="Practical exercises" text={fb.practicalExercises} />
            <FeedbackBlock label="Joint recommendations" text={fb.jointRecommendations} />
          </section>
        ) : (
          <p className={`${marriagePremium.cardMuted} mt-6 text-sm`}>
            Your counselor has not published written guidance for this session yet.
          </p>
        )}

        {fb?.partnerSpecific ? (
          <section className={`${marriagePremium.card} mt-4 border border-clay-200 dark:border-clay-800`}>
            <h2 className={marriagePremium.sectionLabel}>For you personally</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm">{fb.partnerSpecific}</p>
            <p className="mt-2 text-xs text-night-500">Only you see this section on your login.</p>
          </section>
        ) : null}

        {detail.sessionHomework.length > 0 ? (
          <section className="mt-6">
            <h2 className={marriagePremium.sectionLabel}>Homework</h2>
            <ul className="mt-2 space-y-2">
              {detail.sessionHomework.map((h) => (
                <li key={h.id} className={marriagePremium.moduleRow}>
                  <Link href={`/marriage/homework/${h.id}`} className="block text-sm font-semibold">
                    {h.title}
                  </Link>
                  <span className="mt-1 block text-xs capitalize text-night-500">
                    {h.counselorReviewStatus?.replace(/_/g, " ") ?? "assigned"}
                  </span>
                  {h.revisionNote ? (
                    <p className="mt-1 text-xs text-amber-900">{h.revisionNote}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className={`${marriagePremium.card} mt-6`}>
          <h2 className={marriagePremium.sectionLabel}>Clarification</h2>
          {detail.clarifications.length === 0 ? (
            <p className="mt-2 text-sm text-night-600">No messages yet.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {detail.clarifications.map((m) => (
                <li
                  key={m.id}
                  className={`rounded-xl px-3 py-2 text-sm ${
                    m.authorRole === "counselor"
                      ? "bg-stone-100 dark:bg-white/10"
                      : m.isMine
                        ? "bg-clay-50 dark:bg-clay-950/40"
                        : "bg-stone-50 dark:bg-night-900/40"
                  }`}
                >
                  <p className="text-xs font-bold capitalize text-night-500">
                    {m.authorRole === "counselor" ? "Counselor" : m.isMine ? "You" : "Partner"}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap">{m.body}</p>
                </li>
              ))}
            </ul>
          )}
          {detail.workflowStatus !== "approved" ? (
            <div className="mt-4">
              <label className="block text-sm font-semibold">Your reply</label>
              <textarea
                className="mt-1 w-full rounded-lg border border-stone-200 p-2 text-sm dark:border-white/10 dark:bg-night-900"
                rows={3}
                value={clarify}
                onChange={(e) => setClarify(e.target.value)}
              />
              <button
                type="button"
                disabled={busy}
                className={`${marriagePremium.primaryCta} mt-2`}
                onClick={() => void sendClarification()}
              >
                Send to counselor
              </button>
            </div>
          ) : null}
        </section>

        {error ? <p className="mt-4 text-sm text-red-800">{error}</p> : null}

        <Link href="/marriage" className={`${marriagePremium.secondaryCta} mt-6 inline-block`}>
          Back to Marriage Prep dashboard
        </Link>
      </div>
    </div>
  );
}
