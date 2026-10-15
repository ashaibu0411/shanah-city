"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { marriagePremium } from "@/components/marriage/marriage-counseling-premium";
import type { MarriageCounselingJourneyRecord } from "@/lib/marriage-counseling-types";
import { readJsonResponse } from "@/lib/read-json-response";

type Row = {
  journey: MarriageCounselingJourneyRecord;
  coupleLabel: string;
  moduleCount: number;
  completedModules: number;
};

export function MarriageCounselorDashboard() {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/marriage/counselor", { cache: "no-store" });
      const data = await readJsonResponse<{ rows: Row[]; error?: string }>(res);
      if (!res.ok) setError(data.error ?? "Access denied.");
      else setRows(data.rows);
    })();
  }, []);

  if (error) {
    return (
      <div className={marriagePremium.card}>
        <p className="text-sm text-red-800">{error}</p>
        <Link href="/marriage" className={`${marriagePremium.secondaryCta} mt-4`}>
          Back
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link href="/marriage" className="text-sm font-semibold text-clay-700">
        ← Hub
      </Link>
      <h1 className="mt-2 font-display text-xl font-semibold">Counselor workspace</h1>
      <p className={marriagePremium.cardMuted}>
        Shared comparisons and module progress only. Private reflections stay hidden unless consented.
      </p>

      <ul className="mt-6 space-y-3">
        {rows.map(({ journey, coupleLabel, moduleCount, completedModules }) => (
          <li key={journey.id} className={marriagePremium.card}>
            <p className="font-semibold">{coupleLabel || "Couple"}</p>
            <p className={`${marriagePremium.cardMuted} mt-1 capitalize`}>
              {journey.programType} · {completedModules}/{moduleCount} modules both submitted
            </p>
            <p className="text-xs text-night-500">Journey {journey.id.slice(0, 8)}…</p>
          </li>
        ))}
        {rows.length === 0 && <p className={marriagePremium.cardMuted}>No active journeys yet.</p>}
      </ul>
    </div>
  );
}
