"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { MarriageHomeworkTimingLines } from "@/components/marriage/MarriageHomeworkTimingLines";
import { marriagePremium } from "@/components/marriage/marriage-counseling-premium";
import type { MarriageHubSessionHomeworkView } from "@/lib/marriage-counseling-types";
import { formatMarriageSessionScheduledAt } from "@/lib/marriage-session-scheduling";
import { readJsonResponse } from "@/lib/read-json-response";

function statusLabel(status: MarriageHubSessionHomeworkView["status"]) {
  return status.replace(/_/g, " ");
}

export function MarriageCoupleHomeworkList() {
  const [items, setItems] = useState<MarriageHubSessionHomeworkView[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/marriage/homework", { cache: "no-store" });
    const data = await readJsonResponse<{ items?: MarriageHubSessionHomeworkView[]; error?: string }>(res);
    if (!res.ok) setError(data.error ?? "Could not load homework.");
    else setItems(data.items ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const current = items.filter((i) => !i.submitted);
  const history = items.filter((i) => i.submitted);

  return (
    <div className={marriagePremium.page}>
      <div className={marriagePremium.inset}>
        <Link href="/marriage" className="text-sm font-semibold text-clay-700 underline dark:text-clay-300">
          ← Marriage Prep
        </Link>
        <h1 className="mt-3 font-display text-2xl font-semibold">My homework</h1>
        <p className={`${marriagePremium.cardMuted} mt-1 text-sm`}>
          Complete reflections at your pace. Your private answers are not shared with your partner.
        </p>

        {loading ? <p className={`${marriagePremium.cardMuted} mt-6`}>Loading…</p> : null}
        {error ? <p className="mt-4 text-sm text-red-800">{error}</p> : null}

        {!loading && items.length === 0 ? (
          <div className={`${marriagePremium.card} mt-6`}>
            <p className="text-sm">No homework assigned yet. Your counselor will release activities after sessions.</p>
          </div>
        ) : null}

        {current.length > 0 ? (
          <div className="mt-6">
            <p className={marriagePremium.sectionLabel}>Current</p>
            <ul className="mt-2 space-y-2">
              {current.map((item) => (
                <li key={item.id} className={marriagePremium.moduleRow}>
                  <Link href={`/marriage/homework/${item.id}`} className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{item.title}</span>
                    <MarriageHomeworkTimingLines
                      className="mt-1"
                      assignedAfterLabel={item.assignedAfterLabel}
                      preparingForLabel={item.preparingForLabel}
                      postProgramNote={item.postProgramNote}
                      estimatedMinutes={item.estimatedMinutes}
                      dueAt={item.dueAt}
                      dueAtTimeZone={item.dueAtTimeZone}
                      formatDue={formatMarriageSessionScheduledAt}
                    />
                    <span className="mt-1 block text-xs capitalize text-night-500">{statusLabel(item.status)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {history.length > 0 ? (
          <div className="mt-6">
            <p className={marriagePremium.sectionLabel}>Completed</p>
            <ul className="mt-2 space-y-2">
              {history.map((item) => (
                <li key={item.id} className={marriagePremium.moduleRow}>
                  <Link href={`/marriage/homework/${item.id}`} className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{item.title}</span>
                    <span className="block text-xs text-emerald-800 dark:text-emerald-200">Submitted</span>
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
