import type {
  MarriageModuleDefinition,
  MarriageQuestionDefinition,
  MarriageQuestionOption,
  MarriageQuestionType,
} from "@/lib/marriage-counseling-types";

export const QUESTION_TYPE_LABELS: Record<MarriageQuestionType, string> = {
  single_choice: "Single choice",
  multiple_choice: "Multiple choice",
  likert: "Rating scale (Likert)",
  agreement: "Agreement scale",
  ranking: "Ranking",
  short_answer: "Short written response",
  long_reflection: "Long reflection",
  scenario: "Scenario",
  priorities: "Priority ranking",
  preferred_response: "Preferred response",
  partner_prediction: "Partner prediction",
  budget_worksheet: "Budget worksheet",
};

export function newQuestionId(moduleId: string) {
  return `q-${moduleId}-${Date.now().toString(36).slice(-6)}`;
}

export function createQuestion(
  moduleId: string,
  type: MarriageQuestionType = "single_choice",
): MarriageQuestionDefinition {
  const options: MarriageQuestionOption[] =
    type === "likert" || type === "agreement"
      ? [
          { id: "1", label: "Strongly disagree" },
          { id: "2", label: "Disagree" },
          { id: "3", label: "Neutral" },
          { id: "4", label: "Agree" },
          { id: "5", label: "Strongly agree" },
        ]
      : type === "single_choice" || type === "scenario" || type === "preferred_response"
        ? [
            { id: "a", label: "Option A" },
            { id: "b", label: "Option B" },
          ]
        : type === "multiple_choice" || type === "ranking" || type === "priorities"
          ? [
              { id: "opt-1", label: "Option 1" },
              { id: "opt-2", label: "Option 2" },
              { id: "opt-3", label: "Option 3" },
            ]
          : [];

  return {
    id: newQuestionId(moduleId),
    moduleId,
    prompt: "New question prompt",
    type,
    required: true,
    visibility: "shared_after_both_submit",
    options: options.length ? options : undefined,
    discussionPrompt: "Talk about what you heard and what surprised you.",
  };
}

export function reorder<T>(list: T[], from: number, to: number): T[] {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function cloneModules(modules: MarriageModuleDefinition[]) {
  return structuredClone(modules);
}
