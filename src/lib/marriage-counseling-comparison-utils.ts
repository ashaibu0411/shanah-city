import type {
  MarriageComparisonItem,
  MarriageQuestionDefinition,
} from "@/lib/marriage-counseling-types";

export function compareCategory(
  question: MarriageQuestionDefinition,
  a: unknown,
  b: unknown,
): MarriageComparisonItem["category"] {
  if (a === "__skip__" || b === "__skip__" || a == null || b == null) {
    return "not_yet_discussed";
  }
  if (JSON.stringify(a) === JSON.stringify(b)) return "aligned";
  if (question.type === "likert" || question.type === "agreement") {
    return "needs_conversation";
  }
  return "different";
}

export function buildSharedComparisonItems(
  questions: MarriageQuestionDefinition[],
  answerA: Record<string, unknown>,
  answerB: Record<string, unknown>,
): MarriageComparisonItem[] {
  return questions
    .filter((q) => q.visibility === "shared_after_both_submit")
    .map((question) => ({
      questionId: question.id,
      prompt: question.prompt,
      discussionPrompt: question.discussionPrompt,
      myAnswer: answerA[question.id],
      partnerAnswer: answerB[question.id],
      category: compareCategory(question, answerA[question.id], answerB[question.id]),
    }));
}
