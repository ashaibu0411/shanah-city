"use client";

import { useState } from "react";
import { marriagePremium } from "@/components/marriage/marriage-counseling-premium";
import type {
  TemperamentSnapshotRow,
  TemperamentSnapshotSection,
} from "@/lib/marriage-stage2-temperament-scoring-v2";

function RowColumns({ row }: { row: TemperamentSnapshotRow }) {
  return (
    <div className="mt-2 grid gap-2 sm:grid-cols-2 text-sm">
      <div>
        <span className="text-xs font-bold uppercase text-night-500">You</span>
        <p className="mt-0.5">{row.viewer.summaryLabel ?? "—"}</p>
        {row.viewer.status === "insufficient_data" && row.viewer.answeredCount != null && (
          <p className="text-xs text-night-500">
            Answered {row.viewer.answeredCount} of {row.viewer.eligibleCount ?? "?"} in this group.
          </p>
        )}
      </div>
      <div>
        <span className="text-xs font-bold uppercase text-night-500">Partner</span>
        <p className="mt-0.5">{row.partner.summaryLabel ?? "—"}</p>
        {row.partner.status === "insufficient_data" && row.partner.answeredCount != null && (
          <p className="text-xs text-night-500">
            Answered {row.partner.answeredCount} of {row.partner.eligibleCount ?? "?"} in this group.
          </p>
        )}
      </div>
    </div>
  );
}

function SectionBlock({ section }: { section: TemperamentSnapshotSection }) {
  const subscales = section.rows.filter((r) => r.rowKind === "subscale");
  const individuals = section.rows.filter((r) => r.rowKind === "individual_preference");
  const [openIndividuals, setOpenIndividuals] = useState(!section.collapseIndividualPreferences);

  return (
    <li className="rounded-xl border border-night-900/8 p-4 dark:border-white/10">
      <p className="font-display text-base font-semibold">{section.groupTitle}</p>
      <ul className="mt-3 space-y-4">
        {subscales.map((row) => (
          <li key={row.rowId}>
            <p className="text-sm font-semibold">{row.title}</p>
            <RowColumns row={row} />
            <p className="mt-2 text-sm text-clay-800 dark:text-clay-200">{row.conversationPrompt}</p>
          </li>
        ))}
      </ul>
      {individuals.length > 0 && (
        <div className="mt-4">
          <button
            type="button"
            className={`${marriagePremium.secondaryCta} min-h-[40px] text-sm`}
            aria-expanded={openIndividuals}
            onClick={() => setOpenIndividuals((v) => !v)}
          >
            {openIndividuals ? "Hide" : "Show"} individual preferences ({individuals.length})
          </button>
          {openIndividuals && (
            <ul className="mt-3 space-y-3 border-t border-night-900/8 pt-3 dark:border-white/10">
              {individuals.map((row) => (
                <li key={row.rowId}>
                  <p className="text-sm font-medium">{row.title}</p>
                  <RowColumns row={row} />
                  <p className="mt-1 text-xs text-clay-800 dark:text-clay-200">{row.conversationPrompt}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </li>
  );
}

export function MarriageTemperamentSnapshotView({
  sections,
  disclaimer,
  scoringModelVersion,
}: {
  sections: TemperamentSnapshotSection[];
  disclaimer: string;
  scoringModelVersion: string;
}) {
  if (!sections.length) return null;

  return (
    <div data-testid="temperament-snapshot">
      <p className={`${marriagePremium.cardMuted} mt-1 text-sm`}>{disclaimer}</p>
      <ul className="mt-4 space-y-4">
        {sections.map((section) => (
          <SectionBlock key={section.groupTitle} section={section} />
        ))}
      </ul>
      <p className="mt-3 text-xs text-night-500" data-testid="temperament-scoring-model-version">
        Scoring model: {scoringModelVersion}
      </p>
    </div>
  );
}
