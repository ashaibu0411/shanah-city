"use client";

import { useState } from "react";
import {
  MARRIAGE_COUNSELING_MODE_OPTIONS,
  type MarriageCounselingDeliveryMode,
} from "@/lib/marriage-counseling-delivery-mode";
import { marriagePremium } from "@/components/marriage/marriage-counseling-premium";
import type { MarriageHubSummary } from "@/lib/marriage-counseling-types";
import { readJsonResponse } from "@/lib/read-json-response";

type Props = {
  journeyId: string;
  experience: NonNullable<MarriageHubSummary["counselingExperience"]>;
  onUpdated: () => void;
};

export function MarriageCoupleCounselingModePanel({ journeyId, experience, onUpdated }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<MarriageCounselingDeliveryMode | null>(
    experience.deliveryMode,
  );

  async function saveMode(mode: MarriageCounselingDeliveryMode) {
    if (!experience.canChangeDeliveryMode || busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/marriage/journey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set_counseling_mode", journeyId, mode }),
      });
      const data = await readJsonResponse<{ error?: string }>(res);
      if (!res.ok) throw new Error(data.error ?? "Could not update counseling mode.");
      setSelected(mode);
      onUpdated();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update.");
    } finally {
      setBusy(false);
    }
  }

  const currentLabel = experience.deliveryModeLabel;

  return (
    <section
      className={`${marriagePremium.card} mt-6`}
      aria-labelledby="counseling-mode-heading"
      id="counseling-mode"
    >
      <h2 id="counseling-mode-heading" className={marriagePremium.sectionLabel}>
        How you will meet with your counselor
      </h2>
      <p className="mt-2 text-sm text-night-800 dark:text-sand-200">
        {experience.deliveryMode
          ? `Your journey is set to ${currentLabel}. Both partners see this choice. Changing the mode does not erase completed assessments or homework.`
          : "Choose how you and your partner will work with your counselor. You can update this later if your plans change."}
      </p>
      {experience.selfPacedDisclaimer ? (
        <p className={`${marriagePremium.cardMuted} mt-2 text-xs`}>{experience.selfPacedDisclaimer}</p>
      ) : null}
      {error ? <p className="mt-2 text-sm text-red-800 dark:text-red-200">{error}</p> : null}
      <ul className="mt-4 space-y-3" role="list">
        {MARRIAGE_COUNSELING_MODE_OPTIONS.map((opt) => {
          const active = (selected ?? experience.deliveryMode) === opt.mode;
          return (
            <li key={opt.mode}>
              <button
                type="button"
                disabled={!experience.canChangeDeliveryMode || busy}
                onClick={() => void saveMode(opt.mode)}
                className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                  active
                    ? "border-clay-600 bg-clay-50/90 dark:border-clay-500 dark:bg-clay-950/40"
                    : "border-stone-200 bg-white dark:border-white/10 dark:bg-night-900/40"
                } ${!experience.canChangeDeliveryMode ? "opacity-70" : "hover:border-clay-500"}`}
                aria-pressed={active}
              >
                <span className="block text-sm font-bold text-night-900 dark:text-sand-100">{opt.title}</span>
                <span className="mt-1 block text-xs leading-relaxed text-night-600 dark:text-sand-400">
                  {opt.summary}
                </span>
                {active ? (
                  <span className="mt-2 inline-block text-xs font-bold uppercase tracking-wide text-clay-700 dark:text-clay-300">
                    Selected
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
      {!experience.canChangeDeliveryMode ? (
        <p className={`${marriagePremium.cardMuted} mt-3 text-xs`}>
          Record your consent on this account to choose or change your counseling mode.
        </p>
      ) : null}
      {experience.selfPacedSessions.length > 0 ? (
        <div className="mt-4 border-t border-stone-200 pt-4 dark:border-white/10">
          <p className="text-xs font-bold uppercase tracking-wide text-night-500">Session review status</p>
          <ul className="mt-2 space-y-1 text-sm">
            {experience.selfPacedSessions.map((s) => (
              <li key={s.sessionKey} className="flex flex-wrap justify-between gap-2">
                <span className="font-medium">{s.sessionKey.replace(/-/g, " ")}</span>
                <span className="text-night-600 capitalize dark:text-sand-400">
                  {s.workflowStatus.replace(/_/g, " ")}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
