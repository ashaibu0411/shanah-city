"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { marriagePremium } from "@/components/marriage/marriage-counseling-premium";
import { MarriageCoupleSessionFeedbackDetail } from "@/components/marriage/MarriageCoupleSessionFeedbackDetail";
import type { MarriageCoupleFeedbackSessionSummary } from "@/lib/marriage-couple-feedback-server";
import { SELF_PACED_ASYNC_DISCLAIMER } from "@/lib/marriage-counseling-delivery-mode";
import { readJsonResponse } from "@/lib/read-json-response";
import { MarriagePrepBackToHub } from "@/components/marriage/MarriagePrepBackToHub";

type CenterView = {
  sessions: MarriageCoupleFeedbackSessionSummary[];
  unlinkedHomework: Array<{ id: string; title: string; actionRequired?: boolean; counselorReviewStatus?: string }>;
};

function sessionBadge(s: MarriageCoupleFeedbackSessionSummary) {
  if (s.approvedAt) return "Approved";
  if (s.actionRequired) return "Action needed";
  if (s.awaitingCounselorReview) return "Awaiting counselor";
  if (s.hasPublishedFeedback) return "Guidance posted";
  return s.workflowStatus.replace(/_/g, " ");
}

export function MarriageCoupleFeedbackCenter() {
  const searchParams = useSearchParams();
  const focusSession = searchParams.get("sessionKey")?.trim() ?? "";
  const [center, setCenter] = useState<CenterView | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const res = await fetch("/api/marriage/self-paced?view=center", { cache: "no-store" });
    const data = await readJsonResponse<CenterView & { error?: string }>(res);
    if (!res.ok) {
      setError(data.error ?? "Could not load feedback.");
      setCenter(null);
    } else {
      setCenter(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (focusSession) {
    return <MarriageCoupleSessionFeedbackDetail sessionKey={focusSession} />;
  }

  return (
    <div className={marriagePremium.page}>
      <div className={`${marriagePremium.inset} min-w-0`}>
        <MarriagePrepBackToHub />
        <h1 className="mt-3 font-display text-2xl font-semibold">My counselor&apos;s feedback</h1>
        <p className={`${marriagePremium.cardMuted} mt-1 text-sm`}>
          Published guidance, homework, and clarification for your Marriage Prep journey.
        </p>
        <p className="mt-2 text-xs text-night-600 dark:text-sand-400">{SELF_PACED_ASYNC_DISCLAIMER}</p>

        {loading ? <p className={`${marriagePremium.cardMuted} mt-6`}>Loading…</p> : null}
        {error ? <p className="mt-4 text-sm text-red-800">{error}</p> : null}

        {!loading && center && center.sessions.length === 0 ? (
          <div className={`${marriagePremium.card} mt-6`}>
            <p className="text-sm">
              When your counselor publishes session guidance, it will appear here. You can still open{" "}
              <Link href="/marriage/homework" className="font-semibold text-clay-700 underline">
                homework
              </Link>{" "}
              from your dashboard.
            </p>
          </div>
        ) : null}

        {center?.sessions.length ? (
          <ul className="mt-6 space-y-3">
            {center.sessions.map((s) => (
              <li key={s.sessionKey}>
                <Link
                  href={`/marriage/feedback?sessionKey=${encodeURIComponent(s.sessionKey)}`}
                  className={`${marriagePremium.moduleRow} block`}
                >
                  <span className="text-xs font-bold uppercase tracking-wide text-clay-800 dark:text-clay-300">
                    {s.kind === "stage2_enrichment" ? "Marriage enrichment" : "Premarital session"}
                  </span>
                  <span className="mt-1 block text-sm font-semibold">{s.title}</span>
                  <span className="mt-1 block text-xs capitalize text-night-500">{sessionBadge(s)}</span>
                  {s.homeworkCount > 0 ? (
                    <span className="mt-1 block text-xs text-night-600">
                      {s.homeworkCount} homework item{s.homeworkCount === 1 ? "" : "s"}
                      {s.homeworkActionCount > 0 ? ` · ${s.homeworkActionCount} need attention` : ""}
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}

        {center && center.unlinkedHomework.length > 0 ? (
          <div className="mt-8">
            <p className={marriagePremium.sectionLabel}>Homework</p>
            <ul className="mt-2 space-y-2">
              {center.unlinkedHomework.map((h) => (
                <li key={h.id} className={marriagePremium.moduleRow}>
                  <Link href={`/marriage/homework/${h.id}`} className="text-sm font-semibold">
                    {h.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
