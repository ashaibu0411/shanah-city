"use client";

import type { MarriageBudgetWorksheetAnswer } from "@/lib/marriage-counseling-types";
import { DEFAULT_BUDGET_LINES } from "@/lib/marriage-stage2-content/mod-05-financial";
import { budgetExpenseTotal, normalizeBudgetAnswer } from "@/lib/marriage-budget-utils";
import { marriagePremium } from "@/components/marriage/marriage-counseling-premium";

const SAMPLE_INCOME = 5200;

export function MarriageBudgetWorksheet({
  value,
  onChange,
  disabled,
}: {
  value: unknown;
  onChange: (v: MarriageBudgetWorksheetAnswer) => void;
  disabled?: boolean;
}) {
  const parsed =
    normalizeBudgetAnswer(value) ??
    ({
      mode: "hypothetical",
      monthlyIncome: SAMPLE_INCOME,
      lines: DEFAULT_BUDGET_LINES.map((l) => ({ ...l, amount: 0 })),
    } satisfies MarriageBudgetWorksheetAnswer);

  const total = budgetExpenseTotal(parsed);
  const remaining = parsed.monthlyIncome - total;

  function updateLine(id: string, amount: number) {
    onChange({
      ...parsed,
      lines: parsed.lines.map((line) => (line.id === id ? { ...line, amount } : line)),
    });
  }

  function updateIncome(n: number) {
    onChange({ ...parsed, monthlyIncome: n });
  }

  return (
    <div className="mt-4 space-y-4">
      <p className={`${marriagePremium.cardMuted} text-xs`}>
        Hypothetical practice budget — adjust income and categories. Expenses must not exceed income.
      </p>
      <label className="block text-sm font-semibold">
        Monthly income (sample)
        <input
          type="number"
          min={0}
          className="mt-1 min-h-[44px] w-full rounded-xl border border-night-900/10 px-3 py-2 text-sm dark:border-white/12 dark:bg-[var(--color-bg-muted)]"
          value={parsed.monthlyIncome}
          disabled={disabled}
          onChange={(e) => updateIncome(Number(e.target.value) || 0)}
        />
      </label>
      <ul className="space-y-2">
        {parsed.lines.map((line) => (
          <li key={line.id} className="flex items-center gap-2">
            <span className="min-w-0 flex-1 text-sm">{line.label}</span>
            <input
              type="number"
              min={0}
              className="w-28 rounded-lg border border-night-900/10 px-2 py-2 text-sm dark:border-white/12 dark:bg-[var(--color-bg-muted)]"
              value={line.amount}
              disabled={disabled}
              onChange={(e) => updateLine(line.id, Number(e.target.value) || 0)}
            />
          </li>
        ))}
      </ul>
      <div className="rounded-xl bg-stone-50 p-3 text-sm dark:bg-white/5">
        <p>
          Total expenses: <strong>${total.toLocaleString()}</strong>
        </p>
        <p className={remaining < 0 ? "text-red-700" : ""}>
          Remaining: <strong>${remaining.toLocaleString()}</strong>
        </p>
      </div>
    </div>
  );
}
