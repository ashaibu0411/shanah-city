import type { MarriageQuestionDefinition } from "@/lib/marriage-counseling-types";
import {
  TEMPERAMENT_SCORING_V2,
  TEMPERAMENT_V2_DISCLAIMER,
  TEMPERAMENT_V2_INDIVIDUALS,
  TEMPERAMENT_V2_SECTIONS,
  TEMPERAMENT_V2_SUBSCALES,
  getTemperamentV2RowDef,
  type TemperamentIndividualDef,
  type TemperamentSubscaleDef,
} from "@/lib/marriage-stage2-temperament-scoring-config";

export type AgreementBand = "lower_agreement" | "moderate" | "higher_agreement";

export type TemperamentRowPresentation = {
  status: "scored" | "insufficient_data" | "not_answered";
  band?: AgreementBand;
  summaryLabel?: string;
  answeredCount?: number;
  eligibleCount?: number;
};

export type TemperamentSnapshotRow = {
  rowKind: "subscale" | "individual_preference";
  rowId: string;
  title: string;
  viewer: TemperamentRowPresentation;
  partner: TemperamentRowPresentation;
  conversationPrompt: string;
};

export type TemperamentSnapshotSection = {
  groupTitle: string;
  collapseIndividualPreferences?: boolean;
  rows: TemperamentSnapshotRow[];
};

export type TemperamentSnapshotV2 = {
  scoringModelVersion: typeof TEMPERAMENT_SCORING_V2;
  disclaimer: string;
  sections: TemperamentSnapshotSection[];
};

const GAP_NOTE_SIMILAR = "Similar on this theme — compare stories, not scores.";
const GAP_NOTE_DIFFERENT = "Different preferences — plan explicitly.";
const GAP_NOTE_LARGE = "Large difference — go slowly; counselor optional if stuck.";

export function parseLikertRaw(value: unknown): number | null {
  if (value == null || value === "__skip__") return null;
  if (typeof value === "object" && value && "choice" in (value as object)) {
    const n = Number((value as { choice: string }).choice);
    return Number.isFinite(n) ? n : null;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function agreementBandFromMean(mean: number): AgreementBand {
  if (mean <= 2.2) return "lower_agreement";
  if (mean >= 3.8) return "higher_agreement";
  return "moderate";
}

function bandToLabel(band: AgreementBand, context: "generic" | "org_structure"): string {
  if (context === "org_structure") {
    if (band === "lower_agreement") return "Lean toward more spontaneity (from your answers)";
    if (band === "higher_agreement") return "Lean toward more structure & predictability (from your answers)";
    return "Mixed lean between structure and spontaneity (from your answers)";
  }
  if (band === "lower_agreement") return "Lower agreement with these statements";
  if (band === "higher_agreement") return "Stronger agreement with these statements";
  return "Mixed or moderate agreement with these statements";
}

function individualBandLabel(band: AgreementBand): string {
  if (band === "lower_agreement") return "You did not strongly agree with this statement";
  if (band === "higher_agreement") return "You strongly tended to agree with this statement";
  return "Mixed or moderate agreement with this statement";
}

function transformScore(raw: number, reverse: boolean): number {
  return reverse ? 6 - raw : raw;
}

function subscaleMean(
  def: TemperamentSubscaleDef,
  answers: Record<string, unknown>,
): { mean: number | null; answeredCount: number } {
  const reverseSet = new Set(def.reverseQuestionIds);
  const transformed: number[] = [];
  for (const id of def.questionIds) {
    const raw = parseLikertRaw(answers[id]);
    if (raw == null) continue;
    transformed.push(transformScore(raw, reverseSet.has(id)));
  }
  if (!transformed.length) return { mean: null, answeredCount: 0 };
  const mean = transformed.reduce((a, b) => a + b, 0) / transformed.length;
  return { mean, answeredCount: transformed.length };
}

function presentSubscale(
  def: TemperamentSubscaleDef,
  answers: Record<string, unknown>,
): TemperamentRowPresentation {
  const { mean, answeredCount } = subscaleMean(def, answers);
  const eligibleCount = def.questionIds.length;
  if (answeredCount < def.minRequired || mean == null) {
    return {
      status: "insufficient_data",
      answeredCount,
      eligibleCount,
      summaryLabel:
        "Not enough answers in this group to summarize — individual responses still appear in the comparison below.",
    };
  }
  const band = agreementBandFromMean(mean);
  const context = def.rowId === "org_structure_vs_spontaneity" ? "org_structure" : "generic";
  const summary = def.summaryTemplate
    .replace("{n}", String(answeredCount))
    .replace("{total}", String(eligibleCount));
  return {
    status: "scored",
    band,
    summaryLabel: `${bandToLabel(band, context)}. ${summary}`,
    answeredCount,
    eligibleCount,
  };
}

function presentIndividual(
  def: TemperamentIndividualDef,
  answers: Record<string, unknown>,
): TemperamentRowPresentation {
  const raw = parseLikertRaw(answers[def.questionId]);
  if (raw == null) {
    return {
      status: "not_answered",
      eligibleCount: 1,
      summaryLabel: "Not answered — no summary for this preference.",
    };
  }
  const band = agreementBandFromMean(raw);
  return {
    status: "scored",
    band,
    summaryLabel: `${individualBandLabel(band)}. (One preference, not a full profile.)`,
    answeredCount: 1,
    eligibleCount: 1,
  };
}

function gapNoteForSubscale(meanA: number | null, meanB: number | null): string | null {
  if (meanA == null || meanB == null) return null;
  const gap = Math.abs(meanA - meanB);
  if (gap >= 1.5) return GAP_NOTE_LARGE;
  if (gap >= 0.8) return GAP_NOTE_DIFFERENT;
  return GAP_NOTE_SIMILAR;
}

function buildRow(
  rowId: string,
  answersViewer: Record<string, unknown>,
  answersPartner: Record<string, unknown>,
): TemperamentSnapshotRow | null {
  const def = getTemperamentV2RowDef(rowId);
  if (!def) return null;

  if (def.rowKind === "subscale") {
    const sub = def as TemperamentSubscaleDef;
    const viewer = presentSubscale(sub, answersViewer);
    const partner = presentSubscale(sub, answersPartner);
    const meanV = subscaleMean(sub, answersViewer).mean;
    const meanP = subscaleMean(sub, answersPartner).mean;
    let conversationPrompt = sub.conversationPrompt;
    const gapNote = gapNoteForSubscale(meanV, meanP);
    if (gapNote) conversationPrompt = `${gapNote} ${conversationPrompt}`;
    if (
      sub.rowId === "social_stimulation" &&
      viewer.status === "scored" &&
      presentSubscale(
        TEMPERAMENT_V2_SUBSCALES.find((s) => s.rowId === "social_quiet_recovery")!,
        answersViewer,
      ).status === "scored"
    ) {
      conversationPrompt =
        "Some people need both people-time and recovery — talk about order and timing, not who is more social. " +
        conversationPrompt;
    }
    return {
      rowKind: "subscale",
      rowId: sub.rowId,
      title: sub.title,
      viewer,
      partner,
      conversationPrompt,
    };
  }

  const ind = def as TemperamentIndividualDef;
  const viewer = presentIndividual(ind, answersViewer);
  const partner = presentIndividual(ind, answersPartner);
  let conversationPrompt = ind.conversationPrompt;
  if (
    viewer.status === "scored" &&
    partner.status === "scored" &&
    viewer.band !== partner.band
  ) {
    conversationPrompt = `You answered differently on “${ind.title}.” ${conversationPrompt}`;
  }
  return {
    rowKind: "individual_preference",
    rowId: ind.rowId,
    title: ind.title,
    viewer,
    partner,
    conversationPrompt,
  };
}

/** Build v2 snapshot from filtered answer maps (shared eligible likerts only). */
export function buildTemperamentSnapshotV2(
  answersViewer: Record<string, unknown>,
  answersPartner: Record<string, unknown>,
): TemperamentSnapshotV2 {
  const sections: TemperamentSnapshotSection[] = [];
  for (const section of TEMPERAMENT_V2_SECTIONS) {
    const rows: TemperamentSnapshotRow[] = [];
    for (const rowId of section.rowIds) {
      const row = buildRow(rowId, answersViewer, answersPartner);
      if (row) rows.push(row);
    }
    sections.push({
      groupTitle: section.groupTitle,
      collapseIndividualPreferences: section.collapseIndividualPreferences,
      rows,
    });
  }
  return {
    scoringModelVersion: TEMPERAMENT_SCORING_V2,
    disclaimer: TEMPERAMENT_V2_DISCLAIMER,
    sections,
  };
}

/** Restrict answers to shared likert IDs present in module and v2 config. */
export function filterTemperamentScoringAnswers(
  questions: MarriageQuestionDefinition[],
  answers: Record<string, unknown>,
  scoredIds: Set<string>,
): Record<string, unknown> {
  const allowed = new Set(
    questions
      .filter(
        (q) =>
          q.type === "likert" &&
          q.visibility === "shared_after_both_submit" &&
          scoredIds.has(q.id),
      )
      .map((q) => q.id),
  );
  const out: Record<string, unknown> = {};
  for (const id of allowed) {
    if (id in answers) out[id] = answers[id];
  }
  return out;
}
