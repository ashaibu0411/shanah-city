"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CouplesLinkGate } from "@/components/couples/CouplesLinkGate";
import {
  CouplesLoadingSkeleton,
  CouplesPrimaryButton,
  CouplesSecondaryButton,
} from "@/components/couples/design-system";
import { couplesHubPremium } from "@/components/couples/couples-hub-premium";
import {
  formatGoalHistoryDate,
  formatGoalTargetDate,
  goalProgressHistory,
  GOAL_CATEGORY_ICON_RING,
  GOAL_CATEGORY_PROGRESS,
  MARRIAGE_GOAL_DESIGN_PREVIEWS,
  MarriageGoalCategoryIcon,
  type GoalsListTab,
  type GoalPreviewCard,
} from "@/lib/couple-marriage-goal-ui";
import {
  MARRIAGE_GOAL_CATEGORIES,
  type CoupleMarriageGoalRecord,
  type MarriageGoalCategory,
} from "@/lib/couple-marriage-goal-types";
import type { CouplesHubOverview } from "@/lib/couples-hub-types";

function categoryLabel(id: MarriageGoalCategory) {
  return MARRIAGE_GOAL_CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

function TabSelector({ active, onChange }: { active: GoalsListTab; onChange: (tab: GoalsListTab) => void }) {
  const tabs: { id: GoalsListTab; label: string }[] = [
    { id: "active", label: "Active" },
    { id: "completed", label: "Completed" },
  ];
  return (
    <div
      className="flex rounded-full bg-[var(--couples-gold-light)]/55 p-1 ring-1 ring-[var(--couples-border)]"
      role="tablist"
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex-1 rounded-full px-3 py-2.5 text-center text-sm font-semibold transition motion-reduce:transition-none ${
            active === tab.id
              ? "bg-[var(--couples-surface)] text-[var(--couples-text)] shadow-sm"
              : "text-[var(--couples-muted)]"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function GoalCard({
  goal,
  preview,
  onClick,
}: {
  goal: CoupleMarriageGoalRecord | GoalPreviewCard;
  preview?: boolean;
  onClick?: () => void;
}) {
  const progress = Math.min(100, Math.max(0, goal.progress));
  const body = (
    <>
      <div className="flex items-start gap-3">
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1 ${GOAL_CATEGORY_ICON_RING[goal.category]}`}
          aria-hidden
        >
          <MarriageGoalCategoryIcon category={goal.category} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-[var(--couples-text)]">{goal.title}</p>
            {preview ? (
              <span className="rounded-full bg-[var(--couples-gold-light)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--couples-mocha)]">
                Preview
              </span>
            ) : null}
          </div>
          {"description" in goal && goal.description ? (
            <p className="mt-1 text-sm text-[var(--couples-muted)]">{goal.description}</p>
          ) : null}
          {goal.targetDate ? (
            <p className="mt-1 text-xs text-[var(--couples-muted)]">
              Target {formatGoalTargetDate(goal.targetDate)}
            </p>
          ) : null}
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--couples-ivory)] ring-1 ring-[var(--couples-border)]">
            <div
              className={`h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none ${GOAL_CATEGORY_PROGRESS[goal.category]}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-1.5 text-right text-xs font-semibold text-[var(--couples-muted)]">{progress}%</p>
        </div>
      </div>
    </>
  );

  if (preview || !onClick) {
    return (
      <li className="rounded-2xl bg-white/70 p-4 ring-1 ring-dashed ring-[var(--couples-border)] opacity-90">
        {body}
      </li>
    );
  }

  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="w-full rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-[var(--couples-border)] transition active:scale-[0.99]"
      >
        {body}
        <span className="mt-2 block text-right text-lg text-[var(--couples-muted)]" aria-hidden>›</span>
      </button>
    </li>
  );
}

export function CouplesMarriageGoals() {
  const [hub, setHub] = useState<CouplesHubOverview | null>(null);
  const [goals, setGoals] = useState<CoupleMarriageGoalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [listTab, setListTab] = useState<GoalsListTab>("active");
  const [composerOpen, setComposerOpen] = useState(false);
  const [detailGoal, setDetailGoal] = useState<CoupleMarriageGoalRecord | null>(null);
  const [editMode, setEditMode] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<MarriageGoalCategory>("spiritual");
  const [targetDate, setTargetDate] = useState("");
  const [milestoneText, setMilestoneText] = useState("");
  const [notes, setNotes] = useState("");

  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const locked = !hub?.hasActiveLink;

  const visibleGoals = useMemo(
    () =>
      goals.filter((goal) => (listTab === "completed" ? goal.progress >= 100 : goal.progress < 100)),
    [goals, listTab],
  );

  const showPreviews = !loading && visibleGoals.length === 0 && listTab === "active";

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

  function syncDetailFromList(next: CoupleMarriageGoalRecord[]) {
    if (detailGoal) {
      const fresh = next.find((g) => g.id === detailGoal.id);
      setDetailGoal(fresh ?? null);
    }
  }

  function resetComposer() {
    setTitle("");
    setDescription("");
    setCategory("spiritual");
    setTargetDate("");
    setMilestoneText("");
    setStatus(null);
  }

  function openCreate() {
    resetComposer();
    setComposerOpen(true);
  }

  async function createGoal() {
    setBusy(true);
    setStatus(null);
    const milestones = milestoneText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line, index) => ({
        id: `ms-new-${index}-${Date.now()}`,
        title: line,
        done: false,
      }));

    const response = await fetch("/api/couples/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create",
        title,
        description,
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
    const next = Array.isArray(data.goals) ? data.goals : [];
    setGoals(next);
    setComposerOpen(false);
    resetComposer();
  }

  async function saveGoalEdits() {
    if (!detailGoal) return;
    setBusy(true);
    setStatus(null);
    const response = await fetch("/api/couples/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update",
        goalId: detailGoal.id,
        title,
        description: notes || description,
        category,
        targetDate: targetDate || null,
        milestones: detailGoal.milestones,
      }),
    });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) {
      setStatus(data.error ?? "Could not save.");
      return;
    }
    const next = Array.isArray(data.goals) ? data.goals : [];
    setGoals(next);
    syncDetailFromList(next);
    setEditMode(false);
  }

  function openDetail(goal: CoupleMarriageGoalRecord) {
    setDetailGoal(goal);
    setEditMode(false);
    setTitle(goal.title);
    setDescription(goal.description ?? "");
    setNotes(goal.description ?? "");
    setCategory(goal.category);
    setTargetDate(goal.targetDate?.slice(0, 10) ?? "");
    setStatus(null);
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
    if (response.ok) {
      const next = Array.isArray(data.goals) ? data.goals : [];
      setGoals(next);
      syncDetailFromList(next);
    }
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
    if (response.ok) {
      setGoals(Array.isArray(data.goals) ? data.goals : []);
      setDetailGoal(null);
    }
  }

  return (
    <div className={`${couplesHubPremium.page} couples-hub-typography min-h-full`}>
      <div className="mx-auto flex min-h-full w-full max-w-lg flex-col">
        <header
          className="sticky top-0 z-20 flex min-h-[3.25rem] shrink-0 items-center gap-2 bg-[var(--couples-midnight)] px-[var(--couples-page-padding)] py-3 text-white safe-top"
        >
          <Link
            href="/couples/marriage"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-2xl font-light transition hover:bg-white/10 active:scale-95"
            aria-label="Back to Our Marriage"
          >
            ‹
          </Link>
          <h1
            className="min-w-0 flex-1 truncate text-center font-[family-name:var(--font-couples-display)] text-[1.05rem] font-semibold tracking-tight"
          >
            Our Goals
          </h1>
          <span className="h-11 w-11 shrink-0" aria-hidden />
        </header>

        <main className="flex flex-1 flex-col px-[var(--couples-page-padding)] pb-6 pt-4">
          {locked ? (
            <CouplesLinkGate pendingIncoming={hub?.pendingIncomingInvite} />
          ) : (
            <>
              <TabSelector active={listTab} onChange={setListTab} />

              {error ? <p className={`mt-4 ${couplesHubPremium.sheetStatusError}`}>{error}</p> : null}

              {loading ? (
                <div className="mt-5">
                  <CouplesLoadingSkeleton rows={3} />
                </div>
              ) : visibleGoals.length === 0 && listTab === "completed" ? (
                <div className="mt-8 rounded-2xl bg-white/90 p-6 text-center ring-1 ring-[var(--couples-border)]">
                  <p className="font-[family-name:var(--font-couples-display)] text-lg text-[var(--couples-text)]">
                    No completed goals yet
                  </p>
                  <p className="mt-2 text-sm text-[var(--couples-muted)]">
                    Celebrate progress here when you reach 100%.
                  </p>
                </div>
              ) : (
                <ul className="mt-5 space-y-3">
                  {visibleGoals.map((goal) => (
                    <GoalCard key={goal.id} goal={goal} onClick={() => openDetail(goal)} />
                  ))}
                </ul>
              )}

              {showPreviews ? (
                <section className="mt-8" aria-labelledby="goal-preview-heading">
                  <h2
                    id="goal-preview-heading"
                    className="text-xs font-semibold uppercase tracking-wide text-[var(--couples-muted)]"
                  >
                    Design preview — example goals (not saved)
                  </h2>
                  <ul className="mt-3 space-y-3">
                    {MARRIAGE_GOAL_DESIGN_PREVIEWS.map((preview) => (
                      <GoalCard key={preview.id} goal={preview} preview />
                    ))}
                  </ul>
                </section>
              ) : null}

              <button
                type="button"
                className="couples-goals-add-btn mt-6 w-full rounded-[var(--couples-radius-button)] bg-[var(--couples-mocha)] px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-105 active:scale-[0.99] motion-reduce:transition-none"
                onClick={openCreate}
                disabled={busy}
              >
                + Add a New Goal
              </button>
            </>
          )}
        </main>
      </div>

      {composerOpen && !locked ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <GoalFormSheet
            title="New shared goal"
            busy={busy}
            status={status}
            fields={{ title, description, category, targetDate, milestoneText }}
            onTitle={setTitle}
            onDescription={setDescription}
            onCategory={setCategory}
            onTargetDate={setTargetDate}
            onMilestones={setMilestoneText}
            onClose={() => setComposerOpen(false)}
            onSave={() => void createGoal()}
            showMilestones
          />
        </div>
      ) : null}

      {detailGoal && !locked ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <div
            className={`${couplesHubPremium.sheetModal} max-h-[92vh] w-full max-w-lg overflow-y-auto`}
            role="dialog"
            aria-labelledby="goal-detail-title"
          >
            {editMode ? (
              <GoalFormSheet
                embedded
                title="Edit goal"
                busy={busy}
                status={status}
                fields={{ title, description: notes, category, targetDate, milestoneText: "" }}
                onTitle={setTitle}
                onDescription={setNotes}
                onCategory={setCategory}
                onTargetDate={setTargetDate}
                onMilestones={() => undefined}
                onClose={() => setEditMode(false)}
                onSave={() => void saveGoalEdits()}
                showMilestones={false}
              />
            ) : (
              <>
                <div className="flex items-start gap-3">
                  <span
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1 ${GOAL_CATEGORY_ICON_RING[detailGoal.category]}`}
                  >
                    <MarriageGoalCategoryIcon category={detailGoal.category} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2
                      id="goal-detail-title"
                      className="font-[family-name:var(--font-couples-display)] text-xl font-semibold text-[var(--couples-text)]"
                    >
                      {detailGoal.title}
                    </h2>
                    <p className="text-sm text-[var(--couples-muted)]">{categoryLabel(detailGoal.category)}</p>
                  </div>
                  <button
                    type="button"
                    className="text-2xl font-light text-[var(--couples-muted)]"
                    onClick={() => setDetailGoal(null)}
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>

                {detailGoal.description ? (
                  <div className="mt-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--couples-muted)]">
                      Description
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--couples-text)]">{detailGoal.description}</p>
                  </div>
                ) : null}

                {detailGoal.targetDate ? (
                  <p className="mt-3 text-sm text-[var(--couples-muted)]">
                    Target date: {formatGoalTargetDate(detailGoal.targetDate)}
                  </p>
                ) : null}

                <div className="mt-5">
                  <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-[var(--couples-muted)]">
                    <span>Progress</span>
                    <span>{detailGoal.progress}%</span>
                  </div>
                  <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[var(--couples-ivory)] ring-1 ring-[var(--couples-border)]">
                    <div
                      className={`h-full rounded-full ${GOAL_CATEGORY_PROGRESS[detailGoal.category]}`}
                      style={{ width: `${Math.min(100, detailGoal.progress)}%` }}
                    />
                  </div>
                </div>

                {detailGoal.milestones.length > 0 ? (
                  <div className="mt-6">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--couples-muted)]">
                      Milestones
                    </h3>
                    <ul className="mt-3 space-y-2">
                      {detailGoal.milestones.map((milestone) => (
                        <li key={milestone.id}>
                          <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-[var(--couples-ivory)] px-3 py-2.5 ring-1 ring-[var(--couples-border)]">
                            <input
                              type="checkbox"
                              className="mt-1"
                              checked={milestone.done}
                              disabled={busy}
                              onChange={() => void toggleMilestone(detailGoal.id, milestone.id)}
                            />
                            <span
                              className={`text-sm ${
                                milestone.done
                                  ? "text-[var(--couples-muted)] line-through"
                                  : "text-[var(--couples-text)]"
                              }`}
                            >
                              {milestone.title}
                            </span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div className="mt-6">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--couples-muted)]">
                    Progress history
                  </h3>
                  <ul className="mt-3 space-y-2">
                    {goalProgressHistory(detailGoal).map((event, index) => (
                      <li
                        key={`${event.date}-${index}`}
                        className="flex items-center justify-between rounded-xl bg-white px-3 py-2 ring-1 ring-[var(--couples-border)]"
                      >
                        <span className="text-sm text-[var(--couples-text)]">{event.label}</span>
                        <span className="text-xs text-[var(--couples-muted)]">
                          {formatGoalHistoryDate(event.date)} · {event.progress}%
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 flex flex-col gap-2">
                  <CouplesSecondaryButton onClick={() => setEditMode(true)}>Edit goal</CouplesSecondaryButton>
                  <button
                    type="button"
                    className="text-sm font-semibold text-red-700/90"
                    onClick={() => void removeGoal(detailGoal.id)}
                  >
                    Remove goal
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function GoalFormSheet({
  embedded,
  title,
  busy,
  status,
  fields,
  onTitle,
  onDescription,
  onCategory,
  onTargetDate,
  onMilestones,
  onClose,
  onSave,
  showMilestones,
}: {
  embedded?: boolean;
  title: string;
  busy: boolean;
  status: string | null;
  fields: {
    title: string;
    description: string;
    category: MarriageGoalCategory;
    targetDate: string;
    milestoneText: string;
  };
  onTitle: (v: string) => void;
  onDescription: (v: string) => void;
  onCategory: (v: MarriageGoalCategory) => void;
  onTargetDate: (v: string) => void;
  onMilestones: (v: string) => void;
  onClose: () => void;
  onSave: () => void;
  showMilestones: boolean;
}) {
  return (
    <div className={embedded ? "" : `${couplesHubPremium.sheetModal} w-full max-w-lg`}>
      {!embedded ? (
        <div className="flex items-center justify-between">
          <h2 className="font-[family-name:var(--font-couples-display)] text-lg font-semibold text-[var(--couples-text)]">
            {title}
          </h2>
          <button type="button" className="text-2xl font-light text-[var(--couples-muted)]" onClick={onClose}>
            ×
          </button>
        </div>
      ) : (
        <h2 className="font-[family-name:var(--font-couples-display)] text-lg font-semibold text-[var(--couples-text)]">
          {title}
        </h2>
      )}

      <label className="mt-4 block text-sm">
        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--couples-muted)]">Goal title</span>
        <input
          className={`mt-1.5 ${couplesHubPremium.sheetInput}`}
          value={fields.title}
          onChange={(e) => onTitle(e.target.value)}
        />
      </label>

      <label className="mt-4 block text-sm">
        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--couples-muted)]">
          {embedded ? "Notes" : "Short description"}
        </span>
        <textarea
          rows={3}
          className={`mt-1.5 ${couplesHubPremium.sheetInput}`}
          value={fields.description}
          onChange={(e) => onDescription(e.target.value)}
          placeholder={embedded ? "Reflections, next steps, or encouragement…" : "What does success look like?"}
        />
      </label>

      <label className="mt-4 block text-sm">
        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--couples-muted)]">Category</span>
        <select
          className={`mt-1.5 ${couplesHubPremium.sheetInput}`}
          value={fields.category}
          onChange={(e) => onCategory(e.target.value as MarriageGoalCategory)}
        >
          {MARRIAGE_GOAL_CATEGORIES.map((entry) => (
            <option key={entry.id} value={entry.id}>{entry.label}</option>
          ))}
        </select>
      </label>

      <label className="mt-4 block text-sm">
        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--couples-muted)]">
          Target date (optional)
        </span>
        <input
          type="date"
          className={`mt-1.5 ${couplesHubPremium.sheetInput}`}
          value={fields.targetDate}
          onChange={(e) => onTargetDate(e.target.value)}
        />
      </label>

      {showMilestones ? (
        <label className="mt-4 block text-sm">
          <span className="text-xs font-semibold uppercase tracking-wide text-[var(--couples-muted)]">
            Milestones (one per line)
          </span>
          <textarea
            rows={4}
            className={`mt-1.5 ${couplesHubPremium.sheetInput}`}
            value={fields.milestoneText}
            onChange={(e) => onMilestones(e.target.value)}
            placeholder="Pick a weekly check-in time&#10;Finish first chapter together"
          />
        </label>
      ) : null}

      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <CouplesPrimaryButton className="flex-1" disabled={busy} onClick={onSave}>
          Save
        </CouplesPrimaryButton>
        <CouplesSecondaryButton className="flex-1" onClick={onClose}>
          Cancel
        </CouplesSecondaryButton>
      </div>

      {status ? <p className={`mt-3 text-sm ${couplesHubPremium.sheetStatusError}`}>{status}</p> : null}
    </div>
  );
}
