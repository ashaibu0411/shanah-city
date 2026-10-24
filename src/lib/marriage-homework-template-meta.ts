/** Timing labels for premarital session homework — additive metadata; template keys unchanged for released records. */

export type MarriageHomeworkTemplateMeta = {
  assignedAfterSessionKey: string;
  assignedAfterSessionOrder: number;
  prepareForSessionOrder: number | null;
  /** Shown to couples and counselors (e.g. "After Session 1 · Before Session 2"). */
  timingLabel: string;
  estimatedMinutes: number;
  /** Counselor may adjust; suggested default when creating a draft. */
  suggestedDueDaysAfterRelease: number;
};

export const PREMARITAL_HOMEWORK_TEMPLATE_META: Record<string, MarriageHomeworkTemplateMeta> = {
  "week-1-knowing-yourself": {
    assignedAfterSessionKey: "session-1-foundations",
    assignedAfterSessionOrder: 1,
    prepareForSessionOrder: 2,
    timingLabel: "Assigned after Session 1 · Complete before Session 2",
    estimatedMinutes: 90,
    suggestedDueDaysAfterRelease: 7,
  },
  "premarital-after-s2-communication": {
    assignedAfterSessionKey: "session-2-knowing-yourself",
    assignedAfterSessionOrder: 2,
    prepareForSessionOrder: 3,
    timingLabel: "Assigned after Session 2 · Complete before Session 3",
    estimatedMinutes: 75,
    suggestedDueDaysAfterRelease: 7,
  },
  "premarital-after-s3-money": {
    assignedAfterSessionKey: "session-3-communication",
    assignedAfterSessionOrder: 3,
    prepareForSessionOrder: 4,
    timingLabel: "Assigned after Session 3 · Complete before Session 4",
    estimatedMinutes: 70,
    suggestedDueDaysAfterRelease: 7,
  },
  "premarital-after-s4-family": {
    assignedAfterSessionKey: "session-4-money",
    assignedAfterSessionOrder: 4,
    prepareForSessionOrder: 5,
    timingLabel: "Assigned after Session 4 · Complete before Session 5",
    estimatedMinutes: 80,
    suggestedDueDaysAfterRelease: 7,
  },
  "premarital-after-s5-intimacy-trust": {
    assignedAfterSessionKey: "session-5-family-boundaries",
    assignedAfterSessionOrder: 5,
    prepareForSessionOrder: 6,
    timingLabel: "Assigned after Session 5 · Complete before Session 6",
    estimatedMinutes: 75,
    suggestedDueDaysAfterRelease: 7,
  },
  "premarital-after-s6-faith-home": {
    assignedAfterSessionKey: "session-6-intimacy-trust",
    assignedAfterSessionOrder: 6,
    prepareForSessionOrder: 7,
    timingLabel: "Assigned after Session 6 · Complete before Session 7",
    estimatedMinutes: 75,
    suggestedDueDaysAfterRelease: 7,
  },
  "premarital-after-s7-readiness-prep": {
    assignedAfterSessionKey: "session-7-faith-purpose",
    assignedAfterSessionOrder: 7,
    prepareForSessionOrder: 8,
    timingLabel: "Assigned after Session 7 · Complete before Session 8",
    estimatedMinutes: 60,
    suggestedDueDaysAfterRelease: 7,
  },
  "premarital-after-s8-sendoff": {
    assignedAfterSessionKey: "session-8-readiness-review",
    assignedAfterSessionOrder: 8,
    prepareForSessionOrder: null,
    timingLabel: "Assigned after Session 8 · First weeks of marriage",
    estimatedMinutes: 45,
    suggestedDueDaysAfterRelease: 14,
  },
};

export function homeworkTemplateMeta(templateKey: string | undefined | null): MarriageHomeworkTemplateMeta | null {
  if (!templateKey?.trim()) return null;
  return PREMARITAL_HOMEWORK_TEMPLATE_META[templateKey.trim()] ?? null;
}

export function allPremaritalHomeworkTemplateKeys(): string[] {
  return Object.keys(PREMARITAL_HOMEWORK_TEMPLATE_META);
}
