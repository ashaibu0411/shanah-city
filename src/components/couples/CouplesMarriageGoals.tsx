"use client";

import { useCallback, useEffect, useState } from "react";
import { CouplesHubTabRow } from "@/components/couples/CouplesHubTabRow";
import { CouplesLinkGate } from "@/components/couples/CouplesLinkGate";
import { CouplesSubpageHeader } from "@/components/couples/CouplesSubpageHeader";
import { couplesHubPremium } from "@/components/couples/couples-hub-premium";
import { Button } from "@/components/ui";
import {
  MARRIAGE_GOAL_CATEGORIES,
  type CoupleMarriageGoalRecord,
  type MarriageGoalCategory,
} from "@/lib/couple-marriage-goal-types";
import type { CouplesHubOverview } from "@/lib/couples-hub-types";

function categoryLabel(id: MarriageGoalCategory) {
  return MARRIAGE_GOAL_CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

export function CouplesMarriageGoals() {
  const [hub, setHub] = useState<CouplesHubOverview | null>(null);
  const [goals, setGoals] = useState<CoupleMarriageGoalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [listTab, setListTab] = useState<"active" | "completed">("active");
  const [composerOpen, setComposerOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<MarriageGoalCategory>("spiritual");
  const [targetDate, setTargetDate] = useState("");
  const [milestoneText, setMilestoneText] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const locked = !hub?.hasActiveLink;

  const visibleGoals = goals.filter((goal) =>
    listTab === "completed" ? goal.progress >= 100 : goal.progress < 100,
  );

  const loadHub = useCallback(() => {
    return fetch("/api/couples/hub")
      .then(async (response) => {
        const data = await response.json();
        if (response.ok) setHub(data.overview ?? null);
      })
      .catch(() => undefined);
  }, []);

  const loadGoals = useCallback(() => {
    setLoading(true);
    setError(null);
    return fetch("/api/couples/goals")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Could not load goals.");
        setGoals(Array.isArray(data.goals) ? data.goals : []);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Could not load goals.");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    void loadHub();
  }, [loadHub]);

  useEffect(() => {
    if (!locked) void loadGoals();
  }, [loadGoals, locked]);

  async function createGoal() {
    setBusy(true);
    setStatus(null);
    const milestones = milestoneText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line, index) => ({
        id: `ms-new-${index}`,
        title: line,
        done: false,
      }));

    const response = await fetch("/api/couples/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create",
        title,
        category,
        targetDate: targetDate || undefined,
        milestones,
      }),
    });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) {
      setStatus(data.error ?? "Could not create goal.");
      return;
    }
    setGoals(Array.isArray(data.goals) ? data.goals : []);
    setTitle("");
    setMilestoneText("");
    setTargetDate("");
    setComposerOpen(false);
    setStatus("Goal created.");
  }

  async function toggleMilestone(goalId: string, milestoneId: string) {
    setBusy(true);
    const response = await fetch("/api/couples/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "toggleMilestone", goalId, milestoneId }),
    });
    const data = await response.json();
    setBusy(false);
    if (response.ok) setGoals(Array.isArray(data.goals) ? data.goals : []);
  }

  async function removeGoal(goalId: string) {
    if (!window.confirm("Remove this shared goal?")) return;
    setBusy(true);
    const response = await fetch("/api/couples/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", goalId }),
    });
    const data = await response.json();
    setBusy(false);
    if (response.ok) setGoals(Array.isArray(data.goals) ? data.goals : []);
  }

  return (
    <div className={couplesHubPremium.page}>
      <div className={couplesHubPremium.inset}>
        <CouplesSubpageHeader
          title="Our goals"
          subtitle="Spiritual, financial, family, and enrichment milestones you build together."
        />

        {locked ? (
          <div className="mt-6">
            <CouplesLinkGate pendingIncoming={hub?.pendingIncomingInvite} />
          </div>
        ) : (
          <>
            <div className="mt-4 space-y-3">
              <CouplesHubTabRow
                tabs={[
                  { id: "active", label: "Active" },
                  { id: "completed", label: "Completed" },
                ]}
                active={listTab}
                onChange={setListTab}
              />
              <Button onClick={() => setComposerOpen(true)} disabled={busy} className="w-full">
                + Add a new goal
              </Button>
            </div>

            {error ? (
              <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
            ) : loading ? (
              <p className="mt-8 text-center text-sm text-night-500">Loading…</p>
            ) : visibleGoals.length === 0 ? (
              <p className="mt-8 rounded-xl border border-dashed border-night-900/15 px-4 py-8 text-center text-sm text-night-600">
                Set your first goal as a couple.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {visibleGoals.map((goal) => (
                  <li key={goal.id} className={couplesHubPremium.card}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold uppercase text-night-500">
                          {categoryLabel(goal.category)}
                          {goal.targetDate ? ` · Target ${goal.targetDate}` : ""}
                        </p>
                        <p className="mt-1 font-semibold text-night-950 dark:text-sand-100">{goal.title}</p>
                        <div className={`${couplesHubPremium.progressTrack} mt-3`}>
                          <div
                            className={couplesHubPremium.progressFill}
                            style={{ width: `${Math.min(100, goal.progress)}%` }}
                          />
                        </div>
                        <p className="mt-1 text-xs text-night-500">{goal.progress}% complete</p>
                        {goal.milestones.length > 0 ? (
                          <ul className="mt-3 space-y-2">
                            {goal.milestones.map((milestone) => (
                              <li key={milestone.id} className="flex items-center gap-2 text-sm">
                                <input
                                  type="checkbox"
                                  checked={milestone.done}
                                  disabled={busy}
                                  onChange={() => void toggleMilestone(goal.id, milestone.id)}
                                />
                                <span
                                  className={
                                    milestone.done ? "text-night-500 line-through" : "text-night-800"
                                  }
                                >
                                  {milestone.title}
                                </span>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="mt-3 text-xs font-semibold text-night-600 underline-offset-2 hover:underline"
                      onClick={() => void removeGoal(goal.id)}
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {status ? (
              <p className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{status}</p>
            ) : null}
          </>
        )}

        {composerOpen && !locked ? (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-night-950/40 p-4 sm:items-center">
            <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-white/10 bg-[var(--couples-surface)] p-5 shadow-xl">
              <h2 className="font-display text-lg font-semibold">New shared goal</h2>
              <label className="mt-4 block text-sm">
                <span className="font-semibold">Title</span>
                <input
                  className="mt-1 w-full rounded-xl border border-night-900/10 px-3 py-2.5 text-sm"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </label>
              <label className="mt-3 block text-sm">
                <span className="font-semibold">Category</span>
                <select
                  className="mt-1 w-full rounded-xl border border-night-900/10 px-3 py-2.5 text-sm"
                  value={category}
                  onChange={(event) => setCategory(event.target.value as MarriageGoalCategory)}
                >
                  {MARRIAGE_GOAL_CATEGORIES.map((entry) => (
                    <option key={entry.id} value={entry.id}>{entry.label}</option>
                  ))}
                </select>
              </label>
              <label className="mt-3 block text-sm">
                <span className="font-semibold">Target date (optional)</span>
                <input
                  type="date"
                  className="mt-1 w-full rounded-xl border border-night-900/10 px-3 py-2.5 text-sm"
                  value={targetDate}
                  onChange={(event) => setTargetDate(event.target.value)}
                />
              </label>
              <label className="mt-3 block text-sm">
                <span className="font-semibold">Milestones (one per line)</span>
                <textarea
                  rows={4}
                  className="mt-1 w-full rounded-xl border border-night-900/10 px-3 py-2.5 text-sm"
                  value={milestoneText}
                  onChange={(event) => setMilestoneText(event.target.value)}
                  placeholder="Complete budget review&#10;Schedule date night"
                />
              </label>
              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <Button className="flex-1" disabled={busy} onClick={() => void createGoal()}>
                  Create
                </Button>
                <Button variant="secondary" className="flex-1" onClick={() => setComposerOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        ) : null}

      </div>
    </div>
  );
}
