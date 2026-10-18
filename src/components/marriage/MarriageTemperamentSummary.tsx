"use client";

import { useCallback, useEffect, useState } from "react";
import { marriagePremium } from "@/components/marriage/marriage-counseling-premium";
import { MarriageTemperamentSnapshotView } from "@/components/marriage/MarriageTemperamentSnapshotView";
import type { TemperamentSnapshotSection } from "@/lib/marriage-stage2-temperament-scoring-v2";
import { readJsonResponse } from "@/lib/read-json-response";

type TemperamentApiV2 = {
  scoringModelVersion?: string;
  disclaimer?: string;
  sections?: TemperamentSnapshotSection[];
  error?: string;
};

export function MarriageTemperamentSummary() {
  const [payload, setPayload] = useState<TemperamentApiV2 | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/marriage/stage2?view=temperament", { cache: "no-store" });
    const data = await readJsonResponse<TemperamentApiV2>(res);
    if (!res.ok) {
      setError(data.error ?? "");
      return;
    }
    setPayload(data);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) return null;
  if (!payload?.sections?.length) return null;

  return (
    <div className={`${marriagePremium.card} mt-8 w-full min-w-0 p-5 sm:p-6`}>
      <h2 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">Temperament snapshot</h2>
      <MarriageTemperamentSnapshotView
        sections={payload.sections}
        disclaimer={payload.disclaimer ?? ""}
        scoringModelVersion={payload.scoringModelVersion ?? "temperament-scoring/2.0.0"}
      />
    </div>
  );
}
