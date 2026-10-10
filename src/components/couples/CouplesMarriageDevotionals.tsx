"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CouplesLinkGate } from "@/components/couples/CouplesLinkGate";
import {
  CouplesLoadingSkeleton,
  CouplesPrimaryButton,
} from "@/components/couples/design-system";
import { couplesHubPremium, COUPLES_DEVOTIONAL_HERO } from "@/components/couples/couples-hub-premium";
import {
  COUPLES_DEVOTIONAL_READING_PLANS,
  DEVOTIONAL_EXAMPLE_PREVIEW,
  formatDevotionalDate,
  gentleReadingStreak,
  parseScriptureBlock,
  readDevotionalPlanProgress,
  writeDevotionalPlanProgress,
  type DevotionalsTab,
  type DevotionalPlanId,
} from "@/lib/couple-marriage-devotional-ui";
import type { CoupleMarriageDevotionalView } from "@/lib/couple-marriage-devotional-types";
import type { CouplesHubOverview } from "@/lib/couples-hub-types";

function TabSelector({ active, onChange }: { active: DevotionalsTab; onChange: (tab: DevotionalsTab) => void }) {
  const tabs: { id: DevotionalsTab; label: string }[] = [
    { id: "daily", label: "Daily" },
    { id: "plans", label: "Plans" },
    { id: "progress", label: "My Progress" },
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
          className={`flex-1 rounded-full px-2 py-2.5 text-center text-xs font-semibold transition motion-reduce:transition-none sm:text-sm ${
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

function ReadingSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <h3 className="font-[family-name:var(--font-couples-display)] text-lg font-semibold text-[var(--couples-text)]">
        {title}
      </h3>
      <div className="mt-3 text-base leading-[1.75] text-[var(--couples-text)]">{children}</div>
    </section>
  );
}

export function CouplesMarriageDevotionals() {
  const [hub, setHub] = useState<CouplesHubOverview | null>(null);
  const [coupleLinkId, setCoupleLinkId] = useState<string | null>(null);
  const [devotionals, setDevotionals] = useState<CoupleMarriageDevotionalView[]>([]);
  const [todayId, setTodayId] = useState<string | null>(null);
  const [canManage, setCanManage] = useState(false);
  const [viewTab, setViewTab] = useState<DevotionalsTab>("daily");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [readerOpen, setReaderOpen] = useState(false);
  const [readingId, setReadingId] = useState<string | null>(null);
  const [planProgress, setPlanProgress] = useState<Record<string, number>>({});

  const showGate = !hub?.hasActiveLink && !canManage;

  const todayDevotional = useMemo(() => {
    if (todayId) {
      const found = devotionals.find((d) => d.id === todayId);
      if (found) return found;
    }
    return devotionals[0] ?? null;
  }, [devotionals, todayId]);

  const readingDevotional = useMemo(() => {
    if (readingId) {
      return devotionals.find((d) => d.id === readingId) ?? todayDevotional;
    }
    return todayDevotional;
  }, [devotionals, readingId, todayDevotional]);

  function openReader(devotionalId?: string) {
    const id = devotionalId ?? todayDevotional?.id;
    if (!id) return;
    setReadingId(id);
    setReaderOpen(true);
  }

  const streak = useMemo(() => gentleReadingStreak(devotionals), [devotionals]);

  const loadHub = useCallback(() => {
    return fetch("/api/couples/hub")
      .then(async (response) => {
        const data = await response.json();
        if (response.ok) setHub(data.overview ?? null);
      })
      .catch(() => undefined);
  }, []);

  const loadDevotionals = useCallback(() => {
    setLoading(true);
    setError(null);
    return fetch("/api/couples/devotionals")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Could not load devotionals.");
        const list = Array.isArray(data.devotionals) ? data.devotionals : [];
        setDevotionals(list);
        setCoupleLinkId(typeof data.coupleLinkId === "string" ? data.coupleLinkId : null);
        setTodayId(typeof data.todayDevotionalId === "string" ? data.todayDevotionalId : list[0]?.id ?? null);
        setCanManage(Boolean(data.canManageMarriageMinistry));
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Could not load devotionals.");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    void loadHub();
  }, [loadHub]);

  useEffect(() => {
    void loadDevotionals();
  }, [loadDevotionals]);

  useEffect(() => {
    if (coupleLinkId) setPlanProgress(readDevotionalPlanProgress(coupleLinkId));
  }, [coupleLinkId]);

  async function markRead(devotionalId: string) {
    if (!hub?.hasActiveLink) return;
    setBusy(true);
    const response = await fetch("/api/couples/devotionals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "markRead", devotionalId }),
    });
    const data = await response.json();
    setBusy(false);
    if (response.ok) {
      setDevotionals(Array.isArray(data.devotionals) ? data.devotionals : []);
      setCanManage(Boolean(data.canManageMarriageMinistry));
    }
  }

  function advancePlan(planId: DevotionalPlanId, durationDays: number) {
    if (!coupleLinkId) return;
    const current = planProgress[planId] ?? 0;
    const next = Math.min(durationDays, current + 1);
    const updated = { ...planProgress, [planId]: next };
    setPlanProgress(updated);
    writeDevotionalPlanProgress(coupleLinkId, updated);
  }

  const dailyScripture = todayDevotional ? parseScriptureBlock(todayDevotional.scripture) : null;
  const useExamplePreview = !loading && !todayDevotional;

  return (
    <div className={`${couplesHubPremium.page} couples-hub-typography min-h-full`}>
      <div className="mx-auto w-full max-w-lg">
        <header
          className="sticky top-0 z-30 flex min-h-[3.25rem] items-center gap-2 bg-[var(--couples-midnight)] px-[var(--couples-page-padding)] py-3 text-white safe-top"
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
            Devotionals
          </h1>
          <span className="h-11 w-11 shrink-0" aria-hidden />
        </header>

        <section className="relative mx-[var(--couples-page-padding)] mt-2 overflow-hidden rounded-[var(--couples-radius-hero-home)]">
          <div className="relative h-[clamp(13rem,38vw,17rem)] w-full">
            <Image
              src={COUPLES_DEVOTIONAL_HERO}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 480px) 100vw, 480px"
              priority
            />
            <div
              className="absolute inset-0 bg-gradient-to-t from-[var(--couples-midnight)]/85 via-[var(--couples-midnight)]/35 to-black/20"
              aria-hidden
            />
            <div className="absolute inset-x-0 bottom-0 p-5 pb-6">
              <h2
                className="font-[family-name:var(--font-couples-display)] text-[1.65rem] font-semibold leading-tight text-white drop-shadow-sm"
              >
                Grow Together In God&apos;s Word
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-white/90">
                Daily devotionals for a stronger marriage.
              </p>
            </div>
          </div>
        </section>

        <main className="px-[var(--couples-page-padding)] pb-10 pt-5">
          {showGate ? (
            <CouplesLinkGate pendingIncoming={hub?.pendingIncomingInvite} />
          ) : (
            <>
              <TabSelector active={viewTab} onChange={setViewTab} />

              {canManage ? (
                <Link
                  href="/admin/devotions"
                  className="mt-4 flex w-full items-center justify-center rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-[var(--couples-text)] ring-1 ring-[var(--couples-border)] transition hover:bg-[var(--couples-ivory)]"
                >
                  Manage church devotions
                </Link>
              ) : null}

              {error ? <p className={`mt-4 ${couplesHubPremium.sheetStatusError}`}>{error}</p> : null}

              {viewTab === "daily" ? (
                loading ? (
                  <div className="mt-5">
                    <CouplesLoadingSkeleton rows={3} />
                  </div>
                ) : (
                  <article
                    className="mt-5 rounded-[var(--couples-radius-card)] bg-gradient-to-b from-[var(--couples-ivory)] to-white p-6 shadow-sm ring-1 ring-[var(--couples-border)]"
                  >
                    {useExamplePreview ? (
                      <>
                        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--couples-muted)]">
                          Design preview
                        </p>
                        <p className="mt-2 text-sm text-[var(--couples-muted)]">Today</p>
                        <h3
                          className="mt-1 font-[family-name:var(--font-couples-display)] text-2xl font-semibold text-[var(--couples-text)]"
                        >
                          {DEVOTIONAL_EXAMPLE_PREVIEW.title}
                        </h3>
                        <p className="mt-2 text-sm font-medium text-[var(--couples-gold)]">
                          {DEVOTIONAL_EXAMPLE_PREVIEW.reference}
                        </p>
                        <p className="mt-3 text-sm italic leading-relaxed text-[var(--couples-muted)]">
                          {DEVOTIONAL_EXAMPLE_PREVIEW.preview}
                        </p>
                        <p className="mt-3 text-sm leading-relaxed text-[var(--couples-text)]">
                          {DEVOTIONAL_EXAMPLE_PREVIEW.intro}
                        </p>
                      </>
                    ) : todayDevotional ? (
                      <>
                        <p className="text-sm text-[var(--couples-muted)]">
                          {formatDevotionalDate(todayDevotional.publishDate)}
                        </p>
                        <h3
                          className="mt-1 font-[family-name:var(--font-couples-display)] text-2xl font-semibold text-[var(--couples-text)]"
                        >
                          {todayDevotional.title}
                        </h3>
                        {dailyScripture?.reference ? (
                          <p className="mt-2 text-sm font-medium text-[var(--couples-gold)]">
                            {dailyScripture.reference}
                          </p>
                        ) : null}
                        {dailyScripture?.body ? (
                          <p className="mt-3 text-sm italic leading-relaxed text-[var(--couples-muted)] line-clamp-3">
                            {dailyScripture.body}
                          </p>
                        ) : null}
                        {todayDevotional.teaching ? (
                          <p className="mt-3 text-sm leading-relaxed text-[var(--couples-text)] line-clamp-4">
                            {todayDevotional.teaching.slice(0, 280)}
                            {todayDevotional.teaching.length > 280 ? "…" : ""}
                          </p>
                        ) : null}
                      </>
                    ) : null}

                    <CouplesPrimaryButton
                      className="mt-6"
                      disabled={useExamplePreview}
                      onClick={() => openReader()}
                    >
                      Read Today&apos;s Devotional
                    </CouplesPrimaryButton>

                    {todayDevotional && hub?.hasActiveLink ? (
                      <p className="mt-3 text-center text-xs text-[var(--couples-muted)]">
                        {todayDevotional.readByMe ? "You marked this as read." : "Read together, then mark as read."}
                        {todayDevotional.readBySpouse ? " Your spouse has read it too." : ""}
                      </p>
                    ) : null}
                  </article>
                )
              ) : null}

              {viewTab === "plans" ? (
                <ul className="mt-5 space-y-4">
                  {COUPLES_DEVOTIONAL_READING_PLANS.map((plan) => {
                    const done = planProgress[plan.id] ?? 0;
                    const pct = Math.round((done / plan.durationDays) * 100);
                    const started = done > 0;
                    return (
                      <li
                        key={plan.id}
                        className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-[var(--couples-border)]"
                      >
                        <div className={`relative h-24 bg-gradient-to-br ${plan.coverGradient} px-4 py-3`}>
                          <p className={`font-[family-name:var(--font-couples-display)] text-lg font-semibold ${plan.accent}`}>
                            {plan.title}
                          </p>
                          <p className="mt-1 text-xs font-medium text-[var(--couples-muted)]">
                            {plan.durationDays} days
                          </p>
                        </div>
                        <div className="p-4">
                          <div className="h-2 overflow-hidden rounded-full bg-[var(--couples-ivory)]">
                            <div
                              className="h-full rounded-full bg-[var(--couples-gold)] transition-[width]"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <p className="mt-2 text-xs text-[var(--couples-muted)]">
                            {done} of {plan.durationDays} days · {pct}%
                          </p>
                          <button
                            type="button"
                            className="mt-3 w-full rounded-xl bg-[var(--couples-mocha)] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-105 disabled:opacity-50"
                            disabled={!coupleLinkId || done >= plan.durationDays}
                            onClick={() => advancePlan(plan.id, plan.durationDays)}
                          >
                            {done >= plan.durationDays
                              ? "Completed"
                              : started
                                ? "Continue"
                                : "Start plan"}
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : null}

              {viewTab === "progress" ? (
                <div className="mt-5 space-y-4">
                  <div className="rounded-2xl bg-white p-5 ring-1 ring-[var(--couples-border)]">
                    <h3 className="font-[family-name:var(--font-couples-display)] text-lg font-semibold text-[var(--couples-text)]">
                      Your rhythm
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--couples-muted)]">
                      No leaderboards — just a gentle look at how you&apos;re growing.
                    </p>
                    <dl className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-[var(--couples-ivory)] p-3">
                        <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--couples-muted)]">
                          You&apos;ve read
                        </dt>
                        <dd className="mt-1 text-2xl font-semibold text-[var(--couples-text)]">{streak.readCount}</dd>
                      </div>
                      <div className="rounded-xl bg-[var(--couples-ivory)] p-3">
                        <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--couples-muted)]">
                          Read together
                        </dt>
                        <dd className="mt-1 text-2xl font-semibold text-[var(--couples-text)]">
                          {streak.togetherCount}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div className="rounded-2xl bg-white p-5 ring-1 ring-[var(--couples-border)]">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--couples-muted)]">
                      Active plans
                    </h3>
                    <ul className="mt-3 space-y-2">
                      {COUPLES_DEVOTIONAL_READING_PLANS.filter((p) => (planProgress[p.id] ?? 0) > 0).length === 0 ? (
                        <li className="text-sm text-[var(--couples-muted)]">No active plans yet — start one anytime.</li>
                      ) : (
                        COUPLES_DEVOTIONAL_READING_PLANS.filter((p) => (planProgress[p.id] ?? 0) > 0).map((plan) => (
                          <li key={plan.id} className="flex justify-between text-sm">
                            <span className="text-[var(--couples-text)]">{plan.title}</span>
                            <span className="text-[var(--couples-muted)]">
                              {planProgress[plan.id] ?? 0}/{plan.durationDays}
                            </span>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>

                  <div className="rounded-2xl bg-white p-5 ring-1 ring-[var(--couples-border)]">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--couples-muted)]">
                      Completed devotionals
                    </h3>
                    <ul className="mt-3 space-y-2">
                      {devotionals.filter((d) => d.readByMe).length === 0 ? (
                        <li className="text-sm text-[var(--couples-muted)]">
                          When you finish a daily reading, it will appear here.
                        </li>
                      ) : (
                        devotionals
                          .filter((d) => d.readByMe)
                          .slice(0, 8)
                          .map((entry) => (
                            <li key={entry.id}>
                              <button
                                type="button"
                                className="flex w-full items-center justify-between gap-2 text-left text-sm"
                                onClick={() => {
                                  setTodayId(entry.id);
                                  setViewTab("daily");
                                  openReader(entry.id);
                                }}
                              >
                                <span className="font-medium text-[var(--couples-text)]">{entry.title}</span>
                                <span className="shrink-0 text-xs text-[var(--couples-muted)]">
                                  {entry.publishDate}
                                </span>
                              </button>
                            </li>
                          ))
                      )}
                    </ul>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </main>
      </div>

      {readerOpen && readingDevotional && !useExamplePreview ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-[var(--couples-ivory)]">
          <header
            className="flex shrink-0 items-center gap-2 border-b border-[var(--couples-border)] bg-white/95 px-4 py-3 safe-top backdrop-blur"
          >
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-full text-2xl font-light text-[var(--couples-text)] hover:bg-[var(--couples-ivory)]"
              onClick={() => {
                setReaderOpen(false);
                setReadingId(null);
              }}
              aria-label="Close reading"
            >
              ‹
            </button>
            <span className="flex-1 text-center text-sm font-semibold text-[var(--couples-muted)]">Today&apos;s reading</span>
            <span className="h-11 w-11" />
          </header>

          <article className="mx-auto w-full max-w-lg flex-1 overflow-y-auto px-[var(--couples-page-padding)] py-6 pb-12">
            <p className="text-sm text-[var(--couples-muted)]">{formatDevotionalDate(readingDevotional.publishDate)}</p>
            <h2
              className="mt-2 font-[family-name:var(--font-couples-display)] text-3xl font-semibold leading-tight text-[var(--couples-text)]"
            >
              {readingDevotional.title}
            </h2>

            {readingDevotional.scripture ? (
              <ReadingSection title="Scripture">
                <p className="whitespace-pre-wrap font-[family-name:var(--font-couples-display)] text-lg italic leading-relaxed text-[var(--couples-mocha)]">
                  {readingDevotional.scripture}
                </p>
              </ReadingSection>
            ) : null}

            {readingDevotional.teaching ? (
              <ReadingSection title="Devotional">{readingDevotional.teaching}</ReadingSection>
            ) : null}

            {readingDevotional.discussion ? (
              <ReadingSection title="Discussion question">{readingDevotional.discussion}</ReadingSection>
            ) : null}

            {readingDevotional.assignment ? (
              <ReadingSection title="Today's marriage assignment">{readingDevotional.assignment}</ReadingSection>
            ) : null}

            {readingDevotional.prayer ? (
              <ReadingSection title="Prayer">
                <p className="whitespace-pre-wrap italic">{readingDevotional.prayer}</p>
              </ReadingSection>
            ) : null}

            {readingDevotional.declaration ? (
              <ReadingSection title="Declaration">{readingDevotional.declaration}</ReadingSection>
            ) : null}

            {hub?.hasActiveLink && !readingDevotional.readByMe ? (
              <CouplesPrimaryButton className="mt-10" disabled={busy} onClick={() => void markRead(readingDevotional.id)}>
                Mark as Read
              </CouplesPrimaryButton>
            ) : readingDevotional.readByMe ? (
              <p className="mt-10 text-center text-sm font-medium text-[var(--couples-gold)]">Marked as read</p>
            ) : null}
          </article>
        </div>
      ) : null}
    </div>
  );
}
