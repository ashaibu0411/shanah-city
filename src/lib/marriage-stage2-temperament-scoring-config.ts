/** Temperament snapshot scoring — version 2.0.0 (read-time interpretation only). */

export const TEMPERAMENT_SCORING_V1 = "temperament-scoring/1.0.0" as const;
export const TEMPERAMENT_SCORING_V2 = "temperament-scoring/2.0.0" as const;

export type TemperamentScoringModelId =
  | typeof TEMPERAMENT_SCORING_V1
  | typeof TEMPERAMENT_SCORING_V2;

export type TemperamentRowKind = "subscale" | "individual_preference";

export type TemperamentSubscaleDef = {
  rowId: string;
  rowKind: "subscale";
  title: string;
  questionIds: string[];
  reverseQuestionIds: string[];
  minRequired: number;
  summaryTemplate: string;
  conversationPrompt: string;
};

export type TemperamentIndividualDef = {
  rowId: string;
  rowKind: "individual_preference";
  title: string;
  questionId: string;
  conversationPrompt: string;
};

export type TemperamentSectionDef = {
  groupTitle: string;
  rowIds: string[];
  /** Individual preference rows collapsed by default in UI */
  collapseIndividualPreferences?: boolean;
};

/** Excluded from snapshot aggregates (may still appear on compare when shared). */
export const TEMPERAMENT_V2_EXCLUDED_QUESTION_IDS = [
  "m01-soc-5",
  "m01-soc-10",
  "m01-emo-3",
  "m01-emo-6",
  "m01-emo-8",
  "m01-com-1",
  "m01-com-3",
  "m01-dec-5",
  "m01-dec-7",
  "m01-ord-7",
] as const;

export const TEMPERAMENT_V2_SUBSCALES: TemperamentSubscaleDef[] = [
  {
    rowId: "social_stimulation",
    rowKind: "subscale",
    title: "Energy from people & hosting",
    questionIds: ["m01-soc-2", "m01-soc-4", "m01-soc-6", "m01-soc-7", "m01-soc-9"],
    reverseQuestionIds: [],
    minRequired: 3,
    summaryTemplate:
      "Agreement that people, groups, and hosting feel energizing (from {n} of {total} questions).",
    conversationPrompt:
      "When do you each feel most alive with people—and when do you need to recharge afterward?",
  },
  {
    rowId: "social_quiet_recovery",
    rowKind: "subscale",
    title: "Quiet recovery & social pacing",
    questionIds: ["m01-soc-1", "m01-soc-3", "m01-soc-8"],
    reverseQuestionIds: [],
    minRequired: 2,
    summaryTemplate:
      "Agreement that you need quiet, pacing, or notice before social plans (from {n} of {total} questions).",
    conversationPrompt:
      "How can you honor both together-time and recovery time without keeping score?",
  },
  {
    rowId: "emotion_outward_expression",
    rowKind: "subscale",
    title: "Showing appreciation & visible emotion",
    questionIds: ["m01-emo-2", "m01-emo-5", "m01-emo-9"],
    reverseQuestionIds: [],
    minRequired: 2,
    summaryTemplate:
      "Agreement that you express feelings outwardly in these ways (from {n} of {total} questions).",
    conversationPrompt: "What helps you feel safe showing emotion—and what shuts you down?",
  },
  {
    rowId: "comm_structure_focus",
    rowKind: "subscale",
    title: "Structure & focus in hard conversations",
    questionIds: ["m01-com-2", "m01-com-4", "m01-com-5", "m01-com-6", "m01-com-9"],
    reverseQuestionIds: [],
    minRequired: 3,
    summaryTemplate:
      "Agreement that you prefer focused, structured conversation (from {n} of {total} questions).",
    conversationPrompt: "What would a good hard conversation look like—timing, length, and focus?",
  },
  {
    rowId: "decision_speed",
    rowKind: "subscale",
    title: "Pace toward deciding",
    questionIds: ["m01-dec-1", "m01-dec-4", "m01-dec-8"],
    reverseQuestionIds: [],
    minRequired: 2,
    summaryTemplate:
      "Agreement that you prefer faster closure and action once informed (from {n} of {total} questions).",
    conversationPrompt:
      "Where do you need speed vs. more research—and how will you decide together?",
  },
  {
    rowId: "conflict_tone_harshness_sensitivity",
    rowKind: "subscale",
    title: "Sensitivity to tone & harshness in conflict",
    questionIds: ["m01-con-2", "m01-con-3", "m01-con-4"],
    reverseQuestionIds: [],
    minRequired: 2,
    summaryTemplate:
      "Agreement that tone, sarcasm, or raised voices affect you strongly (from {n} of {total} questions).",
    conversationPrompt: "What tone helps you stay engaged—and what tone makes you shut down?",
  },
  {
    rowId: "org_structure_vs_spontaneity",
    rowKind: "subscale",
    title: "Structure, schedules & order at home",
    questionIds: [
      "m01-ord-1",
      "m01-ord-2",
      "m01-ord-3",
      "m01-ord-4",
      "m01-ord-5",
      "m01-ord-6",
      "m01-ord-8",
    ],
    reverseQuestionIds: ["m01-ord-2", "m01-ord-5", "m01-ord-6"],
    minRequired: 4,
    summaryTemplate:
      "Lean toward structure vs. spontaneity in schedules and order (from {n} of {total} questions).",
    conversationPrompt:
      "Pick one area (calendar, chores, weekends) to compromise on structure and spontaneity.",
  },
];

export const TEMPERAMENT_V2_INDIVIDUALS: TemperamentIndividualDef[] = [
  {
    rowId: "ind_emo_naming_feelings",
    rowKind: "individual_preference",
    title: "Naming feelings in the moment",
    questionId: "m01-emo-1",
    conversationPrompt: "When do you find it easy or hard to name what you feel?",
  },
  {
    rowId: "ind_emo_withdraw_when_strong",
    rowKind: "individual_preference",
    title: "Withdrawing when emotions run strong",
    questionId: "m01-emo-4",
    conversationPrompt: "What helps you return after you need space to settle?",
  },
  {
    rowId: "ind_emo_process_internally",
    rowKind: "individual_preference",
    title: "Processing feelings without talking",
    questionId: "m01-emo-7",
    conversationPrompt: "How can your spouse support you when you process internally?",
  },
  {
    rowId: "ind_emo_processing_pace_after_conflict",
    rowKind: "individual_preference",
    title: "Time needed to know feelings after conflict",
    questionId: "m01-emo-10",
    conversationPrompt: "How long do you typically need before you can talk about a conflict?",
  },
  {
    rowId: "ind_comm_text_not_for_emotional",
    rowKind: "individual_preference",
    title: "Text for logistics, not emotional topics",
    questionId: "m01-com-7",
    conversationPrompt: "Which topics need face-to-face or voice for you?",
  },
  {
    rowId: "ind_comm_need_reassurance_hard_talks",
    rowKind: "individual_preference",
    title: "Need reassurance during hard talks",
    questionId: "m01-com-8",
    conversationPrompt: "What reassurance helps you stay on the same team?",
  },
  {
    rowId: "ind_comm_say_less_when_overwhelmed",
    rowKind: "individual_preference",
    title: "Saying less when overwhelmed",
    questionId: "m01-com-10",
    conversationPrompt: "What signal can you give when you need a pause?",
  },
  {
    rowId: "ind_dec_research_waiting_major_purchases",
    rowKind: "individual_preference",
    title: "Research & waiting period for major purchases",
    questionId: "m01-dec-2",
    conversationPrompt: "What counts as “enough research” for you on big decisions?",
  },
  {
    rowId: "ind_dec_comfort_changing_plans",
    rowKind: "individual_preference",
    title: "Comfort changing plans with new information",
    questionId: "m01-dec-3",
    conversationPrompt: "When is changing plans wise vs. frustrating for you?",
  },
  {
    rowId: "ind_dec_risk_excites",
    rowKind: "individual_preference",
    title: "Risk-taking feels exciting",
    questionId: "m01-dec-6",
    conversationPrompt: "Where are you willing to take risks together—and where not?",
  },
  {
    rowId: "ind_conflict_need_physical_space",
    rowKind: "individual_preference",
    title: "Need physical space during arguments",
    questionId: "m01-con-1",
    conversationPrompt: "How will you ask for space without abandoning the conversation?",
  },
  {
    rowId: "ind_conflict_return_same_day",
    rowKind: "individual_preference",
    title: "Returning to a topic calmly the same day",
    questionId: "m01-con-5",
    conversationPrompt: "What helps you come back to repair after a break?",
  },
  {
    rowId: "ind_conflict_resolve_before_sleep",
    rowKind: "individual_preference",
    title: "Prefer resolving conflict before sleep",
    questionId: "m01-con-6",
    conversationPrompt: "If you disagree on timing, what compromise works?",
  },
  {
    rowId: "ind_stress_bring_work_home",
    rowKind: "individual_preference",
    title: "Bringing work stress home",
    questionId: "m01-con-7",
    conversationPrompt: "What boundary helps you pause before bringing stress inside?",
  },
  {
    rowId: "ind_conflict_apology_needs_feelings",
    rowKind: "individual_preference",
    title: "Apologies should acknowledge feelings",
    questionId: "m01-con-8",
    conversationPrompt: "What does a healing apology sound like to you?",
  },
  {
    rowId: "ind_conflict_avoid_until_buildup",
    rowKind: "individual_preference",
    title: "Avoiding conflict until it builds up",
    questionId: "m01-con-9",
    conversationPrompt: "How can you raise small issues before they pile up?",
  },
  {
    rowId: "ind_affect_touch_day",
    rowKind: "individual_preference",
    title: "Non-sexual touch during the day",
    questionId: "m01-aff-1",
    conversationPrompt: "What kind of touch helps you feel connected?",
  },
  {
    rowId: "ind_affect_words_vs_service",
    rowKind: "individual_preference",
    title: "Words of love vs. acts of service",
    questionId: "m01-aff-2",
    conversationPrompt: "How do you each prefer to give and receive love?",
  },
  {
    rowId: "ind_affect_uninterrupted_time",
    rowKind: "individual_preference",
    title: "Uninterrupted time without screens",
    questionId: "m01-aff-3",
    conversationPrompt: "When could you protect screen-free time together?",
  },
  {
    rowId: "ind_affect_small_surprises",
    rowKind: "individual_preference",
    title: "Small surprises (notes, treats)",
    questionId: "m01-aff-4",
    conversationPrompt: "What small gestures mean the most to you?",
  },
  {
    rowId: "ind_affect_need_initiation",
    rowKind: "individual_preference",
    title: "Need initiation from spouse, not only response",
    questionId: "m01-aff-5",
    conversationPrompt: "What initiation would help you feel pursued?",
  },
  {
    rowId: "ind_affect_public_affection",
    rowKind: "individual_preference",
    title: "Public affection (e.g. holding hands)",
    questionId: "m01-aff-6",
    conversationPrompt: "Where are you each comfortable showing affection in public?",
  },
  {
    rowId: "ind_affect_physical_when_distant",
    rowKind: "individual_preference",
    title: "Physical closeness when emotionally distant",
    questionId: "m01-aff-7",
    conversationPrompt: "What repair needs to happen before physical closeness feels natural?",
  },
  {
    rowId: "ind_affect_specific_affirmation",
    rowKind: "individual_preference",
    title: "Affirming specific strengths",
    questionId: "m01-aff-8",
    conversationPrompt: "What specific encouragement lands best for you?",
  },
  {
    rowId: "ind_affection_reassurance_after_repair",
    rowKind: "individual_preference",
    title: "Affection or reassurance after repair",
    questionId: "m01-con-10",
    conversationPrompt: "After conflict, what helps you feel secure again?",
  },
];

export const TEMPERAMENT_V2_SECTIONS: TemperamentSectionDef[] = [
  {
    groupTitle: "Social energy & alone time",
    rowIds: ["social_stimulation", "social_quiet_recovery"],
  },
  {
    groupTitle: "Emotional awareness & expression",
    rowIds: [
      "emotion_outward_expression",
      "ind_emo_naming_feelings",
      "ind_emo_withdraw_when_strong",
      "ind_emo_process_internally",
      "ind_emo_processing_pace_after_conflict",
    ],
    collapseIndividualPreferences: true,
  },
  {
    groupTitle: "Communication preferences",
    rowIds: [
      "comm_structure_focus",
      "ind_comm_text_not_for_emotional",
      "ind_comm_need_reassurance_hard_talks",
      "ind_comm_say_less_when_overwhelmed",
    ],
    collapseIndividualPreferences: true,
  },
  {
    groupTitle: "Decision-making pace",
    rowIds: [
      "decision_speed",
      "ind_dec_research_waiting_major_purchases",
      "ind_dec_comfort_changing_plans",
      "ind_dec_risk_excites",
    ],
    collapseIndividualPreferences: true,
  },
  {
    groupTitle: "Stress & conflict rhythms",
    rowIds: [
      "conflict_tone_harshness_sensitivity",
      "ind_conflict_need_physical_space",
      "ind_conflict_return_same_day",
      "ind_conflict_resolve_before_sleep",
      "ind_stress_bring_work_home",
      "ind_conflict_apology_needs_feelings",
      "ind_conflict_avoid_until_buildup",
    ],
    collapseIndividualPreferences: true,
  },
  {
    groupTitle: "Organization & schedules",
    rowIds: ["org_structure_vs_spontaneity"],
  },
  {
    groupTitle: "Affection & closeness",
    rowIds: [
      "ind_affect_touch_day",
      "ind_affect_words_vs_service",
      "ind_affect_uninterrupted_time",
      "ind_affect_small_surprises",
      "ind_affect_need_initiation",
      "ind_affect_public_affection",
      "ind_affect_physical_when_distant",
      "ind_affect_specific_affirmation",
      "ind_affection_reassurance_after_repair",
    ],
    collapseIndividualPreferences: true,
  },
];

const rowById = new Map<string, TemperamentSubscaleDef | TemperamentIndividualDef>();
for (const s of TEMPERAMENT_V2_SUBSCALES) rowById.set(s.rowId, s);
for (const i of TEMPERAMENT_V2_INDIVIDUALS) rowById.set(i.rowId, i);

export function getTemperamentV2RowDef(rowId: string) {
  return rowById.get(rowId);
}

/** Every likert ID used in v2 scoring (subscale + individual). */
export function getTemperamentV2ScoredQuestionIds(): Set<string> {
  const ids = new Set<string>();
  for (const s of TEMPERAMENT_V2_SUBSCALES) {
    for (const id of s.questionIds) ids.add(id);
  }
  for (const i of TEMPERAMENT_V2_INDIVIDUALS) ids.add(i.questionId);
  return ids;
}

export function resolveTemperamentScoringModel(
  param: string | null | undefined,
): TemperamentScoringModelId {
  const p = param?.trim();
  if (p === TEMPERAMENT_SCORING_V1 || p === "1.0.0") return TEMPERAMENT_SCORING_V1;
  return TEMPERAMENT_SCORING_V2;
}

export const TEMPERAMENT_V2_DISCLAIMER =
  "These summaries describe preferences from your answers, not diagnoses or fixed personality labels. The interpretation has been updated; your submitted answers have not changed.";

export type TemperamentV2ConfigIntegrity = {
  likertCount: number;
  subscaleCount: number;
  individualCount: number;
  excludedCount: number;
  assignedCount: number;
};

/** Validates v2 map against live mod-01 likert IDs (throws on mismatch). */
export function assertTemperamentV2ConfigIntegrity(likertIds: string[]): TemperamentV2ConfigIntegrity {
  const likertSet = new Set(likertIds);
  const assigned = new Set<string>();

  for (const id of TEMPERAMENT_V2_EXCLUDED_QUESTION_IDS) {
    if (!likertSet.has(id)) throw new Error(`Excluded ID missing from module: ${id}`);
    if (assigned.has(id)) throw new Error(`Duplicate assignment: ${id}`);
    assigned.add(id);
  }

  for (const s of TEMPERAMENT_V2_SUBSCALES) {
    for (const id of s.questionIds) {
      if (!likertSet.has(id)) throw new Error(`Subscale ID missing from module: ${id}`);
      if (assigned.has(id)) throw new Error(`Duplicate assignment: ${id}`);
      assigned.add(id);
    }
  }

  for (const i of TEMPERAMENT_V2_INDIVIDUALS) {
    if (!likertSet.has(i.questionId)) throw new Error(`Individual ID missing from module: ${i.questionId}`);
    if (assigned.has(i.questionId)) throw new Error(`Duplicate assignment: ${i.questionId}`);
    assigned.add(i.questionId);
  }

  if (assigned.size !== likertSet.size) {
    const missing = likertIds.filter((id) => !assigned.has(id));
    const extra = [...assigned].filter((id) => !likertSet.has(id));
    throw new Error(
      `Likert assignment mismatch. Unassigned: ${missing.join(",")} Extra: ${extra.join(",")}`,
    );
  }

  if (TEMPERAMENT_V2_SUBSCALES.length !== 7) {
    throw new Error(`Expected 7 subscales, got ${TEMPERAMENT_V2_SUBSCALES.length}`);
  }

  for (const section of TEMPERAMENT_V2_SECTIONS) {
    for (const rowId of section.rowIds) {
      if (!rowById.has(rowId)) throw new Error(`Section references unknown rowId: ${rowId}`);
    }
  }

  return {
    likertCount: likertSet.size,
    subscaleCount: TEMPERAMENT_V2_SUBSCALES.length,
    individualCount: TEMPERAMENT_V2_INDIVIDUALS.length,
    excludedCount: TEMPERAMENT_V2_EXCLUDED_QUESTION_IDS.length,
    assignedCount: assigned.size,
  };
}
