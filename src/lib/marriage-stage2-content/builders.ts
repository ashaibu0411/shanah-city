import type {
  MarriageAnswerVisibility,
  MarriageModuleJourneyStage,
  MarriageQuestionDefinition,
  MarriageQuestionType,
  MarriageStage2LessonDefinition,
} from "@/lib/marriage-counseling-types";

export const LIKERT_5 = [
  { id: "1", label: "Strongly disagree" },
  { id: "2", label: "Disagree" },
  { id: "3", label: "Neutral" },
  { id: "4", label: "Agree" },
  { id: "5", label: "Strongly agree" },
] as const;

export const AGREEMENT_5 = [
  { id: "1", label: "Strongly disagree" },
  { id: "2", label: "Disagree" },
  { id: "3", label: "We partly agree" },
  { id: "4", label: "Agree" },
  { id: "5", label: "Strongly agree" },
] as const;

type QExtra = Partial<MarriageQuestionDefinition>;

export function lesson(
  id: string,
  title: string,
  summary: string,
  journeyStage: MarriageModuleJourneyStage,
  sortOrder: number,
  extra?: Partial<MarriageStage2LessonDefinition>,
): MarriageStage2LessonDefinition {
  return { id, title, summary, journeyStage, sortOrder, ...extra };
}

export function q(
  moduleId: string,
  id: string,
  prompt: string,
  type: MarriageQuestionType,
  visibility: MarriageAnswerVisibility,
  extra?: QExtra,
): MarriageQuestionDefinition {
  return {
    id,
    moduleId,
    prompt,
    type,
    required: extra?.required ?? false,
    visibility,
    discussionPrompt:
      extra?.discussionPrompt ??
      "Share what surprised you and one way you will honor each other this week.",
    allowSkip: extra?.allowSkip ?? visibility === "private_reflection",
    options: extra?.options,
    ...extra,
  };
}

export function likertBank(
  moduleId: string,
  lessonId: string,
  idPrefix: string,
  prompts: string[],
  opts: {
    visibility?: MarriageAnswerVisibility;
    journeyStage?: MarriageModuleJourneyStage;
    temperamentDimension?: string;
    requiredIndexes?: number[];
  } = {},
): MarriageQuestionDefinition[] {
  const visibility = opts.visibility ?? "shared_after_both_submit";
  const journeyStage = opts.journeyStage ?? "answer";
  return prompts.map((prompt, i) =>
    q(moduleId, `${idPrefix}-${i + 1}`, prompt, "likert", visibility, {
      lessonId,
      journeyStage,
      options: [...LIKERT_5],
      temperamentDimension: opts.temperamentDimension,
      required: opts.requiredIndexes?.includes(i) ?? false,
    }),
  );
}

export function scenarioBank(
  moduleId: string,
  lessonId: string,
  idPrefix: string,
  items: Array<{ prompt: string; options: Array<{ id: string; label: string }> }>,
  journeyStage: MarriageModuleJourneyStage = "practice",
): MarriageQuestionDefinition[] {
  return items.map((item, i) =>
    q(moduleId, `${idPrefix}-${i + 1}`, item.prompt, "scenario", "shared_after_both_submit", {
      lessonId,
      journeyStage,
      options: item.options,
      discussionPrompt: "What would repair, respect, and clarity look like for you both?",
    }),
  );
}
