"use client";

import { useState } from "react";
import { marriagePremium } from "@/components/marriage/marriage-counseling-premium";
import type {
  TemperamentRowPresentation,
  TemperamentSnapshotRow,
  TemperamentSnapshotSection,
} from "@/lib/marriage-stage2-temperament-scoring-v2";

function softenConversationPrompt(text: string) {
  return text
    .replace(/Large difference — go slowly; counselor optional if stuck\.\s*/g, "")
    .replace(/Different preferences — plan explicitly\.\s*/g, "")
    .replace(/Similar on this theme — compare stories, not scores\.\s*/g, "")
    .replace(/You answered differently on “([^”]+)”\.\s*/g, "You see “$1” differently — ")
    .trim();
}

function splitSummaryLabel(label: string | undefined): { headline: string; detail: string } {
  if (!label) return { headline: "—", detail: "" };
  const dot = label.indexOf(". ");
  if (dot === -1) return { headline: label, detail: "" };
  return {
    headline: label.slice(0, dot + 1),
    detail: label.slice(dot + 2),
  };
}

function answeredCountLine(p: TemperamentRowPresentation) {
  if (p.answeredCount == null || p.eligibleCount == null) return null;
  if (p.status === "not_answered") return null;
  return `Based on ${p.answeredCount} of ${p.eligibleCount} question${p.eligibleCount === 1 ? "" : "s"}.`;
}

function ConversationIcon() {
  return (
    <svg
      className="h-5 w-5 shrink-0 text-clay-700 dark:text-clay-300"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7.5 8.25h9m-9 3H12m-9 3.75v-7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21.25 7.5v7.5a2.25 2.25 0 0 1-2.25 2.25H9l-4.5 3v-3.75Z"
      />
    </svg>
  );
}

function PartnerResultCard({
  role,
  presentation,
  testId,
}: {
  role: "You" | "Partner";
  presentation: TemperamentRowPresentation;
  testId: string;
}) {
  const { headline, detail } = splitSummaryLabel(presentation.summaryLabel);
  const countLine = answeredCountLine(presentation);

  return (
    <div
      className="flex min-w-0 flex-1 flex-col rounded-2xl border border-night-900/10 bg-stone-50/90 p-4 shadow-sm sm:p-5 dark:border-white/12 dark:bg-white/[0.04]"
      data-testid={testId}
    >
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-clay-800 dark:text-clay-300">{role}</p>
      <p className="mt-3 font-display text-base font-semibold leading-snug text-night-900 dark:text-sand-50 sm:text-lg">
        {headline}
      </p>
      {detail ? (
        <p className="mt-2 text-sm leading-relaxed text-night-700 dark:text-sand-300">{detail}</p>
      ) : null}
      {countLine ? (
        <p className="mt-3 text-xs leading-relaxed text-night-500 dark:text-sand-500">{countLine}</p>
      ) : null}
    </div>
  );
}

function SnapshotRowBlock({ row }: { row: TemperamentSnapshotRow }) {
  const prompt = softenConversationPrompt(row.conversationPrompt);

  return (
    <li
      className="rounded-2xl border border-night-900/8 bg-white p-4 sm:p-6 dark:border-white/10 dark:bg-[var(--color-surface)]"
      data-testid={`temperament-snapshot-row-${row.rowId}`}
    >
      <h4 className="font-display text-base font-semibold leading-snug text-night-900 dark:text-sand-50 sm:text-lg">
        {row.title}
      </h4>

      <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-stretch">
        <PartnerResultCard role="You" presentation={row.viewer} testId={`temperament-card-you-${row.rowId}`} />
        <PartnerResultCard
          role="Partner"
          presentation={row.partner}
          testId={`temperament-card-partner-${row.rowId}`}
        />
      </div>

      {prompt ? (
        <div
          className="mt-5 rounded-xl border border-clay-200/80 bg-gradient-to-br from-clay-50/90 to-stone-50/50 p-4 sm:p-5 dark:border-clay-800/40 dark:from-clay-950/30 dark:to-night-900/20"
          data-testid={`temperament-prompt-${row.rowId}`}
        >
          <div className="flex items-start gap-3">
            <ConversationIcon />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-clay-800 dark:text-clay-300">
                Conversation starter
              </p>
              <p className="mt-2 text-sm leading-relaxed text-night-800 dark:text-sand-200">{prompt}</p>
            </div>
          </div>
        </div>
      ) : null}
    </li>
  );
}

function SectionBlock({ section }: { section: TemperamentSnapshotSection }) {
  const subscales = section.rows.filter((r) => r.rowKind === "subscale");
  const individuals = section.rows.filter((r) => r.rowKind === "individual_preference");
  const [openIndividuals, setOpenIndividuals] = useState(false);

  return (
    <li
      className="rounded-[1.25rem] border border-night-900/10 bg-white/60 p-4 shadow-sm sm:p-6 dark:border-white/10 dark:bg-[var(--color-surface)]/80"
      data-testid={`temperament-section-${section.groupTitle.replace(/\s+/g, "-").toLowerCase()}`}
    >
      <h3 className="font-display text-lg font-semibold tracking-tight text-night-900 dark:text-sand-50 sm:text-xl">
        {section.groupTitle}
      </h3>

      {subscales.length > 0 && (
        <ul className="mt-5 space-y-6">
          {subscales.map((row) => (
            <SnapshotRowBlock key={row.rowId} row={row} />
          ))}
        </ul>
      )}

      {individuals.length > 0 && (
        <div className={subscales.length > 0 ? "mt-6 border-t border-night-900/8 pt-5 dark:border-white/10" : "mt-2"}>
          <button
            type="button"
            className={`${marriagePremium.secondaryCta} max-w-md text-sm sm:w-auto sm:min-w-[280px]`}
            aria-expanded={openIndividuals}
            onClick={() => setOpenIndividuals((v) => !v)}
          >
            {openIndividuals ? "Hide" : "Show"} individual preferences ({individuals.length})
          </button>
          {openIndividuals && (
            <ul className="mt-4 space-y-5">
              {individuals.map((row) => (
                <SnapshotRowBlock key={row.rowId} row={row} />
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
    <div className="w-full min-w-0" data-testid="temperament-snapshot">
      <p className={`${marriagePremium.cardMuted} mt-1 text-sm leading-relaxed sm:text-[0.9375rem]`}>
        {disclaimer}
      </p>
      <ul className="mt-6 space-y-8">
        {sections.map((section) => (
          <SectionBlock key={section.groupTitle} section={section} />
        ))}
      </ul>
      <p
        className="mt-6 text-xs leading-relaxed text-night-500 dark:text-sand-500"
        data-testid="temperament-scoring-model-version"
      >
        Scoring model: {scoringModelVersion}
      </p>
    </div>
  );
}
