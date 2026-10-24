import type { MarriageQuestionDefinition } from "@/lib/marriage-counseling-types";
import { budgetExpenseTotal, normalizeBudgetAnswer } from "@/lib/marriage-budget-utils";

export function formatMarriageAnswerForDisplay(
  question: MarriageQuestionDefinition | undefined,
  value: unknown,
): string {
  if (value === "__skip__") return "Prefer not to answer";
  if (value === undefined || value === null || value === "") return "—";

  const options = question?.options ?? [];

  if (typeof value === "object" && value && "choice" in (value as object)) {
    const choice = String((value as { choice: string }).choice);
    const opt = options.find((o) => o.id === choice);
    return opt ? `Prediction: ${opt.label}` : `Prediction: ${choice}`;
  }

  const budget = normalizeBudgetAnswer(value);
  if (budget) {
    const total = budgetExpenseTotal(budget);
    return `Budget — income $${budget.monthlyIncome}, expenses $${total}, remaining $${budget.monthlyIncome - total}`;
  }

  if (Array.isArray(value)) {
    return value
      .map((id) => options.find((o) => o.id === id)?.label ?? String(id))
      .join(", ");
  }

  if (typeof value === "string" || typeof value === "number") {
    const id = String(value);
    const opt = options.find((o) => o.id === id);
    if (opt) return opt.label;
    return id;
  }

  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
