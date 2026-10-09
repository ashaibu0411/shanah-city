"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CouplesLinkGate } from "@/components/couples/CouplesLinkGate";
import { CouplesSubpageHeader } from "@/components/couples/CouplesSubpageHeader";
import { couplesHubPremium } from "@/components/couples/couples-hub-premium";
import { Button } from "@/components/ui";
import {
  CHECK_IN_DIMENSIONS,
  type CheckInDimensionId,
} from "@/lib/couple-check-in-types";
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
    <div className={couplesHubPremium.page}>
      <div className={couplesHubPremium.inset}>
        <CouplesSubpageHeader
          title="Marriage check-in"
          subtitle={`Weekly reflection — private until you share with ${hub?.partnerName ?? "your spouse"}.`}
        />

        {locked ? (
          <div className="mt-6">
            <CouplesLinkGate pendingIncoming={hub?.pendingIncomingInvite} />
          </div>
        ) : loading ? (
          <p className="mt-8 text-center text-sm text-night-500">Loading…</p>
        ) : error ? (
          <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        ) : (
          <>
            <div className={`${couplesHubPremium.card} mt-2`}>
              <div className="flex items-center justify-between text-sm font-semibold">
                <span>Weekly check-in</span>
                <span className="text-[var(--couples-text-muted)]">
                  {completedCount} of {CHECK_IN_DIMENSIONS.length} completed
                </span>
              </div>
              <div className={`${couplesHubPremium.progressTrack} mt-3`}>
                <div
                  className={couplesHubPremium.progressFill}
                  style={{
                    width: `${(completedCount / CHECK_IN_DIMENSIONS.length) * 100}%`,
                  }}
                />
              </div>
              {weekStart ? (
                <p className="mt-2 text-xs text-[var(--couples-text-muted)]">Week of {weekStart}</p>
              ) : null}
            </div>

            <ul className="mt-4 space-y-3">
              {CHECK_IN_DIMENSIONS.map((dim) => {
                const draft = drafts[dim.id] ?? { reflection: "", shareWithSpouse: false };
                const shared = spouseShared[dim.id];
                return (
                  <li
                    key={dim.id}
                    className={couplesHubPremium.card}
                  >
                    <p className="text-sm font-semibold">{dim.label}</p>
                    <p className="mt-1 text-sm text-[var(--couples-text-muted)]">{dim.prompt}</p>
                    <label className="mt-3 block text-sm">
                      <span className="font-medium text-[var(--couples-text-muted)]">Your reflection</span>
                      <textarea
                        rows={3}
                        className={`mt-1 ${couplesHubPremium.input}`}
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
                    <label className="mt-2 flex items-center gap-2 text-sm text-[var(--couples-text-muted)]">
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
                      <div className="mt-4 rounded-xl bg-sand-50 px-3 py-2.5 text-sm dark:bg-night-900/40">
                        <p className="text-xs font-bold uppercase text-night-500">Spouse shared</p>
                        <p className="mt-1 whitespace-pre-wrap text-night-800 dark:text-sand-200">
                          {shared.reflection}
                        </p>
                        <p className="mt-2 text-xs text-clay-800 dark:text-clay-200">
                          Conversation starter: {dim.conversationStarter}
                        </p>
                      </div>
                    ) : myAnswers[dim.id]?.shareWithSpouse === false && spouseShared[dim.id] === undefined ? (
                      <p className="mt-2 text-xs text-night-500">
                        When you both share, use this prompt: {dim.conversationStarter}
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ul>

            {status ? (
              <p className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{status}</p>
            ) : null}
          </>
        )}

      </div>
    </div>
  );
}
