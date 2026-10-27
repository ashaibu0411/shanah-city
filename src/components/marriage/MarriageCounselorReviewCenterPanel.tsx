"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { marriagePremium } from "@/components/marriage/marriage-counseling-premium";
import type { MarriageSelfPacedSessionReviewRecord } from "@/lib/marriage-self-paced-types";
import { counselingDeliveryModeLabel } from "@/lib/marriage-counseling-delivery-mode";
import { readJsonResponse } from "@/lib/read-json-response";

type CenterPayload = {
  center: {
    awaitingReview: MarriageSelfPacedSessionReviewRecord[];
    homeworkReview: MarriageSelfPacedSessionReviewRecord[];
    clarification: MarriageSelfPacedSessionReviewRecord[];
  };
};

export function MarriageCounselorReviewCenterPanel() {
  const [rows, setRows] = useState<MarriageSelfPacedSessionReviewRecord[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/marriage/counselor/self-paced", { cache: "no-store" });
    const data = await readJsonResponse<CenterPayload & { error?: string }>(res);
    if (!res.ok) {
      setError(data.error ?? "Could not load review center.");
      return;
    }
    setRows([
      ...data.center.awaitingReview,
      ...data.center.homeworkReview,
      ...data.center.clarification,
    ]);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) {
    return <p className="text-sm text-red-800">{error}</p>;
  }

  return (
    <section className={`${marriagePremium.card} mt-6`}>
      <h2 className="font-display text-lg font-semibold">Self-paced review center</h2>
      <p className={marriagePremium.cardMuted}>
        Sessions move here when both partners submit required assessments. Approve only after
        publishing guidance — assessment submit alone never completes a session.
      </p>
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-night-600">No sessions awaiting counselor review.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {rows.map((row) => (
            <li
              key={`${row.journeyId}-${row.sessionKey}`}
              className="rounded-xl border border-stone-200/80 p-3 dark:border-white/10"
            >
              <p className="text-sm font-semibold capitalize">{row.sessionKey.replace(/-/g, " ")}</p>
              <p className="text-xs text-night-600">Status: {row.workflowStatus.replace(/_/g, " ")}</p>
              <Link
                href={`/marriage/counselor/review/${row.journeyId}/${encodeURIComponent(row.sessionKey)}`}
                className={`${marriagePremium.secondaryCta} mt-2 inline-block text-sm`}
              >
                Open review
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function CounselingModeBadge({ mode }: { mode: string | null | undefined }) {
  return (
    <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-semibold dark:bg-white/10">
      {counselingDeliveryModeLabel(mode as Parameters<typeof counselingDeliveryModeLabel>[0])}
    </span>
  );
}
