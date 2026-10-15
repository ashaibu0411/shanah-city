"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { marriagePremium } from "@/components/marriage/marriage-counseling-premium";
import type { MarriageStage2Dashboard } from "@/lib/marriage-counseling-types";
import { readJsonResponse } from "@/lib/read-json-response";

const SECTION_ICONS: Record<string, string> = {
  journey: "◎",
  discover: "✦",
  talk: "💬",
  scenarios: "▶",
  agreements: "✓",
  growth: "↑",
  counselor: "❤",
};

export function MarriageCouplesLearningCenter() {
  const [dash, setDash] = useState<MarriageStage2Dashboard | null>(null);
  const [error, setError] = useState("");
  const [openSection, setOpenSection] = useState<string | null>("journey");

  const load = useCallback(async () => {
    const res = await fetch("/api/marriage/stage2", { cache: "no-store" });
    const data = await readJsonResponse<MarriageStage2Dashboard & { error?: string }>(res);
    if (!res.ok) setError(data.error ?? "Unable to load.");
    else setDash(data);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (error && !dash) {
    return (
      <div className={marriagePremium.card}>
        <p className="text-sm text-red-800">{error}</p>
        <Link href="/marriage" className={`${marriagePremium.secondaryCta} mt-4`}>
          Back
        </Link>
      </div>
    );
  }

  if (!dash) return <p className={marriagePremium.cardMuted}>Loading your learning center…</p>;

  const pct =
    dash.activitiesTotal > 0 ? Math.round((dash.modulesCompleted / dash.activitiesTotal) * 100) : 0;

  const activityByModule = new Map(dash.activities.map((a) => [a.moduleId, a]));

  return (
    <div className="pb-28" data-testid="marriage-learning-center">
      <Link href="/marriage" className="text-sm font-semibold text-clay-700">
        ← Marriage hub
      </Link>

      <header className={`${marriagePremium.hero} mt-4`}>
        <p className={marriagePremium.sectionLabel}>Couples learning center</p>
        <h1 className={marriagePremium.heroTitle}>
          {dash.partnerName ? `Growing together with ${dash.partnerName}` : "Your relationship journey"}
        </h1>
        <p className={marriagePremium.heroLead}>
          Learn → reflect → answer privately → compare safely → discuss → agree → review.
        </p>
      </header>

      <div className={`${marriagePremium.card} mt-6`}>
        <p className="font-semibold">Progress</p>
        <div
          className="mt-3 h-3 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="h-full rounded-full bg-clay-600 transition-all" style={{ width: `${pct}%` }} />
        </div>
        <p className={`${marriagePremium.cardMuted} mt-2 text-sm`}>
          {dash.modulesCompleted} activities submitted · {dash.assignmentsOpen} counselor tasks open
        </p>
        {dash.resumeModuleId && (
          <Link
            href={`/marriage/module/${dash.resumeModuleId}`}
            className={`${marriagePremium.primaryCta} mt-4 min-h-[44px]`}
          >
            Resume where you left off
          </Link>
        )}
      </div>

      {dash.nextSessionAt && (
        <div className={`${marriagePremium.card} mt-4`}>
          <p className="text-xs font-bold uppercase text-clay-800">Next counseling session</p>
          <p className="mt-1 text-sm font-semibold">
            {new Date(dash.nextSessionAt).toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        </div>
      )}

      <nav className="mt-8 space-y-2" aria-label="Learning sections">
        {dash.sections.map((section) => {
          const expanded = openSection === section.id;
          const modules = section.moduleIds
            .map((id) => activityByModule.get(id))
            .filter(Boolean);
          return (
            <div key={section.id} className={marriagePremium.card}>
              <button
                type="button"
                className="flex min-h-[44px] w-full items-start gap-3 text-left"
                aria-expanded={expanded}
                onClick={() => setOpenSection(expanded ? null : section.id)}
              >
                <span className="text-xl" aria-hidden>
                  {SECTION_ICONS[section.id] ?? "•"}
                </span>
                <span className="flex-1">
                  <span className="font-semibold">{section.title}</span>
                  <span className={`${marriagePremium.cardMuted} mt-0.5 block text-sm`}>
                    {section.description}
                  </span>
                </span>
              </button>
              {expanded && (
                <ul className="mt-3 space-y-2 border-t border-stone-200 pt-3 dark:border-stone-700">
                  {section.id === "journey" && (
                    <>
                      {dash.sharedGoals.slice(0, 5).map((g) => (
                        <li key={g.id} className="text-sm">
                          <span className="font-medium">Goal:</span> {g.title}
                        </li>
                      ))}
                      {dash.actionPlans.slice(0, 3).map((p) => (
                        <li key={p.id} className="text-sm">
                          <span className="font-medium">Plan:</span> {p.title}{" "}
                          <span className="text-xs capitalize">({p.status})</span>
                        </li>
                      ))}
                      {dash.sharedGoals.length === 0 && dash.actionPlans.length === 0 && (
                        <li className={`${marriagePremium.cardMuted} text-sm`}>
                          Add goals from the Growth section as you complete activities.
                        </li>
                      )}
                    </>
                  )}
                  {modules.length === 0 && section.id !== "journey" && (
                    <li className={`${marriagePremium.cardMuted} text-sm`}>Activities coming in the next content drop.</li>
                  )}
                  {modules.map(
                    (act) =>
                      act && (
                        <li key={act.moduleId} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                          <Link href={`/marriage/module/${act.moduleId}`} className="font-medium text-clay-800 underline">
                            {act.title}
                          </Link>
                          <span className="text-xs text-night-500">
                            You: {act.myStatus.replace("_", " ")} · Partner: {act.partnerStatus.replace("_", " ")}
                            {act.comparisonReady && (
                              <>
                                {" · "}
                                <Link href={`/marriage/module/${act.moduleId}/compare`} className="font-bold">
                                  Compare
                                </Link>
                              </>
                            )}
                          </span>
                        </li>
                      ),
                  )}
                  {section.id === "counselor" && (
                    <li>
                      <Link href="/marriage/counselor" className={`${marriagePremium.secondaryCta} text-sm`}>
                        Counselor workspace
                      </Link>
                    </li>
                  )}
                </ul>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
}
