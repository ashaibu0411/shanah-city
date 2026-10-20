import type { MarriageQuestionDefinition } from "@/lib/marriage-counseling-types";
import { shouldIncrementGenerationForAnswerChange } from "@/lib/marriage-counselor-consent";

export function listCounselorWithConsentQuestionIds(
  questions: MarriageQuestionDefinition[],
): string[] {
  return questions.filter((q) => q.visibility === "counselor_with_consent").map((q) => q.id);
}

/** Question ids with counselor_with_consent whose answer value changed. */
export function getChangedCounselorConsentQuestionIds(
  questions: MarriageQuestionDefinition[],
  previousAnswers: Record<string, unknown>,
  nextAnswers: Record<string, unknown>,
): string[] {
  const changed: string[] = [];
  for (const question of questions) {
    if (question.visibility !== "counselor_with_consent") continue;
    const prev = previousAnswers[question.id];
    const next = nextAnswers[question.id];
    if (shouldIncrementGenerationForAnswerChange(prev, next)) {
      changed.push(question.id);
    }
  }
  return changed;
}
