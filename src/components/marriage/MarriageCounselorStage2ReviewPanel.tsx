"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { marriagePremium } from "@/components/marriage/marriage-counseling-premium";
import { isMarriageStage2ClientEnabled } from "@/lib/marriage-stage2-feature";
import { readJsonResponse } from "@/lib/read-json-response";

type ReviewRow = {
  sessionKey: string;
  workflowStatus: string;
  assignedModuleIds: string[];
};

export function MarriageCounselorStage2ReviewPanel({
  journeyId,
  moduleId,
  moduleTitle,
}: {
  journeyId: string;
  moduleId: string;
  moduleTitle: string;
}) {
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    if (!isMarriageStage2ClientEnabled()) return;
    const res = await fetch(`/api/marriage/counselor/stage2?journeyId=${encodeURIComponent(journeyId)}`, {
      cache: "no-store",
    });
    const data = await readJsonResponse<{ reviews?: ReviewRow[] }>(res);
    if (res.ok && data.reviews) setReviews(data.reviews);
  }, [journeyId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!isMarriageStage2ClientEnabled()) return null;

  const sessionKey = `stage2:${moduleId}`;
  const existing = reviews.find((r) => r.sessionKey === sessionKey);

  async function assignReview() {
    setBusy(true);
    setMessage("");
    const res = await fetch("/api/marriage/counselor/stage2", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "assign_module_review", journeyId, moduleId }),
    });
    const data = await readJsonResponse<{ error?: string }>(res);
    setBusy(false);
    if (!res.ok) {
      setMessage(data.error ?? "Could not assign review.");
      return;
    }
    setMessage("Stage 2 review assigned. Open the review workspace when both partners submit.");
    await load();
  }

  return (
    <div className={`${marriagePremium.card} mt-4 border border-stone-200 dark:border-white/10`}>
      <p className={marriagePremium.sectionLabel}>Stage 2 enrichment review</p>
      <p className="mt-1 text-xs text-night-600">
        Separate from the eight premarital sessions. Assign review after the couple completes this module.
      </p>
      {existing ? (
        <Link
          href={`/marriage/counselor/review/${journeyId}/${encodeURIComponent(sessionKey)}`}
          className={`${marriagePremium.primaryCta} mt-3 inline-block`}
        >
          Open review · {existing.workflowStatus.replace(/_/g, " ")}
        </Link>
      ) : (
        <button type="button" disabled={busy} className={`${marriagePremium.secondaryCta} mt-3`} onClick={() => void assignReview()}>
          Assign counselor review for {moduleTitle}
        </button>
      )}
      {message ? <p className="mt-2 text-sm text-clay-800">{message}</p> : null}
    </div>
  );
}
