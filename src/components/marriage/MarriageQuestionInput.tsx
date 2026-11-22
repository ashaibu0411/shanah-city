"use client";

import { useRef } from "react";
import type { MarriageQuestionDefinition } from "@/lib/marriage-counseling-types";
import { marriagePremium } from "@/components/marriage/marriage-counseling-premium";
import { MarriageBudgetWorksheet } from "@/components/marriage/MarriageBudgetWorksheet";
import { MarriageWrittenQuestionGuidance } from "@/components/marriage/MarriageWrittenQuestionGuidance";

/**
 * All written answers use a native textarea on both iOS and Android.
 * A text input cannot accept Return/newline characters in iOS Safari.
 * Keep the stored response as a plain string, including line breaks.
 */
function MarriageWrittenAnswerField({
  value, onChange, disabled, long,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  long: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);


  return (
    <textarea
      ref={ref}
      data-no-autogrow="true"
      rows={long ? 8 : 5}
      className="mt-2 block min-h-36 w-full min-w-0 resize-y overflow-auto whitespace-pre-wrap break-words rounded-xl border border-night-900/10 bg-white px-4 py-3 text-base leading-7 text-night-900 placeholder:text-night-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-white/12 dark:bg-[var(--color-bg-muted)] dark:text-sand-50 dark:placeholder:text-sand-400"
      value={value}
      disabled={disabled}
      aria-label="Your written answer; press Return for a new line"
      placeholder="Share in your own words…"
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

export function MarriageQuestionInput({
  question,
  value,
  onChange,
  disabled,
}: {
  question: MarriageQuestionDefinition;
  value: unknown;
  onChange: (v: unknown) => void;
  disabled?: boolean;
}) {
  const options = question.options ?? [];
  const isWritten = question.type === "long_reflection" || question.type === "short_answer";
  const context = isWritten ? null : (
    <div className="mt-3 rounded-xl border border-night-900/10 bg-sand-50/70 p-3 text-sm leading-relaxed text-night-700 dark:border-white/10 dark:bg-white/5 dark:text-sand-200">
      <p><strong>What we mean: </strong>{question.explanation?.trim() || "Answer based on your own understanding and experience, not what you think your partner expects."}</p>
      {question.type === "multiple_choice" && <p className="mt-2">Choose all options that apply.</p>}
      {(question.type === "ranking" || question.type === "priorities") && <p className="mt-2">Rank the options from most important to least important to you.</p>}
      {question.type === "partner_prediction" && <p className="mt-2">Predict your partner's answer rather than giving your own.</p>}
    </div>
  );

  if (question.type === "budget_worksheet") {
    return <>{context}<MarriageBudgetWorksheet value={value} onChange={onChange} disabled={disabled} /></>;
  }

  if (question.type === "partner_prediction") {
    const choice =
      typeof value === "object" && value && "choice" in (value as object)
        ? String((value as { choice: string }).choice)
        : typeof value === "string"
          ? value
          : "";
    return (
      <div>{context}<ul className="mt-4 space-y-2">
        {options.map((opt) => (
          <li key={opt.id}>
            <button
              type="button"
              disabled={disabled}
              className={`${marriagePremium.optionBtn} ${choice === opt.id ? marriagePremium.optionActive : ""}`}
              onClick={() => onChange({ choice: opt.id })}
            >
              {opt.label}
            </button>
          </li>
        ))}
      </ul></div>
    );
  }

  if (question.type === "long_reflection" || question.type === "short_answer") {
    const multiline = question.type === "long_reflection";
    return (
      <>
        <MarriageWrittenQuestionGuidance question={question} />
        <p className="mt-4 text-xs font-bold uppercase tracking-wide text-night-500 dark:text-sand-400">
          Your answer
        </p>
        <MarriageWrittenAnswerField
          value={typeof value === "string" ? value : ""}
          onChange={onChange}
          disabled={disabled}
          long={multiline}
        />
        <p className="mt-2 text-xs leading-relaxed text-night-500 dark:text-sand-400">
          Write as much as you need. Use Return to add a new line or paragraph.
        </p>
      </>
    );
  }

  if (question.type === "multiple_choice") {
    const selected = Array.isArray(value) ? (value as string[]) : [];
    return (
      <div>{context}<ul className="mt-4 space-y-2">
        {options.map((opt) => {
          const active = selected.includes(opt.id);
          return (
            <li key={opt.id}>
              <button
                type="button"
                disabled={disabled}
                className={`${marriagePremium.optionBtn} ${active ? marriagePremium.optionActive : ""}`}
                onClick={() => {
                  const next = active ? selected.filter((id) => id !== opt.id) : [...selected, opt.id];
                  onChange(next);
                }}
              >
                {opt.label}
              </button>
            </li>
          );
        })}
      </ul></div>
    );
  }

  if (question.type === "priorities" || question.type === "ranking") {
    const order = Array.isArray(value) ? (value as string[]) : options.map((o) => o.id);
    return (
      <div>{context}<ul className="mt-4 space-y-2">
        {order.map((id, rank) => {
          const opt = options.find((o) => o.id === id);
          if (!opt) return null;
          return (
            <li key={id} className={`${marriagePremium.optionBtn} justify-between`}>
              <span>
                {rank + 1}. {opt.label}
              </span>
              <span className="flex gap-1">
                <button
                  type="button"
                  disabled={disabled || rank === 0}
                  className="rounded-lg px-2 py-1 text-xs ring-1 ring-night-900/10"
                  onClick={() => {
                    const next = [...order];
                    [next[rank - 1], next[rank]] = [next[rank], next[rank - 1]];
                    onChange(next);
                  }}
                >
                  ↑
                </button>
                <button
                  type="button"
                  disabled={disabled || rank === order.length - 1}
                  className="rounded-lg px-2 py-1 text-xs ring-1 ring-night-900/10"
                  onClick={() => {
                    const next = [...order];
                    [next[rank], next[rank + 1]] = [next[rank + 1], next[rank]];
                    onChange(next);
                  }}
                >
                  ↓
                </button>
              </span>
            </li>
          );
        })}
      </ul></div>
    );
  }

  return (
    <div>{context}<ul className="mt-4 space-y-2">
      {options.map((opt) => {
        const active = value === opt.id;
        return (
          <li key={opt.id}>
            <button
              type="button"
              disabled={disabled}
              className={`${marriagePremium.optionBtn} ${active ? marriagePremium.optionActive : ""}`}
              onClick={() => onChange(opt.id)}
            >
              {opt.label}
            </button>
          </li>
        );
      })}
    </ul></div>
  );
}
