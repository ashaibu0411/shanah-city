import type {
  MarriageModuleDefinition,
  MarriageQuestionDefinition,
} from "@/lib/marriage-counseling-types";

const DESCRIPTIVE_PROMPT =
  /^(how|which|what|who|when|where|describe|name|rank|in five|our preference|household cleaning expectations|work–life balance when|stewardship and giving should|supporting extended family financially should|mutual respect during disagreement is|praying together as a couple is|non-sexual affection is important|financial or significant decisions should|asking for professional help|we are willing to seek|we should talk about habits)/i;

const INCOMPLETE_PROMPT = /…\s*$/;

const CHOICE_TYPES = new Set([
  "single_choice",
  "multiple_choice",
  "likert",
  "agreement",
  "scenario",
  "preferred_response",
]);

export type MarriageCurriculumValidationIssue = {
  moduleId: string;
  questionId: string;
  message: string;
};

export function validateMarriageCurriculumModules(
  modules: MarriageModuleDefinition[],
): MarriageCurriculumValidationIssue[] {
  const issues: MarriageCurriculumValidationIssue[] = [];
  const seenQuestionIds = new Set<string>();

  for (const mod of modules) {
    for (const question of mod.questions) {
      issues.push(...validateQuestion(mod.id, question, seenQuestionIds));
    }
  }

  return issues;
}

function validateQuestion(
  moduleId: string,
  question: MarriageQuestionDefinition,
  seenQuestionIds: Set<string>,
): MarriageCurriculumValidationIssue[] {
  const issues: MarriageCurriculumValidationIssue[] = [];
  const base = { moduleId, questionId: question.id };

  if (!question.prompt?.trim()) {
    issues.push({ ...base, message: "Question prompt is empty." });
  }

  if (seenQuestionIds.has(question.id)) {
    issues.push({ ...base, message: `Duplicate question id: ${question.id}` });
  }
  seenQuestionIds.add(question.id);

  if (CHOICE_TYPES.has(question.type)) {
    const options = question.options ?? [];
    if (options.length === 0) {
      issues.push({ ...base, message: `${question.type} question has no options.` });
    }
    const optionIds = new Set<string>();
    for (const opt of options) {
      if (!opt.id?.trim() || !opt.label?.trim()) {
        issues.push({ ...base, message: "Option missing id or label." });
      }
      if (optionIds.has(opt.id)) {
        issues.push({ ...base, message: `Duplicate option id: ${opt.id}` });
      }
      optionIds.add(opt.id);
    }
  }

  if (question.type === "likert" || question.type === "agreement") {
    const prompt = question.prompt.trim();
    if (prompt.endsWith("?")) {
      issues.push({
        ...base,
        message: `${question.type} used with interrogative prompt (use a declarative statement).`,
      });
    }
    if (INCOMPLETE_PROMPT.test(prompt)) {
      issues.push({
        ...base,
        message: `${question.type} used with incomplete prompt ending in ellipsis.`,
      });
    }
    if (DESCRIPTIVE_PROMPT.test(prompt) && question.type === "likert") {
      issues.push({
        ...base,
        message: "likert scale used with descriptive/open prompt (use single_choice or reword as statement).",
      });
    }
  }

  return issues;
}
