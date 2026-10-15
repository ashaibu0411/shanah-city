"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { marriagePremium } from "@/components/marriage/marriage-counseling-premium";
import { computeModuleSubmissionProgress } from "@/lib/marriage-module-progress";
import type { MarriageModuleDefinition } from "@/lib/marriage-counseling-types";
import { readJsonResponse } from "@/lib/read-json-response";

export function MarriageModuleSubmitReview({ moduleId }: { moduleId: string }) {
  const router = useRouter();
  const [module, setModule] = useState<MarriageModuleDefinition | null>(null);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/marriage/assessment/${moduleId}`, { cache: "no-store" });
    const data = await readJsonResponse<{
      module: MarriageModuleDefinition;
      myResponse?: { answers: Record<string, unknown>; status: string };
      error?: string;
    }>(res);
    if (!res.ok) {
      setError(data.error ?? "Unable to load.");
      return;
    }
    if (data.myResponse?.status === "submitted") {
      router.replace(`/marriage/module/${moduleId}/review`);
      return;
    }
    setModule(data.module);
    setAnswers(data.myResponse?.answers ?? {});
  }, [moduleId, router]);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) {
    return (
      <div className={marriagePremium.card}>
        <p className="text-sm text-red-800">{error}</p>
      </div>
    );
  }

  if (!module) return <p className={marriagePremium.cardMuted}>Loading review…</p>;

  const progress = computeModuleSubmissionProgress(module, answers);

  async function submit() {
    if (!progress.canSubmit) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/marriage/assessment/${moduleId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "submit" }),
      });
      const body = await readJsonResponse<{ error?: string }>(res);
      if (!res.ok) throw new Error(body.error ?? "Submit failed.");
      router.push(`/marriage/module/${moduleId}/review`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submit failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="pb-24" data-testid="marriage-module-submit-review">
      <Link href={`/marriage/module/${moduleId}`} className="text-sm font-semibold text-clay-700">
        ← Back to module
      </Link>
      <h1 className="mt-2 font-display text-xl font-semibold">Review before submit</h1>
      <p className={marriagePremium.cardMuted}>{module.title}</p>

      <div className={`${marriagePremium.card} mt-6`}>
        <p className="font-semibold">Required activities</p>
        <p className="mt-2 text-sm">
          {progress.requiredDone} of {progress.requiredTotal} complete
        </p>
        <div className={`${marriagePremium.progressTrack} mt-3`}>
          <div
            className={marriagePremium.progressFill}
            style={{
              width: `${progress.requiredTotal ? (progress.requiredDone / progress.requiredTotal) * 100 : 0}%`,
            }}
          />
        </div>
        {progress.canSubmit ? (
          <p className="mt-3 text-sm text-emerald-900 dark:text-emerald-200">
            All required activities are complete. You can submit now or explore additional optional questions.
          </p>
        ) : (
          <p className="mt-3 text-sm text-amber-900 dark:text-amber-200">
            Finish required lessons marked in the module list before submitting.
          </p>
        )}
      </div>

      <div className={`${marriagePremium.card} mt-4`}>
        <p className="font-semibold">Optional reflection</p>
        <p className={`${marriagePremium.cardMuted} mt-1 text-sm`}>
          {progress.optionalDone} of {progress.optionalTotal} answered — optional items never block submit.
        </p>
      </div>

      {error && <p className="mt-3 text-sm text-red-800">{error}</p>}

      <button
        type="button"
        data-testid="marriage-module-submit-confirm"
        className={`${marriagePremium.primaryCta} mt-6 w-full`}
        disabled={!progress.canSubmit || submitting}
        onClick={() => void submit()}
      >
        {submitting ? "Submitting…" : "Submit module for my partner"}
      </button>
    </div>
  );
}
