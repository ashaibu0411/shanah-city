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
  const [note, setNote] = useState("");
  const [activeQ, setActiveQ] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/marriage/comparison/${moduleId}`, { cache: "no-store" });
    const data = await readJsonResponse<{
      items: MarriageComparisonItem[];
      moduleTitle: string;
      error?: string;
    }>(res);
    if (!res.ok) {
      setError(data.error ?? "Comparison not available.");
      return;
    }
    setItems(data.items);
    setTitle(data.moduleTitle);
  }, [moduleId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function markDiscussed(questionId: string) {
    await fetch("/api/marriage/discussion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moduleId, questionId, sharedNote: note || undefined }),
    });
    setNote("");
    setActiveQ(null);
    await load();
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
    <div>
      <Link href="/marriage" className="text-sm font-semibold text-clay-700">
        ← Hub
      </Link>
      <h1 className="mt-2 font-display text-xl font-semibold">Let&apos;s talk about it</h1>
      <p className={marriagePremium.cardMuted}>{title}</p>

      {moduleId === "s2-temperament-discovery" && <MarriageTemperamentSummary />}

      <ul className="mt-6 space-y-4">
        {items.map((item) => (
          <li key={item.questionId} className={marriagePremium.card}>
            <span className={badge(item.category)}>{label(item.category)}</span>
            <p className="mt-2 text-sm font-semibold">{item.prompt}</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl bg-stone-50 p-3 text-sm dark:bg-white/5">
                <p className="text-xs font-bold uppercase text-night-500">You</p>
                <p className="mt-1">{formatAnswer(item.myAnswer)}</p>
              </div>
              <div className="rounded-xl bg-stone-50 p-3 text-sm dark:bg-white/5">
                <p className="text-xs font-bold uppercase text-night-500">Partner</p>
                <p className="mt-1">{formatAnswer(item.partnerAnswer)}</p>
              </div>
            </div>
            {item.discussionPrompt && (
              <p className={`${marriagePremium.cardMuted} mt-3`}>{item.discussionPrompt}</p>
            )}
            <button
              type="button"
              className={`${marriagePremium.secondaryCta} mt-3`}
              onClick={() => setActiveQ(item.questionId)}
            >
              Mark discussed
            </button>
            {activeQ === item.questionId && (
              <div className="mt-2">
                <textarea
                  className="w-full rounded-xl border border-night-900/10 px-3 py-2 text-sm"
                  placeholder="Optional shared note (what you learned)"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
                <button
                  type="button"
                  className={`${marriagePremium.primaryCta} mt-2`}
                  onClick={() => markDiscussed(item.questionId)}
                >
                  Save
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>

      <Link href={`/marriage/module/${moduleId}/discuss`} className={`${marriagePremium.primaryCta} mt-6`}>
        Discussion exercises
      </Link>
    </div>
  );
}
