"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CouplesHubHero } from "@/components/couples/CouplesHubHero";
import { CouplesHubScreen } from "@/components/couples/CouplesHubScreen";
import { CouplesHubTabRow } from "@/components/couples/CouplesHubTabRow";
import { CouplesLinkGate } from "@/components/couples/CouplesLinkGate";
import { couplesHubPremium, COUPLES_DATE_NIGHT_HERO } from "@/components/couples/couples-hub-premium";
import { Button } from "@/components/ui";
import {
  DATE_NIGHT_BUDGETS,
  DATE_NIGHT_LOCATIONS,
  type CoupleDateNightPlanView,
  type DateNightBudget,
  type DateNightIdeaCatalogItem,
  type DateNightLocation,
} from "@/lib/couple-date-night-types";
import type { CouplesHubOverview } from "@/lib/couples-hub-types";

type TabId = "ideas" | "dates" | "history" | "challenge";

function formatScheduled(iso?: string) {
  if (!iso) return "Not scheduled";
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function budgetLabel(id?: string) {
  return DATE_NIGHT_BUDGETS.find((entry) => entry.id === id)?.label ?? "";
}

function locationLabel(id?: string) {
  return DATE_NIGHT_LOCATIONS.find((entry) => entry.id === id)?.label ?? "";
}

export function CouplesDateNight() {
  const [hub, setHub] = useState<CouplesHubOverview | null>(null);
  const [catalog, setCatalog] = useState<DateNightIdeaCatalogItem[]>([]);
  const [weeklyChallenge, setWeeklyChallenge] = useState("");
  const [upcoming, setUpcoming] = useState<CoupleDateNightPlanView[]>([]);
  const [favorites, setFavorites] = useState<CoupleDateNightPlanView[]>([]);
  const [history, setHistory] = useState<CoupleDateNightPlanView[]>([]);
  const [tab, setTab] = useState<TabId>("ideas");
  const [budgetFilter, setBudgetFilter] = useState<DateNightBudget | "all">("all");
  const [locationFilter, setLocationFilter] = useState<DateNightLocation | "all">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleTitle, setScheduleTitle] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("19:00");
  const [scheduleSurprise, setScheduleSurprise] = useState(false);
  const [addToCalendar, setAddToCalendar] = useState(true);
  const [catalogId, setCatalogId] = useState<string | undefined>();

  const locked = !hub?.hasActiveLink;

  const filteredCatalog = useMemo(() => {
    return catalog.filter((item) => {
      if (budgetFilter !== "all" && item.budget !== budgetFilter) return false;
      if (locationFilter !== "all" && item.locationType !== locationFilter) return false;
      return true;
    });
  }, [catalog, budgetFilter, locationFilter]);

  const loadHubMeta = useCallback(() => {
    return fetch("/api/couples/hub")
      .then(async (response) => {
        const data = await response.json();
        if (response.ok) setHub(data.overview ?? null);
      })
      .catch(() => undefined);
  }, []);

  const applyHubPayload = useCallback((data: Record<string, unknown>) => {
    setCatalog(Array.isArray(data.catalog) ? data.catalog : []);
    setWeeklyChallenge(String(data.weeklyChallenge ?? ""));
    setUpcoming(Array.isArray(data.upcoming) ? data.upcoming : []);
    setFavorites(Array.isArray(data.favorites) ? data.favorites : []);
    setHistory(Array.isArray(data.history) ? data.history : []);
  }, []);

  const loadPlanner = useCallback(() => {
    setLoading(true);
    setError(null);
    return fetch("/api/couples/date-night")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Could not load planner.");
        applyHubPayload(data);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Could not load planner.");
      })
      .finally(() => setLoading(false));
  }, [applyHubPayload]);

  useEffect(() => {
    void loadHubMeta();
  }, [loadHubMeta]);

  useEffect(() => {
    if (!locked) void loadPlanner();
  }, [loadPlanner, locked]);

  function openSchedule(item?: DateNightIdeaCatalogItem) {
    setCatalogId(item?.id);
    setScheduleTitle(item?.title ?? "");
    setScheduleDate("");
    setScheduleTime("19:00");
    setScheduleSurprise(false);
    setAddToCalendar(true);
    setScheduleOpen(true);
  }

  async function postAction(body: Record<string, unknown>) {
    setBusy(true);
    setStatus(null);
    const response = await fetch("/api/couples/date-night", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) {
      setStatus(data.error ?? "Something went wrong.");
      return false;
    }
    applyHubPayload(data);
    return true;
  }

  async function saveSchedule() {
    const ok = await postAction({
      action: "create",
      catalogId,
      title: scheduleTitle,
      dateKey: scheduleDate,
      time: scheduleTime,
      isSurprise: scheduleSurprise,
      addToCalendar: addToCalendar && !scheduleSurprise,
    });
    if (ok) {
      setScheduleOpen(false);
      setTab("dates");
      setStatus(scheduleSurprise ? "Surprise invite sent." : "Date scheduled.");
    }
  }

  async function saveFavorite(item: DateNightIdeaCatalogItem) {
    const ok = await postAction({
      action: "create",
      catalogId: item.id,
      title: item.title,
      asFavorite: true,
    });
    if (ok) setStatus("Saved to favorites.");
  }

  async function completePlan(plan: CoupleDateNightPlanView) {
    const ok = await postAction({ action: "update", planId: plan.id, status: "completed" });
    if (ok) {
      setTab("history");
      setStatus("Marked complete — nice work.");
    }
  }

  async function acceptSurprise(plan: CoupleDateNightPlanView) {
    const ok = await postAction({ action: "acceptSurprise", planId: plan.id });
    if (ok) setStatus(`Surprise revealed: ${plan.title}`);
  }

  async function removePlan(plan: CoupleDateNightPlanView) {
    if (!window.confirm("Remove this date from your planner?")) return;
    await postAction({ action: "delete", planId: plan.id });
  }

  function PlanCard({ plan }: { plan: CoupleDateNightPlanView }) {
    return (
      <li className="rounded-[1.25rem] border border-night-900/8 bg-white p-4 dark:border-white/10 dark:bg-[var(--color-surface)]">
        <p className="font-display text-base font-semibold text-night-950 dark:text-sand-100">
          {plan.displayTitle}
        </p>
        <p className="mt-1 text-sm text-night-600 dark:text-sand-400">
          {formatScheduled(plan.scheduledAt)}
          {plan.budget ? ` · ${budgetLabel(plan.budget)}` : ""}
          {plan.locationType ? ` · ${locationLabel(plan.locationType)}` : ""}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {plan.canAcceptSurprise ? (
            <Button
              className="!py-2 !text-xs"
              disabled={busy}
              onClick={() => void acceptSurprise(plan)}
            >
              Open surprise
            </Button>
          ) : null}
          {plan.status === "planned" ? (
            <button
              type="button"
              className="text-xs font-semibold text-emerald-800 underline-offset-2 hover:underline"
              onClick={() => void completePlan(plan)}
            >
              Mark done
            </button>
          ) : null}
          <button
            type="button"
            className="text-xs font-semibold text-night-600 underline-offset-2 hover:underline"
            onClick={() => void removePlan(plan)}
          >
            Remove
          </button>
        </div>
      </li>
    );
  }

  return (
    <CouplesHubScreen
      title="Date night"
      hero={
        <CouplesHubHero
          flush
          imageSrc={COUPLES_DATE_NIGHT_HERO}
          title="Make time for us"
          tagline="Create memories. Keep the spark alive."
        />
      }
    >

        {locked ? (
          <div className="mt-6">
            <CouplesLinkGate pendingIncoming={hub?.pendingIncomingInvite} />
          </div>
        ) : (
          <>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <CouplesHubTabRow
                variant="sheet"
                tabs={[
                  { id: "ideas", label: "Ideas" },
                  { id: "dates", label: "My dates" },
                  { id: "challenge", label: "Challenges" },
                ]}
                active={tab === "history" ? "dates" : tab}
                onChange={setTab}
              />
              <Button className="!py-2" onClick={() => openSchedule()} disabled={busy}>
                Plan a date
              </Button>
            </div>

            {error ? (
              <p className={couplesHubPremium.statusError}>{error}</p>
            ) : loading ? (
              <p className="mt-8 text-center text-sm text-[var(--couples-text-muted)]">Loading…</p>
            ) : tab === "ideas" ? (
              <div className="mt-4 space-y-4">
                <div className="flex flex-wrap gap-2">
                  <select
                    className={couplesHubPremium.input}
                    value={budgetFilter}
                    onChange={(event) =>
                      setBudgetFilter(event.target.value as DateNightBudget | "all")
                    }
                  >
                    <option value="all">All budgets</option>
                    {DATE_NIGHT_BUDGETS.map((entry) => (
                      <option key={entry.id} value={entry.id}>{entry.label}</option>
                    ))}
                  </select>
                  <select
                    className={couplesHubPremium.input}
                    value={locationFilter}
                    onChange={(event) =>
                      setLocationFilter(event.target.value as DateNightLocation | "all")
                    }
                  >
                    <option value="all">All settings</option>
                    {DATE_NIGHT_LOCATIONS.map((entry) => (
                      <option key={entry.id} value={entry.id}>{entry.label}</option>
                    ))}
                  </select>
                </div>
                <ul className="space-y-3">
                  {filteredCatalog.map((item) => (
                    <li key={item.id} className={couplesHubPremium.card}>
                      <div className="flex items-start gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-xl" aria-hidden>
                          💕
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-display font-semibold text-[var(--couples-text)]">
                            {item.title}
                          </p>
                          <p className="mt-1 text-sm text-[var(--couples-text-muted)]">{item.description}</p>
                          <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-[var(--couples-text-muted)]">
                            {budgetLabel(item.budget)} · {locationLabel(item.locationType)}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-3">
                            <button
                              type="button"
                              className="text-xs font-semibold text-[var(--couples-text)] underline-offset-2 hover:underline"
                              onClick={() => openSchedule(item)}
                            >
                              Schedule
                            </button>
                            <button
                              type="button"
                              className="text-xs font-semibold text-rose-300 underline-offset-2 hover:underline"
                              onClick={() => void saveFavorite(item)}
                            >
                              Save favorite
                            </button>
                          </div>
                        </div>
                        <span className="text-[var(--couples-text-muted)]" aria-hidden>›</span>
                      </div>
                    </li>
                  ))}
                </ul>
                {favorites.length > 0 ? (
                  <div>
                    <h3 className="text-sm font-semibold text-night-800">Your favorites</h3>
                    <ul className="mt-2 space-y-2">
                      {favorites.map((plan) => (
                        <PlanCard key={plan.id} plan={plan} />
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : tab === "dates" ? (
              <ul className="mt-4 space-y-3">
                {upcoming.length === 0 ? (
                  <p className="text-sm text-night-600">No upcoming dates — pick an idea to schedule one.</p>
                ) : (
                  upcoming.map((plan) => <PlanCard key={plan.id} plan={plan} />)
                )}
              </ul>
            ) : tab === "history" ? (
              <ul className="mt-4 space-y-3">
                {history.length === 0 ? (
                  <p className="text-sm text-night-600">Completed dates will show here.</p>
                ) : (
                  history.map((plan) => <PlanCard key={plan.id} plan={plan} />)
                )}
              </ul>
            ) : (
              <div className="mt-4 rounded-[1.25rem] border border-amber-200/80 bg-amber-50/80 p-5 dark:border-amber-900/40 dark:bg-amber-950/30">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-900 dark:text-amber-200">
                  This week
                </p>
                <p className="mt-3 font-display text-lg font-semibold text-night-950 dark:text-sand-100">
                  {weeklyChallenge}
                </p>
                <p className="mt-3 text-sm text-night-700 dark:text-sand-300">
                  When you finish, mark your date complete under My dates to build your history together.
                </p>
              </div>
            )}

            {status ? (
              <p className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{status}</p>
            ) : null}
          </>
        )}

        {scheduleOpen && !locked ? (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-night-950/40 p-4 sm:items-center">
            <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl dark:bg-[var(--color-surface)]">
              <h2 className="font-display text-lg font-semibold">Plan a date</h2>
              <label className="mt-4 block text-sm">
                <span className="font-semibold">Title</span>
                <input
                  className="mt-1 w-full rounded-xl border border-night-900/10 px-3 py-2.5 text-sm"
                  value={scheduleTitle}
                  onChange={(event) => setScheduleTitle(event.target.value)}
                />
              </label>
              <label className="mt-3 block text-sm">
                <span className="font-semibold">Date</span>
                <input
                  type="date"
                  className="mt-1 w-full rounded-xl border border-night-900/10 px-3 py-2.5 text-sm"
                  value={scheduleDate}
                  onChange={(event) => setScheduleDate(event.target.value)}
                />
              </label>
              <label className="mt-3 block text-sm">
                <span className="font-semibold">Time</span>
                <input
                  type="time"
                  className="mt-1 w-full rounded-xl border border-night-900/10 px-3 py-2.5 text-sm"
                  value={scheduleTime}
                  onChange={(event) => setScheduleTime(event.target.value)}
                />
              </label>
              <label className="mt-3 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={scheduleSurprise}
                  onChange={(event) => setScheduleSurprise(event.target.checked)}
                />
                <span>Send as surprise (hides details until spouse opens it)</span>
              </label>
              {!scheduleSurprise ? (
                <label className="mt-2 flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={addToCalendar}
                    onChange={(event) => setAddToCalendar(event.target.checked)}
                  />
                  <span>Also add to our marriage calendar</span>
                </label>
              ) : null}
              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <Button className="flex-1" disabled={busy || !scheduleDate} onClick={() => void saveSchedule()}>
                  {busy ? "Saving…" : "Save"}
                </Button>
                <Button variant="secondary" className="flex-1" onClick={() => setScheduleOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        <Link href="/couples/marriage" className={`${couplesHubPremium.secondaryCta} mt-10`}>
          Back to marriage dashboard
        </Link>
    </CouplesHubScreen>
  );
}
