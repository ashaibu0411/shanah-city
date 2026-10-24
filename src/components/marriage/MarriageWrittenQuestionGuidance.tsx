"use client";

import type { MarriageQuestionDefinition } from "@/lib/marriage-counseling-types";
import { isWrittenResponseQuestion } from "@/lib/marriage-written-question-guidance";

export function MarriageWrittenQuestionGuidance({
  question,
}: {
  question: MarriageQuestionDefinition;
}) {
  if (!isWrittenResponseQuestion(question.type)) return null;
  const hasExplanation = Boolean(question.explanation?.trim());
  const examples = question.writingExamples?.filter((e) => e.trim()) ?? [];
  if (!hasExplanation && examples.length === 0) return null;

  return (
    <div className="marriage-written-guidance mt-3 space-y-3">
      {hasExplanation ? (
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-clay-800 dark:text-clay-300">
            What we mean
          </p>
          <p className="mt-1 text-sm leading-relaxed text-night-700 dark:text-sand-200">
            {question.explanation}
          </p>
        </div>
      ) : null}
      {examples.length > 0 ? (
        <details className="marriage-written-guidance-examples rounded-xl border border-clay-200/80 bg-clay-50/80 px-3 py-2 dark:border-white/10 dark:bg-white/5" open>
          <summary className="cursor-pointer text-xs font-bold uppercase tracking-wide text-clay-800 dark:text-clay-300">
            Examples to help you think
          </summary>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-night-600 dark:text-sand-300">
            {examples.map((ex) => (
              <li key={ex}>{ex}</li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
