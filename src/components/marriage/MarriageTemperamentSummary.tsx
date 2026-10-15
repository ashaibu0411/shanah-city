"use client";

import { useCallback, useEffect, useState } from "react";
import { marriagePremium } from "@/components/marriage/marriage-counseling-premium";
import type { TemperamentInsightRow } from "@/lib/marriage-stage2-temperament-insights";
import { readJsonResponse } from "@/lib/read-json-response";

export function MarriageTemperamentSummary() {
  const [rows, setRows] = useState<TemperamentInsightRow[]>([]);
  const [disclaimer, setDisclaimer] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/marriage/stage2?view=temperament", { cache: "no-store" });
    const data = await readJsonResponse<{ insights?: TemperamentInsightRow[]; disclaimer?: string; error?: string }>(res);
    if (!res.ok) {
      setError(data.error ?? "");
      return;
    }
    setRows(data.insights ?? []);
    setDisclaimer(data.disclaimer ?? "");
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) return null;

  if (!rows.length) return null;

  return (
    <div className={`${marriagePremium.card} mt-6`} data-testid="temperament-snapshot">
      <h2 className="font-display text-lg font-semibold">Temperament snapshot</h2>
      <p className={`${marriagePremium.cardMuted} mt-1 text-sm`}>{disclaimer}</p>
      <ul className="mt-4 space-y-3">
        {rows.map((row) => (
          <li key={row.dimension} className="rounded-xl border border-night-900/8 p-3 dark:border-white/10">
            <p className="text-sm font-semibold">{row.dimension}</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2 text-sm">
              <p>
                <span className="text-xs font-bold uppercase text-night-500">You</span>
                <br />
                {row.partnerALabel}
              </p>
              <p>
                <span className="text-xs font-bold uppercase text-night-500">Partner</span>
                <br />
                {row.partnerBLabel}
              </p>
            </div>
            <p className="mt-2 text-sm text-clay-800 dark:text-clay-200">{row.note}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
