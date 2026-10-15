import type { MarriageBudgetWorksheetAnswer } from "@/lib/marriage-counseling-types";

export function normalizeBudgetAnswer(raw: unknown): MarriageBudgetWorksheetAnswer | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as MarriageBudgetWorksheetAnswer;
  if (!Array.isArray(o.lines)) return null;
  const income = Number(o.monthlyIncome);
  if (!Number.isFinite(income) || income < 0) return null;
  const lines = o.lines.map((line) => ({
    id: String(line.id),
    label: String(line.label),
    amount: Math.max(0, Number(line.amount) || 0),
  }));
  return {
    mode: o.mode === "actual" ? "actual" : "hypothetical",
    monthlyIncome: income,
    lines,
    notes: o.notes ? String(o.notes) : undefined,
  };
}

export function budgetExpenseTotal(answer: MarriageBudgetWorksheetAnswer): number {
  return answer.lines.reduce((sum, line) => sum + line.amount, 0);
}

export function validateBudgetAnswer(raw: unknown): { ok: true; value: MarriageBudgetWorksheetAnswer } | { ok: false; error: string } {
  const value = normalizeBudgetAnswer(raw);
  if (!value) return { ok: false, error: "Enter a valid budget with income and categories." };
  const total = budgetExpenseTotal(value);
  if (total > value.monthlyIncome) {
    return { ok: false, error: `Expenses ($${total}) cannot exceed income ($${value.monthlyIncome}).` };
  }
  return { ok: true, value };
}
