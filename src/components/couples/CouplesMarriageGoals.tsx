"use client";

import { useCallback, useEffect, useState } from "react";
import { CouplesHubScreen } from "@/components/couples/CouplesHubScreen";
import { CouplesHubTabRow } from "@/components/couples/CouplesHubTabRow";
import { CouplesLinkGate } from "@/components/couples/CouplesLinkGate";
import { couplesHubPremium } from "@/components/couples/couples-hub-premium";
import { GOAL_CATEGORY_META } from "@/lib/couples-hub-ui";
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
    <CouplesHubScreen title="Our goals">
        {locked ? (
          <CouplesLinkGate pendingIncoming={hub?.pendingIncomingInvite} />
        ) : (
          <>
            <CouplesHubTabRow
              variant="sheet"
              tabs={[
                { id: "active", label: "Active" },
                { id: "completed", label: "Completed" },
              ]}
              active={listTab}
              onChange={setListTab}
            />

            {error ? (
              <p className={couplesHubPremium.sheetStatusError}>{error}</p>
            ) : loading ? (
              <p className="mt-8 text-center text-sm text-[var(--couples-sheet-muted)]">Loading…</p>
            ) : visibleGoals.length === 0 ? (
              <p className={`${couplesHubPremium.sheetStatusInfo} mt-8`}>
                Set your first goal as a couple.
              </p>
            ) : (
              <ul className="mt-5 space-y-4">
                {visibleGoals.map((goal) => {
                  const meta = GOAL_CATEGORY_META[goal.category];
                  return (
                  <li key={goal.id} className={couplesHubPremium.sheetCard}>
                    <div className="flex items-start gap-3">
                      <span className={`${couplesHubPremium.iconCircle} ${meta.circle}`} aria-hidden>
                        {meta.emoji}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-stone-900">{goal.title}</p>
                        <p className="text-xs text-[var(--couples-sheet-muted)]">
                          {categoryLabel(goal.category)}
                          {goal.targetDate ? ` · Target ${goal.targetDate}` : ""}
                        </p>
                        <div className={`${couplesHubPremium.sheetProgressTrack} mt-3`}>
                          <div
                            className={couplesHubPremium.sheetProgressFill}
                            style={{ width: `${Math.min(100, goal.progress)}%` }}
                          />
                        </div>
                        <p className="mt-1 text-right text-xs font-semibold text-[var(--couples-sheet-muted)]">
                          {goal.progress}%
                        </p>
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
                                    milestone.done
                                      ? "text-[var(--couples-sheet-muted)] line-through"
                                      : "text-stone-800"
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
                      className="mt-3 text-xs font-semibold text-red-600 underline-offset-2 hover:underline"
                      onClick={() => void removeGoal(goal.id)}
                    >
                      Delete
                    </button>
                  </li>
                  );
                })}
              </ul>
            )}

            <button
              type="button"
              className={`${couplesHubPremium.sheetPrimaryCta} mt-6`}
              onClick={() => setComposerOpen(true)}
              disabled={busy}
            >
              + Add a new goal
            </button>

            {status ? (
              <p className={couplesHubPremium.sheetStatusOk}>{status}</p>
            ) : null}
          </>
        )}

        {composerOpen && !locked ? (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
            <div className={couplesHubPremium.sheetModal}>
              <h2 className="font-display text-lg font-semibold text-stone-900">New shared goal</h2>
              <label className="mt-4 block text-sm">
                <span className="font-semibold text-[var(--couples-sheet-muted)]">Title</span>
                <input
                  className={`mt-1 ${couplesHubPremium.sheetInput}`}
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </label>
              <label className="mt-3 block text-sm">
                <span className="font-semibold text-[var(--couples-sheet-muted)]">Category</span>
                <select
                  className={`mt-1 ${couplesHubPremium.sheetInput}`}
                  value={category}
                  onChange={(event) => setCategory(event.target.value as MarriageGoalCategory)}
                >
                  {MARRIAGE_GOAL_CATEGORIES.map((entry) => (
                    <option key={entry.id} value={entry.id}>{entry.label}</option>
                  ))}
                </select>
              </label>
              <label className="mt-3 block text-sm">
                <span className="font-semibold text-[var(--couples-sheet-muted)]">Target date (optional)</span>
                <input
                  type="date"
                  className={`mt-1 ${couplesHubPremium.sheetInput}`}
                  value={targetDate}
                  onChange={(event) => setTargetDate(event.target.value)}
                />
              </label>
              <label className="mt-3 block text-sm">
                <span className="font-semibold text-[var(--couples-sheet-muted)]">Milestones (one per line)</span>
                <textarea
                  rows={4}
                  className={`mt-1 ${couplesHubPremium.sheetInput}`}
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

    </CouplesHubScreen>
  );
}
