"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CouplesHubScreen } from "@/components/couples/CouplesHubScreen";
import { CouplesLinkGate } from "@/components/couples/CouplesLinkGate";
import { couplesHubPremium } from "@/components/couples/couples-hub-premium";
import { Button } from "@/components/ui";
import {
  CHECK_IN_DIMENSIONS,
  type CheckInDimensionId,
} from "@/lib/couple-check-in-types";
import {
  CHECK_IN_EMOJI,
  CHECK_IN_ICON_BG,
  CHECK_IN_SUBTITLES,
} from "@/lib/couples-hub-ui";
import type { CouplesHubOverview } from "@/lib/couples-hub-types";

type AnswerDraft = { reflection: string; shareWithSpouse: boolean };

export function CouplesCheckIn() {
  const [hub, setHub] = useState<CouplesHubOverview | null>(null);
  const [weekStart, setWeekStart] = useState("");
  const [myAnswers, setMyAnswers] = useState<
    Partial<Record<CheckInDimensionId, { reflection?: string; shareWithSpouse: boolean }>>
  >({});
  const [spouseShared, setSpouseShared] = useState<
    Partial<Record<CheckInDimensionId, { reflection?: string }>>
  >({});
  const [drafts, setDrafts] = useState<Partial<Record<CheckInDimensionId, AnswerDraft>>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<CheckInDimensionId | null>("communication");

  const locked = !hub?.hasActiveLink;

  const completedCount = useMemo(() => {
    return CHECK_IN_DIMENSIONS.filter((dim) => {
      const text = drafts[dim.id]?.reflection ?? myAnswers[dim.id]?.reflection ?? "";
      return text.trim().length > 0;
    }).length;
  }, [drafts, myAnswers]);

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
        setMyAnswers(data.myAnswers ?? {});
        setSpouseShared(data.spouseShared ?? {});
        const nextDrafts: Partial<Record<CheckInDimensionId, AnswerDraft>> = {};
        for (const dim of CHECK_IN_DIMENSIONS) {
          const mine = data.myAnswers?.[dim.id];
          nextDrafts[dim.id] = {
            reflection: mine?.reflection ?? "",
            shareWithSpouse: Boolean(mine?.shareWithSpouse),
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

  async function saveDimension(dimension: CheckInDimensionId) {
    const draft = drafts[dimension];
    if (!draft) return;
    setBusy(true);
    setStatus(null);
    const response = await fetch("/api/couples/check-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "save",
        weekStart,
        dimension,
        reflection: draft.reflection,
        shareWithSpouse: draft.shareWithSpouse,
      }),
    });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) {
      setStatus(data.error ?? "Could not save.");
      return;
    }
    setMyAnswers(data.myAnswers ?? {});
    setSpouseShared(data.spouseShared ?? {});
    setStatus("Saved.");
  }

  return (
    <CouplesHubScreen title="Marriage check-in">
        {locked ? (
          <CouplesLinkGate pendingIncoming={hub?.pendingIncomingInvite} />
        ) : loading ? (
          <p className="mt-8 text-center text-sm text-[var(--couples-sheet-muted)]">Loading…</p>
        ) : error ? (
          <p className={couplesHubPremium.sheetStatusError}>{error}</p>
        ) : (
          <>
            <div className="mb-6">
              <h2 className="font-display text-lg font-semibold text-stone-900">Weekly check-in</h2>
              <p className="mt-1 text-sm text-[var(--couples-sheet-muted)]">
                Take time to reflect, communicate, and grow together.
              </p>
              <div className="mt-4 flex gap-1">
                {CHECK_IN_DIMENSIONS.map((dim) => {
                  const done = Boolean(
                    (drafts[dim.id]?.reflection ?? myAnswers[dim.id]?.reflection ?? "").trim(),
                  );
                  const filled = done;
                  return (
                    <div
                      key={dim.id}
                      className={`h-2 flex-1 rounded-full ${filled ? "bg-emerald-600" : "bg-stone-200"}`}
                    />
                  );
                })}
              </div>
              <p className="mt-2 text-right text-xs font-semibold text-[var(--couples-sheet-muted)]">
                {completedCount} of {CHECK_IN_DIMENSIONS.length} completed
              </p>
              {weekStart ? (
                <p className="text-xs text-[var(--couples-sheet-muted)]">Week of {weekStart}</p>
              ) : null}
            </div>

            <ul className="divide-y divide-stone-200 rounded-2xl border border-stone-200/80 bg-white">
              {CHECK_IN_DIMENSIONS.map((dim) => {
                const draft = drafts[dim.id] ?? { reflection: "", shareWithSpouse: false };
                const shared = spouseShared[dim.id];
                const isOpen = expanded === dim.id;
                const done = Boolean((draft.reflection ?? myAnswers[dim.id]?.reflection ?? "").trim());
                return (
                  <li key={dim.id}>
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 px-4 py-4 text-left"
                      onClick={() => setExpanded(isOpen ? null : dim.id)}
                    >
                      <span
                        className={`${couplesHubPremium.iconCircle} ${CHECK_IN_ICON_BG[dim.id]}`}
                        aria-hidden
                      >
                        {CHECK_IN_EMOJI[dim.id]}
                      </span>
                      <span className="min-w-0 flex-1">
                        <p className="font-semibold text-stone-900">{dim.label}</p>
                        <p className="text-xs text-[var(--couples-sheet-muted)]">
                          {CHECK_IN_SUBTITLES[dim.id]}
                        </p>
                      </span>
                      <span className="text-stone-400" aria-hidden>
                        {done ? "✓" : "›"}
                      </span>
                    </button>
                    {isOpen ? (
                    <div className="border-t border-stone-100 bg-stone-50 px-4 py-4">
                    <label className="block text-sm">
                      <span className="font-medium text-[var(--couples-sheet-muted)]">Your reflection</span>
                      <textarea
                        rows={3}
                        className={`mt-1 ${couplesHubPremium.sheetInput}`}
                        value={draft.reflection}
                        onChange={(event) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [dim.id]: { ...draft, reflection: event.target.value },
                          }))
                        }
                        placeholder="A few honest sentences…"
                      />
                    </label>
                    <label className="mt-2 flex items-center gap-2 text-sm text-[var(--couples-sheet-muted)]">
                      <input
                        type="checkbox"
                        checked={draft.shareWithSpouse}
                        onChange={(event) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [dim.id]: { ...draft, shareWithSpouse: event.target.checked },
                          }))
                        }
                      />
                      Share this reflection with my spouse
                    </label>
                    <Button
                      className="mt-3"
                      disabled={busy}
                      onClick={() => void saveDimension(dim.id)}
                    >
                      Save
                    </Button>
                    {shared?.reflection ? (
                      <div className={`${couplesHubPremium.sheetCard} mt-4`}>
                        <p className="text-xs font-bold uppercase text-[var(--couples-sheet-muted)]">Spouse shared</p>
                        <p className="mt-1 whitespace-pre-wrap text-stone-800">
                          {shared.reflection}
                        </p>
                        <p className="mt-2 text-xs text-amber-800">
                          Conversation starter: {dim.conversationStarter}
                        </p>
                      </div>
                    ) : myAnswers[dim.id]?.shareWithSpouse === false && spouseShared[dim.id] === undefined ? (
                      <p className="mt-2 text-xs text-[var(--couples-sheet-muted)]">
                        When you both share, use this prompt: {dim.conversationStarter}
                      </p>
                    ) : null}
                    </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>

            {status ? (
              <p className={couplesHubPremium.sheetStatusOk}>{status}</p>
            ) : null}
          </>
        )}

    </CouplesHubScreen>
  );
}
