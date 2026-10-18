"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { marriagePremium } from "@/components/marriage/marriage-counseling-premium";
import type { MarriageStage2Dashboard } from "@/lib/marriage-counseling-types";
import { readJsonResponse } from "@/lib/read-json-response";
import { MarriageTemperamentSnapshotView } from "@/components/marriage/MarriageTemperamentSnapshotView";
import type { TemperamentSnapshotSection } from "@/lib/marriage-stage2-temperament-scoring-v2";

const CATEGORY_LABELS: Record<string, string> = {
  learning: "Reflection",
  temperament: "Temperament",
  financial: "Financial",
  scenario: "Scenarios",
};

export function MarriageStage2LearningCenter() {
  const [dash, setDash] = useState<MarriageStage2Dashboard | null>(null);
  const [error, setError] = useState("");
  const [goalTitle, setGoalTitle] = useState("");
  const [temperament, setTemperament] = useState<{
    scoringModelVersion?: string;
    sections?: TemperamentSnapshotSection[];
    disclaimer: string;
  } | null>(null);

  const load = useCallback(async () => {
    setError("");
    const res = await fetch("/api/marriage/stage2", { cache: "no-store" });
    const data = await readJsonResponse<MarriageStage2Dashboard & { error?: string }>(res);
    if (!res.ok) {
      setError(data.error ?? "Learning center unavailable.");
      return;
    }
    setDash(data);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function loadTemperament() {
    const res = await fetch("/api/marriage/stage2?view=temperament", { cache: "no-store" });
    const data = await readJsonResponse<typeof temperament & { error?: string }>(res);
    if (!res.ok) setError(data.error ?? "Insights not ready yet.");
    else setTemperament(data as NonNullable<typeof temperament>);
  }

  async function addGoal(e: React.FormEvent) {
    e.preventDefault();
    if (!goalTitle.trim()) return;
    const res = await fetch("/api/marriage/stage2", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create_goal", title: goalTitle, category: "communication" }),
    });
    if (!res.ok) {
      const data = await readJsonResponse<{ error?: string }>(res);
      setError(data.error ?? "Could not save goal.");
      return;
    }
    setGoalTitle("");
    await load();
  }

  if (error && !dash) {
    return (
      <div className={marriagePremium.card}>
        <p className="text-sm text-red-800">{error}</p>
        <Link href="/marriage" className={`${marriagePremium.secondaryCta} mt-4`}>
          Back to hub
        </Link>
      </div>
    );
  }

  if (!dash) return <p className={marriagePremium.cardMuted}>Loading learning center…</p>;

  const pct =
    dash.activitiesTotal > 0
      ? Math.round((dash.modulesCompleted / dash.activitiesTotal) * 100)
      : 0;

  return (
    <div className="pb-24">
      <Link href="/marriage" className="text-sm font-semibold text-clay-700">
        ← Marriage hub
      </Link>
      <h1 className="mt-2 font-display text-2xl font-semibold">Couples learning center</h1>
      <p className={marriagePremium.cardMuted}>
        Work independently, then compare together. Private financial answers stay yours unless you choose to share in a
        shared question.
      </p>

      {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}

      <div className={`${marriagePremium.card} mt-6`}>
        <p className="font-semibold">Your progress</p>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-stone-200" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full rounded-full bg-clay-600 transition-all" style={{ width: `${pct}%` }} />
        </div>
        <p className={`${marriagePremium.cardMuted} mt-2 text-sm`}>
          {dash.modulesCompleted} of {dash.activitiesTotal} activities submitted · {dash.assignmentsOpen} counselor
          assignments open
        </p>
        {dash.resumeModuleId && (
          <Link href={`/marriage/module/${dash.resumeModuleId}`} className={`${marriagePremium.primaryCta} mt-4 min-h-[44px]`}>
            Resume where you left off
          </Link>
        )}
      </div>

      <div className="mt-6">
        <p className={marriagePremium.sectionLabel}>Guided activities</p>
        <ul className="mt-3 space-y-2">
          {dash.activities.map((act) => (
            <li key={act.activityId} className={marriagePremium.moduleRow}>
              <Link href={`/marriage/module/${act.moduleId}`} className="min-w-0 flex-1">
                <span className="text-xs font-bold uppercase text-clay-700">
                  {CATEGORY_LABELS[act.category] ?? act.category}
                </span>
                <p className="font-semibold">{act.title}</p>
                <p className={`${marriagePremium.cardMuted} text-xs`}>{act.summary}</p>
              </Link>
              <div className="text-right text-xs">
                <p>You: {act.myStatus.replace("_", " ")}</p>
                <p>Partner: {act.partnerStatus.replace("_", " ")}</p>
                {act.comparisonReady && (
                  <Link href={`/marriage/module/${act.moduleId}/compare`} className="font-bold text-clay-700 underline">
                    Compare
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className={`${marriagePremium.card} mt-6`}>
        <p className="font-semibold">Temperament insights</p>
        <p className={`${marriagePremium.cardMuted} text-sm`}>
          Available after you both submit the temperament activity — descriptive, not diagnostic.
        </p>
        <button type="button" className={`${marriagePremium.secondaryCta} mt-3 min-h-[44px]`} onClick={() => void loadTemperament()}>
          View side-by-side insights
        </button>
        {temperament?.sections?.length ? (
          <div className="mt-4">
            <MarriageTemperamentSnapshotView
              sections={temperament.sections}
              disclaimer={temperament.disclaimer}
              scoringModelVersion={temperament.scoringModelVersion ?? "temperament-scoring/2.0.0"}
            />
          </div>
        ) : null}
      </div>

      <div className={`${marriagePremium.card} mt-6`}>
        <p className="font-semibold">Shared goals</p>
        <form onSubmit={addGoal} className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            className="min-h-[44px] flex-1 rounded-xl border px-3 text-sm"
            placeholder="e.g. Weekly date night"
            value={goalTitle}
            onChange={(e) => setGoalTitle(e.target.value)}
            aria-label="New shared goal"
          />
          <button type="submit" className={`${marriagePremium.primaryCta} min-h-[44px]`}>
            Add goal
          </button>
        </form>
        <ul className="mt-3 space-y-2 text-sm">
          {dash.sharedGoals.map((g) => (
            <li key={g.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-stone-50 p-2">
              <span>{g.title}</span>
              {g.acknowledgedByUserIds.length < 2 && (
                <button
                  type="button"
                  className="text-xs font-bold text-clay-700 underline"
                  onClick={async () => {
                    await fetch("/api/marriage/stage2", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ action: "acknowledge_goal", goalId: g.id }),
                    });
                    await load();
                  }}
                >
                  Acknowledge
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>

      {dash.actionPlans.length > 0 && (
        <div className={`${marriagePremium.card} mt-6`}>
          <p className="font-semibold">Action plans</p>
          <ul className="mt-2 space-y-2 text-sm">
            {dash.actionPlans.map((p) => (
              <li key={p.id}>
                <p className="font-medium">{p.title}</p>
                <p className="text-xs capitalize text-night-500">{p.status}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
