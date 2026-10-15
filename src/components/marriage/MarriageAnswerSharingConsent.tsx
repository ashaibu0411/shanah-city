"use client";

import { useCallback, useEffect, useState } from "react";
import type { MarriageQuestionDefinition } from "@/lib/marriage-counseling-types";
import { questionRequiresExplicitShareConsent } from "@/lib/marriage-stage2-activity-engine";
import { marriagePremium } from "@/components/marriage/marriage-counseling-premium";
import { readJsonResponse } from "@/lib/read-json-response";

export function marriageQuestionSharingLabel(q: MarriageQuestionDefinition): {
  tone: "private" | "shared" | "consent" | "counselor" | "financial";
  text: string;
} {
  if (q.visibility === "private_reflection") {
    return { tone: "private", text: "Stays private — not shown to your partner or in comparison." };
  }
  if (q.visibility === "private_financial_disclosure") {
    return { tone: "financial", text: "Private financial — never shared automatically or in comparison." };
  }
  if (q.visibility === "counselor_with_consent") {
    return { tone: "counselor", text: "Counselor may review only with your consent — not shared with partner." };
  }
  if (q.visibility === "explicit_consent_to_share") {
    return { tone: "consent", text: "You choose whether to include this in comparison after both submit." };
  }
  if (questionRequiresExplicitShareConsent(q)) {
    return { tone: "consent", text: "Sensitive — turn on sharing below to include in comparison." };
  }
  return { tone: "shared", text: "Shared with your partner after you both submit (not before)." };
}

export function MarriageAnswerSharingConsent({
  journeyId,
  moduleId,
  question,
  disabled,
}: {
  journeyId: string;
  moduleId: string;
  question: MarriageQuestionDefinition;
  disabled?: boolean;
}) {
  const needsToggle =
    question.visibility === "explicit_consent_to_share" || questionRequiresExplicitShareConsent(question);
  const [granted, setGranted] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!needsToggle) return;
    setLoading(true);
    const res = await fetch(
      `/api/marriage/stage2?view=sharing_consents&journeyId=${encodeURIComponent(journeyId)}&moduleId=${encodeURIComponent(moduleId)}`,
      { cache: "no-store" },
    );
    const data = await readJsonResponse<Array<{ questionId: string; granted: boolean }>>(res);
    if (res.ok && Array.isArray(data)) {
      const row = data.find((c) => c.questionId === question.id);
      setGranted(row?.granted === true);
    }
    setLoading(false);
  }, [journeyId, moduleId, question.id, needsToggle]);

  useEffect(() => {
    void load();
  }, [load]);

  const label = marriageQuestionSharingLabel(question);

  async function toggle(next: boolean) {
    setGranted(next);
    await fetch("/api/marriage/stage2", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "set_sharing_consent",
        journeyId,
        moduleId,
        questionId: question.id,
        granted: next,
      }),
    });
  }

  const toneTitle =
    label.tone === "private"
      ? "Private"
      : label.tone === "financial"
        ? "Private financial"
        : label.tone === "counselor"
          ? "Counselor"
          : label.tone === "consent"
            ? "Your choice"
            : "Shared after both submit";

  return (
    <div className="mt-3 rounded-xl border border-night-900/8 bg-stone-50/80 p-3 text-sm dark:border-white/10 dark:bg-white/5">
      <p className="text-xs font-bold uppercase tracking-wide text-clay-800">{toneTitle}</p>
      <p className="mt-1 text-night-700 dark:text-night-200">{label.text}</p>
      {needsToggle && (
        <label className="mt-3 flex min-h-[44px] cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            data-testid={`consent-share-${question.id}`}
            disabled={disabled || loading}
            checked={granted}
            onChange={(e) => void toggle(e.target.checked)}
            className="h-5 w-5 rounded border-stone-400"
          />
          <span>
            {granted
              ? "Include my answer in comparison when we both submit"
              : "Keep out of comparison (default for sensitive items)"}
          </span>
        </label>
      )}
    </div>
  );
}
