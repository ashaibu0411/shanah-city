"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { MemberAvatarLink } from "@/components/auth/MemberAvatarLink";
import { CouplesLinkGate } from "@/components/couples/CouplesLinkGate";
import {
  CouplesLoadingSkeleton,
  CouplesPageHeader,
  CouplesPrimaryButton,
  CouplesSecondaryButton,
} from "@/components/couples/design-system";
import { couplesHubPremium, COUPLES_DATE_NIGHT_HERO } from "@/components/couples/couples-hub-premium";
import {
  DATE_NIGHT_BUDGETS,
  DATE_NIGHT_LOCATIONS,
  type CoupleDateNightPlanView,
  type DateNightBudget,
  type DateNightIdeaCatalogItem,
  type DateNightLocation,
} from "@/lib/couple-date-night-types";
import {
  catalogForCategory,
  DATE_NIGHT_CURATED_CHALLENGES,
  DATE_NIGHT_IDEA_CATEGORIES,
  locationTypeForCategory,
  pickRandomCatalogItem,
  readChallengeProgress,
  type DateNightTab,
  writeChallengeProgress,
} from "@/lib/couple-date-night-ui";
import type { CouplesHubOverview } from "@/lib/couples-hub-types";

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

function DateNightTabSelector({
  active,
  onChange,
}: {
  active: DateNightTab;
  onChange: (tab: DateNightTab) => void;
}) {
  const tabs: { id: DateNightTab; label: string }[] = [
    { id: "ideas", label: "Ideas" },
    { id: "dates", label: "My Dates" },
    { id: "challenge", label: "Challenges" },
  ];
  return (
    <div
      className="flex rounded-full bg-[var(--couples-midnight)] p-1"
      role="tablist"
      aria-label="Date night sections"
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex-1 rounded-full px-2 py-2.5 text-center text-[0.8125rem] font-semibold transition motion-reduce:transition-none ${
            active === tab.id
              ? "bg-[var(--couples-surface)] text-[var(--couples-text)] shadow-sm"
              : "text-white/65"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function CouplesDateNight() {
  const { user, loading: authLoading } = useAuth();
  const [hub, setHub] = useState<CouplesHubOverview | null>(null);
  const [coupleLinkId, setCoupleLinkId] = useState("");
  const [catalog, setCatalog] = useState<DateNightIdeaCatalogItem[]>([]);
  const [weeklyChallenge, setWeeklyChallenge] = useState("");
  const [upcoming, setUpcoming] = useState<CoupleDateNightPlanView[]>([]);
  const [history, setHistory] = useState<CoupleDateNightPlanView[]>([]);
  const [tab, setTab] = useState<DateNightTab>("ideas");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [challengeProgress, setChallengeProgress] = useState<Record<string, number>>({});

  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleTitle, setScheduleTitle] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("19:00");
  const [scheduleBudget, setScheduleBudget] = useState<DateNightBudget | "">("");
  const [scheduleLocationType, setScheduleLocationType] = useState<DateNightLocation | "">("");
  const [scheduleLocationNote, setScheduleLocationNote] = useState("");
  const [scheduleSurprise, setScheduleSurprise] = useState(false);
  const [addToCalendar, setAddToCalendar] = useState(true);
  const [catalogId, setCatalogId] = useState<string | undefined>();

  const locked = !hub?.hasActiveLink;

  const categoryIdeas = useMemo(() => {
    if (!selectedCategory) return [];
    return catalogForCategory(selectedCategory, catalog);
  }, [catalog, selectedCategory]);

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
    setHistory(Array.isArray(data.history) ? data.history : []);
    const linkId = String(data.coupleLinkId ?? "");
    if (linkId) {
      setCoupleLinkId(linkId);
      setChallengeProgress(readChallengeProgress(linkId));
    }
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

  function openSchedule(item?: DateNightIdeaCatalogItem, categoryId?: string) {
    setCatalogId(item?.id);
    setScheduleTitle(item?.title ?? "");
    setScheduleBudget(item?.budget ?? "");
    setScheduleLocationType(item?.locationType ?? locationTypeForCategory(categoryId ?? "") ?? "");
    setScheduleDate("");
    setScheduleTime("19:00");
    setScheduleLocationNote("");
    setScheduleSurprise(false);
    setAddToCalendar(true);
    setScheduleOpen(true);
  }

  function onCategoryTap(categoryId: string) {
    if (categoryId === "surprise") {
      const pick = pickRandomCatalogItem(catalog);
      if (pick) openSchedule(pick, categoryId);
      else setStatus("Add more ideas to your catalog first.");
      return;
    }
    setSelectedCategory(categoryId);
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
    const title =
      scheduleLocationNote.trim() && !scheduleTitle.includes(scheduleLocationNote)
        ? `${scheduleTitle} · ${scheduleLocationNote.trim()}`
        : scheduleTitle;
    const ok = await postAction({
      action: "create",
      catalogId,
      title,
      dateKey: scheduleDate,
      time: scheduleTime,
      budget: scheduleBudget || undefined,
      locationType: scheduleLocationType || undefined,
      isSurprise: scheduleSurprise,
      addToCalendar: addToCalendar && !scheduleSurprise,
    });
    if (ok) {
      setScheduleOpen(false);
      setTab("dates");
      setStatus(scheduleSurprise ? "Invite sent to your spouse." : "Date saved.");
    }
  }

  async function completePlan(plan: CoupleDateNightPlanView) {
    const ok = await postAction({ action: "update", planId: plan.id, status: "completed" });
    if (ok) setStatus("Marked complete — beautiful work together.");
  }

  async function acceptSurprise(plan: CoupleDateNightPlanView) {
    const ok = await postAction({ action: "acceptSurprise", planId: plan.id });
    if (ok) setStatus(`Surprise revealed: ${plan.title}`);
  }

  async function removePlan(plan: CoupleDateNightPlanView) {
    if (!window.confirm("Remove this date from your planner?")) return;
    await postAction({ action: "delete", planId: plan.id });
  }

  function bumpChallenge(challengeId: string, goal: number) {
    if (!coupleLinkId) return;
    const current = challengeProgress[challengeId] ?? 0;
    const next = Math.min(goal, current + 1);
    const updated = { ...challengeProgress, [challengeId]: next };
    setChallengeProgress(updated);
    writeChallengeProgress(coupleLinkId, updated);
  }

  function PlanCard({ plan }: { plan: CoupleDateNightPlanView }) {
    const completed = plan.status === "completed";
    return (
      <li className="rounded-[1.25rem] bg-[var(--couples-surface)] px-4 py-3.5">
        <div className="flex items-start gap-3">
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg ${
              completed ? "bg-[var(--couples-sage)]" : "bg-[var(--couples-blush)]"
            }`}
            aria-hidden
          >
            {completed ? "♥" : "📅"}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-[family-name:var(--font-couples-display)] text-base font-semibold text-[var(--couples-text)]">
              {plan.displayTitle}
            </p>
            <p className="mt-0.5 text-sm text-[var(--couples-muted)]">
              {formatScheduled(plan.scheduledAt)}
              {plan.budget ? ` · ${budgetLabel(plan.budget)}` : ""}
              {plan.locationType ? ` · ${locationLabel(plan.locationType)}` : ""}
            </p>
            <div className="mt-2 flex flex-wrap gap-3">
              {plan.canAcceptSurprise ? (
                <button
                  type="button"
                  className="text-xs font-semibold text-[var(--couples-gold)]"
                  disabled={busy}
                  onClick={() => void acceptSurprise(plan)}
                >
                  Open surprise
                </button>
              ) : null}
              {plan.status === "planned" || plan.status === "surprise_pending" ? (
                <button
                  type="button"
                  className="text-xs font-semibold text-[var(--couples-mocha)]"
                  onClick={() => void completePlan(plan)}
                >
                  Mark done
                </button>
              ) : null}
              <button
                type="button"
                className="text-xs font-semibold text-[var(--couples-muted)]"
                onClick={() => void removePlan(plan)}
              >
                Remove
              </button>
            </div>
          </div>
          <span className="text-[var(--couples-muted)]" aria-hidden>›</span>
        </div>
      </li>
    );
  }

  return (
    <div className={`${couplesHubPremium.page} couples-hub-typography min-h-full`}>
      <div className="mx-auto w-full max-w-lg">
        <CouplesPageHeader
          title="Date Night"
          backHref="/couples/marriage"
          backLabel="Back to Our Marriage"
          rightSlot={
            <MemberAvatarLink user={user} loading={authLoading} size="sm" className="!h-10 !w-10 ring-white/20" />
          }
        />

        <div className="px-[var(--couples-page-padding)] pb-28 pt-3">
          <div className="relative h-[13.75rem] w-full overflow-hidden rounded-[1.375rem]">
            <Image
              src={COUPLES_DATE_NIGHT_HERO}
              alt=""
              fill
              priority
              className="object-cover object-center"
              sizes="(max-width: 512px) 100vw, 512px"
            />
            <div
              className="absolute inset-0 bg-gradient-to-t from-[var(--couples-midnight)]/88 via-[var(--couples-mocha)]/25 to-transparent"
              aria-hidden
            />
            <div className="absolute inset-x-0 bottom-0 p-5">
              <h2
                className="font-[family-name:var(--font-couples-display)] text-[1.75rem] font-semibold leading-tight text-white"
              >
                Make Time For Us
              </h2>
              <p className="mt-1.5 text-[0.9375rem] text-white/90">
                Create memories. Keep the spark alive.
              </p>
            </div>
          </div>

          {locked ? (
            <div className="mt-6">
              <CouplesLinkGate tone="sheet" pendingIncoming={hub?.pendingIncomingInvite} />
            </div>
          ) : (
            <>
              <div className="mt-5">
                <DateNightTabSelector active={tab} onChange={setTab} />
              </div>

              {error ? (
                <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
              ) : loading ? (
                <div className="mt-6">
                  <CouplesLoadingSkeleton rows={4} />
                </div>
              ) : tab === "ideas" ? (
                <div className="mt-5">
                  <div
                    className="couples-hub-landing-scroll -mx-[var(--couples-page-padding)] flex gap-3 overflow-x-auto px-[var(--couples-page-padding)] pb-1"
                  >
                    {DATE_NIGHT_IDEA_CATEGORIES.map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => onCategoryTap(category.id)}
                        className={`flex min-h-[7.5rem] w-[11.5rem] shrink-0 flex-col justify-between rounded-[1.25rem] p-4 text-left transition active:scale-[0.98] ${
                          selectedCategory === category.id ? "ring-2 ring-[var(--couples-gold)]" : ""
                        }`}
                        style={{ backgroundColor: category.iconBg }}
                      >
                        <span
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/70 text-xl"
                          aria-hidden
                        >
                          {category.emoji}
                        </span>
                        <span>
                          <span className="block font-[family-name:var(--font-couples-display)] text-[0.9375rem] font-semibold leading-snug text-[var(--couples-text)]">
                            {category.title}
                          </span>
                          <span className="mt-0.5 block text-xs text-[var(--couples-muted)]">
                            {category.subtitle}
                          </span>
                        </span>
                        <span className="self-end text-[var(--couples-mocha)]" aria-hidden>›</span>
                      </button>
                    ))}
                  </div>

                  {selectedCategory && selectedCategory !== "surprise" ? (
                    <div className="mt-5 space-y-2">
                      <p className="text-sm font-semibold text-[var(--couples-muted)]">Ideas for you</p>
                      {categoryIdeas.length === 0 ? (
                        <p className="text-sm text-[var(--couples-muted)]">No matches yet — plan a custom date.</p>
                      ) : (
                        categoryIdeas.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => openSchedule(item, selectedCategory)}
                            className="flex w-full items-center gap-3 rounded-[1.125rem] bg-[var(--couples-surface)] px-4 py-3.5 text-left transition active:scale-[0.99]"
                          >
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--couples-blush)] text-lg">
                              💕
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-[0.9375rem] font-semibold text-[var(--couples-text)]">
                                {item.title}
                              </span>
                              <span className="mt-0.5 block line-clamp-2 text-xs text-[var(--couples-muted)]">
                                {item.description}
                              </span>
                            </span>
                            <span className="text-[var(--couples-muted)]" aria-hidden>›</span>
                          </button>
                        ))
                      )}
                    </div>
                  ) : null}
                </div>
              ) : tab === "dates" ? (
                <div className="mt-5 space-y-6">
                  <CouplesPrimaryButton onClick={() => openSchedule()}>Plan a Date</CouplesPrimaryButton>

                  <section>
                    <h3 className="font-[family-name:var(--font-couples-display)] text-lg font-semibold text-[var(--couples-text)]">
                      Scheduled
                    </h3>
                    <ul className="mt-3 space-y-2">
                      {upcoming.length === 0 ? (
                        <p className="text-sm text-[var(--couples-muted)]">No upcoming dates — tap Plan a Date.</p>
                      ) : (
                        upcoming.map((plan) => <PlanCard key={plan.id} plan={plan} />)
                      )}
                    </ul>
                  </section>

                  <section>
                    <h3 className="font-[family-name:var(--font-couples-display)] text-lg font-semibold text-[var(--couples-text)]">
                      Completed
                    </h3>
                    <ul className="mt-3 space-y-2">
                      {history.length === 0 ? (
                        <p className="text-sm text-[var(--couples-muted)]">Your story together will show here.</p>
                      ) : (
                        history.map((plan) => <PlanCard key={plan.id} plan={plan} />)
                      )}
                    </ul>
                  </section>
                </div>
              ) : (
                <div className="mt-5 space-y-4">
                  <div className="rounded-[1.25rem] bg-gradient-to-br from-[#EAD9BF] to-[#F9E8E1] p-5">
                    <p className="text-[0.625rem] font-bold uppercase tracking-[0.22em] text-[var(--couples-mocha)]">
                      This week
                    </p>
                    <p className="mt-2 font-[family-name:var(--font-couples-display)] text-lg font-semibold text-[var(--couples-text)]">
                      {weeklyChallenge}
                    </p>
                  </div>

                  {DATE_NIGHT_CURATED_CHALLENGES.map((challenge) => {
                    const progress = challengeProgress[challenge.id] ?? 0;
                    const pct = Math.round((progress / challenge.goal) * 100);
                    return (
                      <div
                        key={challenge.id}
                        className="rounded-[1.25rem] bg-[var(--couples-surface)] px-4 py-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-[family-name:var(--font-couples-display)] text-base font-semibold text-[var(--couples-text)]">
                              {challenge.title}
                            </p>
                            <p className="mt-1 text-sm text-[var(--couples-muted)]">{challenge.description}</p>
                          </div>
                          <span className="text-xs font-semibold text-[var(--couples-gold)]">{pct}%</span>
                        </div>
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--couples-border)]">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[var(--couples-mocha)] to-[var(--couples-gold)] transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <button
                          type="button"
                          className="mt-3 text-sm font-semibold text-[var(--couples-mocha)]"
                          onClick={() => bumpChallenge(challenge.id, challenge.goal)}
                          disabled={progress >= challenge.goal}
                        >
                          {progress >= challenge.goal ? "Completed" : "Log progress"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {status ? (
                <p className="mt-4 rounded-xl bg-[var(--couples-sage)] px-3 py-2 text-sm text-[var(--couples-text)]">
                  {status}
                </p>
              ) : null}
            </>
          )}
        </div>
      </div>

      {scheduleOpen && !locked ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[var(--couples-midnight)]/45 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
        >
          <div className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-[1.375rem] bg-[var(--couples-surface)] p-5 shadow-xl safe-bottom">
            <h2 className="font-[family-name:var(--font-couples-display)] text-xl font-semibold text-[var(--couples-text)]">
              Plan your date
            </h2>

            <div className="mt-4 space-y-3">
              <label className="block text-sm">
                <span className="font-semibold text-[var(--couples-muted)]">Date title</span>
                <input
                  className="mt-1 w-full rounded-xl border border-[var(--couples-border)] px-3 py-2.5 text-sm"
                  value={scheduleTitle}
                  onChange={(event) => setScheduleTitle(event.target.value)}
                />
              </label>
              <label className="block text-sm">
                <span className="font-semibold text-[var(--couples-muted)]">Date</span>
                <input
                  type="date"
                  className="mt-1 w-full rounded-xl border border-[var(--couples-border)] px-3 py-2.5 text-sm"
                  value={scheduleDate}
                  onChange={(event) => setScheduleDate(event.target.value)}
                />
              </label>
              <label className="block text-sm">
                <span className="font-semibold text-[var(--couples-muted)]">Time</span>
                <input
                  type="time"
                  className="mt-1 w-full rounded-xl border border-[var(--couples-border)] px-3 py-2.5 text-sm"
                  value={scheduleTime}
                  onChange={(event) => setScheduleTime(event.target.value)}
                />
              </label>
              <label className="block text-sm">
                <span className="font-semibold text-[var(--couples-muted)]">Activity type</span>
                <select
                  className="mt-1 w-full rounded-xl border border-[var(--couples-border)] px-3 py-2.5 text-sm"
                  value={scheduleLocationType}
                  onChange={(event) =>
                    setScheduleLocationType(event.target.value as DateNightLocation | "")
                  }
                >
                  <option value="">Choose…</option>
                  {DATE_NIGHT_LOCATIONS.map((entry) => (
                    <option key={entry.id} value={entry.id}>{entry.label}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="font-semibold text-[var(--couples-muted)]">Budget (optional)</span>
                <select
                  className="mt-1 w-full rounded-xl border border-[var(--couples-border)] px-3 py-2.5 text-sm"
                  value={scheduleBudget}
                  onChange={(event) => setScheduleBudget(event.target.value as DateNightBudget | "")}
                >
                  <option value="">No preference</option>
                  {DATE_NIGHT_BUDGETS.map((entry) => (
                    <option key={entry.id} value={entry.id}>{entry.label}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="font-semibold text-[var(--couples-muted)]">Location (optional)</span>
                <input
                  className="mt-1 w-full rounded-xl border border-[var(--couples-border)] px-3 py-2.5 text-sm"
                  placeholder="Restaurant, park, or address"
                  value={scheduleLocationNote}
                  onChange={(event) => setScheduleLocationNote(event.target.value)}
                />
              </label>
              <label className="flex items-start gap-2 text-sm text-[var(--couples-text)]">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={scheduleSurprise}
                  onChange={(event) => setScheduleSurprise(event.target.checked)}
                />
                <span>Invite spouse as a surprise (details hidden until they open it)</span>
              </label>
              {!scheduleSurprise ? (
                <label className="flex items-start gap-2 text-sm text-[var(--couples-text)]">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={addToCalendar}
                    onChange={(event) => setAddToCalendar(event.target.checked)}
                  />
                  <span>Save to our shared marriage calendar</span>
                </label>
              ) : null}
            </div>

            <div className="mt-5 flex flex-col gap-2">
              <CouplesPrimaryButton disabled={busy || !scheduleDate || !scheduleTitle.trim()} onClick={() => void saveSchedule()}>
                {busy ? "Saving…" : "Save"}
              </CouplesPrimaryButton>
              <CouplesSecondaryButton onClick={() => setScheduleOpen(false)}>Cancel</CouplesSecondaryButton>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
