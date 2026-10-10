"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { MemberAvatarLink } from "@/components/auth/MemberAvatarLink";
import { CouplesLinkGate } from "@/components/couples/CouplesLinkGate";
import {
  CouplesLoadingSkeleton,
  CouplesPrimaryButton,
  CouplesSecondaryButton,
} from "@/components/couples/design-system";
import { couplesHubPremium } from "@/components/couples/couples-hub-premium";
import {
  CHECK_IN_DIMENSIONS,
  type CheckInDimensionId,
} from "@/lib/couple-check-in-types";
import {
  CHECK_IN_DISPLAY_LABELS,
  CHECK_IN_ICON_RING,
  CHECK_IN_ROW_TINT,
  CHECK_IN_SCALE_LABELS,
  CheckInDimensionIcon,
  isCheckInDimensionComplete,
} from "@/lib/couple-check-in-ui";
import { CHECK_IN_SUBTITLES } from "@/lib/couples-hub-ui";
import type { CouplesHubOverview } from "@/lib/couples-hub-types";
import Link from "next/link";

type AnswerDraft = {
  reflection: string;
  shareWithSpouse: boolean;
  rating?: number | null;
};

function formatWeekLabel(weekStart: string) {
  if (!weekStart) return "";
  const parsed = new Date(`${weekStart}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return `Week of ${weekStart}`;
  return `Week of ${parsed.toLocaleDateString(undefined, { month: "long", day: "numeric" })}`;
}

export function CouplesCheckIn() {
  const { user, loading: authLoading } = useAuth();
  const [hub, setHub] = useState<CouplesHubOverview | null>(null);
  const [weekStart, setWeekStart] = useState("");
  const [partnerName, setPartnerName] = useState<string | null>(null);
  const [myAnswers, setMyAnswers] = useState<
    Partial<
      Record<
        CheckInDimensionId,
        { reflection?: string; rating?: number; shareWithSpouse: boolean }
      >
    >
  >({});
  const [spouseShared, setSpouseShared] = useState<
    Partial<Record<CheckInDimensionId, { reflection?: string }>>
  >({});
  const [drafts, setDrafts] = useState<Partial<Record<CheckInDimensionId, AnswerDraft>>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [activeDimension, setActiveDimension] = useState<CheckInDimensionId | null>(null);

  const locked = !hub?.hasActiveLink;

  const completedCount = useMemo(() => {
    return CHECK_IN_DIMENSIONS.filter((dim) => {
      const draft = drafts[dim.id];
      const saved = myAnswers[dim.id];
      return isCheckInDimensionComplete({
        reflection: draft?.reflection ?? saved?.reflection ?? "",
        rating: draft?.rating ?? saved?.rating ?? null,
      });
    }).length;
  }, [drafts, myAnswers]);

  const progressPct = Math.round((completedCount / CHECK_IN_DIMENSIONS.length) * 100);

  const activeIndex = activeDimension
    ? CHECK_IN_DIMENSIONS.findIndex((d) => d.id === activeDimension)
    : -1;

  const loadHub = useCallback(() => {
    return fetch("/api/couples/hub")
      .then(async (response) => {
        const data = await response.json();
        if (response.ok) setHub(data.overview ?? null);
      })
      .catch(() => undefined);
  }, []);

  const loadCheckIn = useCallback(() => {
    setLoading(true);
    setError(null);
    return fetch("/api/couples/check-in")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Could not load check-in.");
        setWeekStart(String(data.weekStart ?? ""));
        setPartnerName(data.partnerName ?? null);
        setMyAnswers(data.myAnswers ?? {});
        setSpouseShared(data.spouseShared ?? {});
        const nextDrafts: Partial<Record<CheckInDimensionId, AnswerDraft>> = {};
        for (const dim of CHECK_IN_DIMENSIONS) {
          const mine = data.myAnswers?.[dim.id];
          nextDrafts[dim.id] = {
            reflection: mine?.reflection ?? "",
            shareWithSpouse: Boolean(mine?.shareWithSpouse),
            rating: mine?.rating ?? null,
          };
        }
        setDrafts(nextDrafts);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Could not load check-in.");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    void loadHub();
  }, [loadHub]);

  useEffect(() => {
    if (!locked) void loadCheckIn();
  }, [loadCheckIn, locked]);

  async function saveDimension(dimension: CheckInDimensionId, patch?: Partial<AnswerDraft>) {
    const draft = { ...(drafts[dimension] ?? { reflection: "", shareWithSpouse: false }), ...patch };
    if (!weekStart) return false;
    setBusy(true);
    setStatus(null);
    const ratingPayload =
      draft.rating === null ? null : draft.rating !== undefined && draft.rating !== null ? draft.rating : undefined;
    const response = await fetch("/api/couples/check-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "save",
        weekStart,
        dimension,
        reflection: draft.reflection,
        rating: ratingPayload,
        shareWithSpouse: draft.shareWithSpouse,
      }),
    });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) {
      setStatus(data.error ?? "Could not save.");
      return false;
    }
    setMyAnswers(data.myAnswers ?? {});
    setSpouseShared(data.spouseShared ?? {});
    setDrafts((prev) => ({
      ...prev,
      [dimension]: {
        reflection: data.myAnswers?.[dimension]?.reflection ?? draft.reflection,
        shareWithSpouse: Boolean(data.myAnswers?.[dimension]?.shareWithSpouse),
        rating: data.myAnswers?.[dimension]?.rating ?? draft.rating ?? null,
      },
    }));
    return true;
  }

  function openDimension(id: CheckInDimensionId) {
    setActiveDimension(id);
    setStatus(null);
  }

  async function closeReflection() {
    if (activeDimension) await saveDimension(activeDimension);
    setActiveDimension(null);
  }

  async function goToStep(offset: number) {
    if (activeIndex < 0 || !activeDimension) return;
    const saved = await saveDimension(activeDimension);
    if (!saved && offset > 0) return;
    const next = activeIndex + offset;
    if (next < 0 || next >= CHECK_IN_DIMENSIONS.length) {
      setActiveDimension(null);
      return;
    }
    setActiveDimension(CHECK_IN_DIMENSIONS[next].id);
  }

  const reflectionDim = activeDimension
    ? CHECK_IN_DIMENSIONS.find((d) => d.id === activeDimension)
    : null;
  const reflectionDraft = activeDimension
    ? (drafts[activeDimension] ?? { reflection: "", shareWithSpouse: false, rating: null })
    : null;
  const sharedForActive = activeDimension ? spouseShared[activeDimension] : undefined;

  return (
    <div className={`${couplesHubPremium.page} couples-hub-typography min-h-full`}>
      <div className="mx-auto w-full max-w-lg">
        {!activeDimension ? (
          <header
            className="sticky top-0 z-20 flex min-h-[3.25rem] items-center gap-2 bg-[var(--couples-midnight)] px-[var(--couples-page-padding)] py-3 text-white safe-top"
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
              Marriage Check-In
            </h1>
            <MemberAvatarLink
              user={user}
              loading={authLoading}
              size="sm"
              className="!h-10 !w-10 shrink-0 ring-white/20"
            />
          </header>
        ) : null}

        <main className="px-[var(--couples-page-padding)] pb-10 pt-4">
          {locked ? (
            <CouplesLinkGate pendingIncoming={hub?.pendingIncomingInvite} />
          ) : loading ? (
            <CouplesLoadingSkeleton rows={5} />
          ) : error ? (
            <p className={couplesHubPremium.sheetStatusError}>{error}</p>
          ) : activeDimension && reflectionDim && reflectionDraft ? (
            <ReflectionFlow
              dimension={reflectionDim}
              draft={reflectionDraft}
              stepIndex={activeIndex}
              totalSteps={CHECK_IN_DIMENSIONS.length}
              partnerName={partnerName ?? "your spouse"}
              shared={sharedForActive}
              busy={busy}
              status={status}
              onBack={() => void closeReflection()}
              onDraftChange={(patch) =>
                setDrafts((prev) => ({
                  ...prev,
                  [activeDimension]: { ...reflectionDraft, ...patch },
                }))
              }
              onToggleShare={async () => {
                const nextShare = !reflectionDraft.shareWithSpouse;
                setDrafts((prev) => ({
                  ...prev,
                  [activeDimension]: { ...reflectionDraft, shareWithSpouse: nextShare },
                }));
                await saveDimension(activeDimension, { shareWithSpouse: nextShare });
              }}
              onPrevious={() => void goToStep(-1)}
              onNext={() => void goToStep(1)}
            />
          ) : (
            <>
              <section
                className="rounded-[var(--couples-radius-card)] bg-gradient-to-b from-[var(--couples-ivory)] to-white p-6 shadow-sm ring-1 ring-[var(--couples-border)]"
              >
                <h2
                  className="font-[family-name:var(--font-couples-display)] text-2xl font-semibold text-[var(--couples-text)]"
                >
                  Weekly Check-In
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-[var(--couples-muted)]">
                  Take time to reflect, communicate and grow together.
                </p>
                <div className="mt-5">
                  <div
                    className="h-2 overflow-hidden rounded-full bg-[var(--couples-gold-light)]/50"
                    role="progressbar"
                    aria-valuenow={completedCount}
                    aria-valuemin={0}
                    aria-valuemax={CHECK_IN_DIMENSIONS.length}
                    aria-label="Check-in progress"
                  >
                    <div
                      className="h-full rounded-full bg-[var(--couples-gold)] transition-[width] duration-500 motion-reduce:transition-none"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <p className="mt-2 text-sm font-medium text-[var(--couples-text)]">
                    {completedCount} of {CHECK_IN_DIMENSIONS.length} completed
                  </p>
                  {weekStart ? (
                    <p className="mt-1 text-xs text-[var(--couples-muted)]">{formatWeekLabel(weekStart)}</p>
                  ) : null}
                </div>
              </section>

              <ul className="mt-5 space-y-2.5">
                {CHECK_IN_DIMENSIONS.map((dim) => {
                  const draft = drafts[dim.id];
                  const done = isCheckInDimensionComplete({
                    reflection: draft?.reflection ?? myAnswers[dim.id]?.reflection ?? "",
                    rating: draft?.rating ?? myAnswers[dim.id]?.rating ?? null,
                  });
                  return (
                    <li key={dim.id}>
                      <button
                        type="button"
                        onClick={() => openDimension(dim.id)}
                        className={`flex min-h-[4.75rem] w-full items-center gap-3 rounded-2xl px-4 py-3 text-left ring-1 transition active:scale-[0.99] motion-reduce:transition-none ${CHECK_IN_ROW_TINT[dim.id]} ${
                          done ? "opacity-100" : "opacity-95"
                        }`}
                      >
                        <span
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${CHECK_IN_ICON_RING[dim.id]}`}
                          aria-hidden
                        >
                          <CheckInDimensionIcon dimension={dim.id} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <p className="font-semibold text-[var(--couples-text)]">
                            {CHECK_IN_DISPLAY_LABELS[dim.id]}
                          </p>
                          <p className="text-xs text-[var(--couples-muted)]">{CHECK_IN_SUBTITLES[dim.id]}</p>
                        </span>
                        <span className="flex shrink-0 items-center gap-2 text-[var(--couples-muted)]">
                          {done ? (
                            <span className="text-xs font-semibold text-[var(--couples-gold)]">Done</span>
                          ) : null}
                          <span className="text-lg" aria-hidden>›</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>

              <p className="mt-6 text-center text-xs leading-relaxed text-[var(--couples-muted)]">
                Your reflections stay private unless you choose to share them. There are no scores or
                comparisons—just space to grow together.
              </p>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function ReflectionFlow({
  dimension,
  draft,
  stepIndex,
  totalSteps,
  partnerName,
  shared,
  busy,
  status,
  onBack,
  onDraftChange,
  onToggleShare,
  onPrevious,
  onNext,
}: {
  dimension: (typeof CHECK_IN_DIMENSIONS)[number];
  draft: AnswerDraft;
  stepIndex: number;
  totalSteps: number;
  partnerName: string;
  shared?: { reflection?: string };
  busy: boolean;
  status: string | null;
  onBack: () => void;
  onDraftChange: (patch: Partial<AnswerDraft>) => void;
  onToggleShare: () => void;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const scaleHint =
    draft.rating != null && draft.rating >= 1 && draft.rating <= 5
      ? CHECK_IN_SCALE_LABELS[draft.rating - 1]
      : "Optional — tap how this area feels this week";

  return (
    <div>
      <header className="mb-4 flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--couples-midnight)] text-2xl font-light text-white transition hover:bg-[var(--couples-midnight)]/90"
          aria-label="Back to categories"
        >
          ‹
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--couples-muted)]">
            {stepIndex + 1} of {totalSteps}
          </p>
          <h2 className="truncate font-[family-name:var(--font-couples-display)] text-lg font-semibold text-[var(--couples-text)]">
            {CHECK_IN_DISPLAY_LABELS[dimension.id]}
          </h2>
        </div>
      </header>

      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-[var(--couples-gold-light)]/45">
        <div
          className="h-full rounded-full bg-[var(--couples-gold)] transition-[width]"
          style={{ width: `${((stepIndex + 1) / totalSteps) * 100}%` }}
        />
      </div>

      <div className="rounded-[var(--couples-radius-card)] bg-white p-5 shadow-sm ring-1 ring-[var(--couples-border)]">
        <p className="font-[family-name:var(--font-couples-display)] text-xl leading-snug text-[var(--couples-text)]">
          {dimension.prompt}
        </p>

        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--couples-muted)]">
            How it feels
          </p>
          <p className="mt-1 text-sm text-[var(--couples-muted)]">{scaleHint}</p>
          <div className="mt-3 flex justify-between gap-1" role="group" aria-label="Optional rating 1 to 5">
            {[1, 2, 3, 4, 5].map((value) => {
              const selected = draft.rating === value;
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() =>
                    onDraftChange({ rating: selected ? null : value })
                  }
                  className={`flex h-11 flex-1 items-center justify-center rounded-xl text-sm font-semibold transition motion-reduce:transition-none ${
                    selected
                      ? "bg-[var(--couples-midnight)] text-white shadow-sm"
                      : "bg-[var(--couples-ivory)] text-[var(--couples-text)] ring-1 ring-[var(--couples-border)] hover:bg-white"
                  }`}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </div>

        <label className="mt-6 block">
          <span className="text-xs font-semibold uppercase tracking-wide text-[var(--couples-muted)]">
            Private notes
          </span>
          <textarea
            rows={5}
            className={`mt-2 ${couplesHubPremium.sheetInput} min-h-[8rem] resize-y text-base leading-relaxed`}
            value={draft.reflection}
            onChange={(event) => onDraftChange({ reflection: event.target.value })}
            placeholder="Only you see this unless you choose to share…"
          />
        </label>

        <button
          type="button"
          onClick={() => void onToggleShare()}
          disabled={busy}
          className={`mt-5 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-semibold transition motion-reduce:transition-none ${
            draft.shareWithSpouse
              ? "bg-[var(--couples-gold-light)] text-[var(--couples-text)] ring-2 ring-[var(--couples-gold)]"
              : "bg-[var(--couples-ivory)] text-[var(--couples-text)] ring-1 ring-[var(--couples-border)] hover:bg-white"
          }`}
        >
          <span aria-hidden>{draft.shareWithSpouse ? "♥" : "○"}</span>
          {draft.shareWithSpouse ? "Sharing with " + partnerName : "Share my reflection"}
        </button>

        {shared?.reflection ? (
          <div className="mt-5 rounded-2xl bg-[var(--couples-ivory)] p-4 ring-1 ring-[var(--couples-border)]">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--couples-muted)]">
              {partnerName} shared
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[var(--couples-text)]">
              {shared.reflection}
            </p>
            <p className="mt-3 text-xs leading-relaxed text-[var(--couples-muted)]">
              Conversation starter: {dimension.conversationStarter}
            </p>
          </div>
        ) : (
          <p className="mt-4 text-xs leading-relaxed text-[var(--couples-muted)]">
            When you are ready to talk, try: {dimension.conversationStarter}
          </p>
        )}
      </div>

      <div className="mt-5 flex gap-3">
        <CouplesSecondaryButton className="flex-1" onClick={onPrevious}>
          Previous
        </CouplesSecondaryButton>
        <CouplesPrimaryButton
          type="button"
          className="flex-1"
          onClick={onNext}
          disabled={busy}
        >
          {stepIndex >= totalSteps - 1 ? "Finish" : "Next"}
        </CouplesPrimaryButton>
      </div>

      {status ? <p className={`mt-3 text-center text-sm ${couplesHubPremium.sheetStatusError}`}>{status}</p> : null}
    </div>
  );
}
