"use client";

import { useCallback, useEffect, useState } from "react";
import { MarriageAssessmentRunner } from "@/components/marriage/MarriageAssessmentRunner";
import { MarriageStage2ModuleRunner } from "@/components/marriage/MarriageStage2ModuleRunner";
import type { MarriageModuleDefinition } from "@/lib/marriage-counseling-types";
import { readJsonResponse } from "@/lib/read-json-response";
import { marriagePremium } from "@/components/marriage/marriage-counseling-premium";

export function MarriageModuleExperience({ moduleId }: { moduleId: string }) {
  const [module, setModule] = useState<MarriageModuleDefinition | null | undefined>(undefined);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/marriage/assessment/${moduleId}`, { cache: "no-store" });
    const payload = await readJsonResponse<{ module?: MarriageModuleDefinition; error?: string }>(res);
    if (!res.ok) {
      setError(payload.error ?? "Unable to load module.");
      setModule(null);
      return;
    }
    setModule(payload.module ?? null);
  }, [moduleId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (module === undefined && !error) {
    return <p className={marriagePremium.cardMuted}>Loading…</p>;
  }

  if (error) {
    return (
      <div className={marriagePremium.card}>
        <p className="text-sm text-red-800">{error}</p>
      </div>
    );
  }

  const useLessonRunner = Boolean(module?.lessons?.length);

  if (useLessonRunner) {
    return <MarriageStage2ModuleRunner moduleId={moduleId} />;
  }

  return <MarriageAssessmentRunner moduleId={moduleId} />;
}
