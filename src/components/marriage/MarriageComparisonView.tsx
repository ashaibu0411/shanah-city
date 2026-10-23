"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { marriagePremium } from "@/components/marriage/marriage-counseling-premium";
import { MarriageTemperamentSummary } from "@/components/marriage/MarriageTemperamentSummary";
import type { MarriageComparisonItem } from "@/lib/marriage-counseling-types";
import { budgetExpenseTotal, normalizeBudgetAnswer } from "@/lib/marriage-budget-utils";
import { readJsonResponse } from "@/lib/read-json-response";

function badge(category: MarriageComparisonItem["category"]) {
  if (category === "aligned") return marriagePremium.badgeAligned;
  if (category === "needs_conversation") return marriagePremium.badgeTalk;
  if (category === "different") return marriagePremium.badgeDifferent;
  return "rounded-full bg-stone-100 px-2 py-0.5 text-xs font-semibold text-stone-700";
}

function label(category: MarriageComparisonItem["category"]) {
  if (category === "aligned") return "Aligned";
  if (category === "needs_conversation") return "Needs conversation";
  if (category === "different") return "Different perspectives";
  return "Not yet discussed";
}

function formatAnswer(value: unknown) {
  if (value === "__skip__") return "Prefer not to answer";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object" && value && "choice" in (value as object)) {
    return `Prediction: ${(value as { choice: string }).choice}`;
  }
  const budget = normalizeBudgetAnswer(value);
  if (budget) {
    const total = budgetExpenseTotal(budget);
    return `Budget — income $${budget.monthlyIncome}, expenses $${total}, remaining $${budget.monthlyIncome - total}`;
  }
  if (typeof value === "object" && value) return JSON.stringify(value);
  return String(value ?? "—");
}

export function MarriageComparisonView({ moduleId }: { moduleId: string }) {
  const [items, setItems] = useState<MarriageComparisonItem[]>([]);
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [busyQ, setBusyQ] = useState<string | null>(null);
  const [actionError, setActionError] = useState<Record<string, string>>({});
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({});
  const [noteOpenQ, setNoteOpenQ] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/marriage/comparison/${moduleId}`, { cache: "no-store" });
    const data = await readJsonResponse<{
      items: MarriageComparisonItem[];
      moduleTitle: string;
      viewerId?: string;
      error?: string;
    }>(res);
    if (!res.ok) {
      setError(data.error ?? "Comparison not available.");
      return;
    }
    setItems(data.items);
    setTitle(data.moduleTitle);
    if (data.viewerId) setViewerId(data.viewerId);
    setError("");
  }, [moduleId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function postDiscussion(
    questionId: string,
    payload: { action: "mark" | "reopen" | "note"; sharedNote?: string },
  ) {
    setBusyQ(questionId);
    setActionError((prev) => {
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
    try {
      const res = await fetch("/api/marriage/discussion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleId, questionId, ...payload }),
      });
      const body = await readJsonResponse<{ error?: string }>(res);
      if (!res.ok) {
        setActionError((prev) => ({
          ...prev,
          [questionId]: body.error ?? "Could not save discussion status.",
        }));
        return;
      }
      if (payload.action === "note") {
        setNoteOpenQ(null);
        setNoteDraft((prev) => {
          const next = { ...prev };
          delete next[questionId];
          return next;
        });
      }
      await load();
    } finally {
      setBusyQ(null);
    }
  }

  if (error) {
    return (
      <div className={marriagePremium.card}>
        <p className="text-sm text-red-800">{error}</p>
        <Link href="/marriage" className={`${marriagePremium.secondaryCta} mt-4`}>
          Back to hub
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0" data-testid="marriage-comparison-view">
      <Link href="/marriage" className="text-sm font-semibold text-clay-700">
        ← Hub
      </Link>
      <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-3xl">Let&apos;s talk about it</h1>
      <p className={marriagePremium.cardMuted}>{title}</p>
      <p className={`${marriagePremium.cardMuted} mt-1 text-xs`}>
        &ldquo;Discussed&rdquo; means you talked about it — not that you agree or have resolved everything.
      </p>

      {moduleId === "s2-temperament-discovery" && <MarriageTemperamentSummary />}

      <ul className="mt-6 space-y-4">
        {items.map((item) => {
          const discussed = item.discussion?.discussed === true;
          const busy = busyQ === item.questionId;
          const err = actionError[item.questionId];
          const markedByYou = item.discussion?.markedByUserId === viewerId;

          return (
            <li key={item.questionId} className={marriagePremium.card} data-testid={`compare-card-${item.questionId}`}>
              <div className="flex flex-wrap items-center gap-2">
                <span className={badge(item.category)}>{label(item.category)}</span>
                {discussed && (
                  <span
                    className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-100"
                    data-testid={`discussed-badge-${item.questionId}`}
                  >
                    <span aria-hidden>✓</span> Discussed
                  </span>
                )}
              </div>
              {discussed && item.discussion?.markedAt && (
                <p className="mt-1 text-xs text-night-500">
                  Marked {markedByYou ? "by you" : "by your partner"}{" "}
                  {new Date(item.discussion.markedAt).toLocaleString()}
                </p>
              )}
              <p className="mt-2 text-sm font-semibold">{item.prompt}</p>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div className="min-w-0 rounded-2xl border border-night-900/10 bg-stone-50/90 p-4 text-sm dark:border-white/10 dark:bg-white/[0.04]">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-night-500">You</p>
                  <p className="mt-2 break-words leading-relaxed">{formatAnswer(item.myAnswer)}</p>
                </div>
                <div className="min-w-0 rounded-2xl border border-night-900/10 bg-stone-50/90 p-4 text-sm dark:border-white/10 dark:bg-white/[0.04]">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-night-500">Partner</p>
                  <p className="mt-2 break-words leading-relaxed">{formatAnswer(item.partnerAnswer)}</p>
                </div>
              </div>
              {item.discussionPrompt && (
                <p className={`${marriagePremium.cardMuted} mt-3`}>{item.discussionPrompt}</p>
              )}

              {item.discussion?.sharedNotes?.length ? (
                <div className="mt-3 rounded-xl border border-night-900/10 p-3 dark:border-white/10">
                  <p className="text-xs font-bold uppercase text-night-500">Shared notes (both partners)</p>
                  <ul className="mt-2 space-y-2">
                    {item.discussion.sharedNotes.map((n) => (
                      <li key={`${n.authorUserId}-${n.markedAt}`} className="text-sm">
                        <p className="text-xs text-night-500">
                          {n.authorUserId === viewerId ? "You" : "Partner"} ·{" "}
                          {new Date(n.markedAt).toLocaleDateString()}
                        </p>
                        <p className="mt-0.5 whitespace-pre-wrap">{n.body}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="mt-3 flex flex-wrap gap-2">
                {!discussed ? (
                  <button
                    type="button"
                    className={marriagePremium.primaryCta}
                    disabled={busy}
                    data-testid={`mark-discussed-${item.questionId}`}
                    onClick={() => void postDiscussion(item.questionId, { action: "mark" })}
                  >
                    {busy ? "Saving…" : "Mark discussed"}
                  </button>
                ) : (
                  <button
                    type="button"
                    className={marriagePremium.secondaryCta}
                    disabled={busy}
                    data-testid={`reopen-discussion-${item.questionId}`}
                    onClick={() => void postDiscussion(item.questionId, { action: "reopen" })}
                  >
                    {busy ? "Saving…" : "Reopen discussion"}
                  </button>
                )}
                {discussed && (
                  <button
                    type="button"
                    className={marriagePremium.secondaryCta}
                    disabled={busy}
                    data-testid={`add-note-${item.questionId}`}
                    onClick={() => setNoteOpenQ((q) => (q === item.questionId ? null : item.questionId))}
                  >
                    Add note
                  </button>
                )}
              </div>

              {noteOpenQ === item.questionId && (
                <div className="mt-2">
                  <p className="text-xs text-night-500">This note is visible to both partners on this journey.</p>
                  <textarea
                    className="mt-1 min-h-[72px] w-full max-w-full rounded-xl border border-night-900/10 px-3 py-2 text-sm"
                    placeholder="What you learned together (optional)"
                    value={noteDraft[item.questionId] ?? ""}
                    onChange={(e) =>
                      setNoteDraft((prev) => ({ ...prev, [item.questionId]: e.target.value }))
                    }
                  />
                  <button
                    type="button"
                    className={`${marriagePremium.primaryCta} mt-2`}
                    disabled={busy || !noteDraft[item.questionId]?.trim()}
                    onClick={() =>
                      void postDiscussion(item.questionId, {
                        action: "note",
                        sharedNote: noteDraft[item.questionId],
                      })
                    }
                  >
                    {busy ? "Saving…" : "Save shared note"}
                  </button>
                </div>
              )}

              {err && (
                <p className="mt-2 text-sm text-red-800" data-testid={`discussion-error-${item.questionId}`}>
                  {err}
                </p>
              )}
            </li>
          );
        })}
      </ul>

      <Link href={`/marriage/module/${moduleId}/discuss`} className={`${marriagePremium.primaryCta} mt-6`}>
        Discussion exercises
      </Link>
    </div>
  );
}
