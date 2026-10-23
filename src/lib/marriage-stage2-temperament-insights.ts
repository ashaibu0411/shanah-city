import type { MarriageQuestionDefinition } from "@/lib/marriage-counseling-types";

export type TemperamentInsightRow = {
  dimension: string;
  partnerALabel: string;
  partnerBLabel: string;
  note: string;
};

const DIMENSION_LABELS: Record<string, string> = {
  social_energy: "Social energy & alone time",
  emotional_style: "Emotional awareness & expression",
  communication: "Communication preferences",
  decisions: "Decision-making pace",
  conflict_stress: "Stress & conflict rhythms",
  organization: "Organization & schedules",
  affection: "Affection & closeness",
};

const LIKERT_LABELS: Record<string, string> = {
  "1": "Low tendency",
  "2": "Somewhat low",
  "3": "Moderate",
  "4": "Somewhat high",
  "5": "High tendency",
};

function likertLabel(value: unknown) {
  if (value == null || value === "__skip__") return "Not answered";
  if (typeof value === "object" && value && "choice" in (value as object)) {
    return LIKERT_LABELS[String((value as { choice: string }).choice)] ?? "—";
  }
  return LIKERT_LABELS[String(value)] ?? String(value);
}

function averageLikert(values: unknown[]): number | null {
  const nums = values
    .map((v) => {
      if (v == null || v === "__skip__") return null;
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    })
    .filter((n): n is number => n != null);
  if (!nums.length) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function avgLabel(avg: number | null) {
  if (avg == null) return "Not enough answers yet";
  if (avg <= 2.2) return "Lower tendency (as answered)";
  if (avg >= 3.8) return "Higher tendency (as answered)";
  return "Moderate / mixed (as answered)";
}

/** Legacy v1 — one row per temperamentDimension (temperament-scoring/1.0.0). */
export function buildTemperamentInsights(
  questions: MarriageQuestionDefinition[],
  answersA: Record<string, unknown>,
  answersB: Record<string, unknown>,
): TemperamentInsightRow[] {
  const byDim = new Map<string, string[]>();
  for (const q of questions) {
    if (q.type !== "likert" || !q.temperamentDimension) continue;
    const list = byDim.get(q.temperamentDimension) ?? [];
    list.push(q.id);
    byDim.set(q.temperamentDimension, list);
  }

  const rows: TemperamentInsightRow[] = [];
  for (const [dim, ids] of byDim) {
    const avgA = averageLikert(ids.map((id) => answersA[id]));
    const avgB = averageLikert(ids.map((id) => answersB[id]));
    const gap = avgA != null && avgB != null ? Math.abs(avgA - avgB) : 0;
    let note = "Similar rhythms — build on shared strengths.";
    if (gap >= 1.2) note = "Different gifts — plan pauses, listening, and reunion.";
    if (gap >= 2) note = "Notice the gap with curiosity, not blame. Consider a counselor conversation.";
    rows.push({
      dimension: DIMENSION_LABELS[dim] ?? dim,
      partnerALabel: avgLabel(avgA),
      partnerBLabel: avgLabel(avgB),
      note,
    });
  }

  return rows;
}
