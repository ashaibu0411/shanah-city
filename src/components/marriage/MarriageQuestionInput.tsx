"use client";

import type { MarriageQuestionDefinition } from "@/lib/marriage-counseling-types";
import { marriagePremium } from "@/components/marriage/marriage-counseling-premium";
import { MarriageBudgetWorksheet } from "@/components/marriage/MarriageBudgetWorksheet";

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

  if (question.type === "budget_worksheet") {
    return <MarriageBudgetWorksheet value={value} onChange={onChange} disabled={disabled} />;
  }

  if (question.type === "partner_prediction") {
    const choice =
      typeof value === "object" && value && "choice" in (value as object)
        ? String((value as { choice: string }).choice)
        : typeof value === "string"
          ? value
          : "";
    return (
      <ul className="mt-4 space-y-2">
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
      </ul>
    );
  }

  if (question.type === "long_reflection" || question.type === "short_answer") {
    const multiline = question.type === "long_reflection";
    return multiline ? (
      <textarea
        className="mt-4 min-h-[120px] w-full rounded-xl border border-night-900/10 px-3 py-3 text-sm dark:border-white/12 dark:bg-[var(--color-bg-muted)]"
        value={typeof value === "string" ? value : ""}
        disabled={disabled}
        placeholder={question.explanation ? undefined : "Share in your own words…"}
        onChange={(e) => onChange(e.target.value)}
      />
    ) : (
      <input
        className="mt-4 min-h-[44px] w-full rounded-xl border border-night-900/10 px-3 py-3 text-sm dark:border-white/12 dark:bg-[var(--color-bg-muted)]"
        value={typeof value === "string" ? value : ""}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  if (question.type === "multiple_choice") {
    const selected = Array.isArray(value) ? (value as string[]) : [];
    return (
      <ul className="mt-4 space-y-2">
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
      </ul>
    );
  }

  if (question.type === "priorities" || question.type === "ranking") {
    const order = Array.isArray(value) ? (value as string[]) : options.map((o) => o.id);
    return (
      <ul className="mt-4 space-y-2">
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
      </ul>
    );
  }

  return (
    <ul className="mt-4 space-y-2">
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
    </ul>
  );
}
