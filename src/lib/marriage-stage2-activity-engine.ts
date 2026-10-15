import type {
  MarriageComparisonItem,
  MarriageQuestionDefinition,
  MarriageSharingConsentRecord,
} from "@/lib/marriage-counseling-types";
import {
  buildSharedComparisonItems,
  compareCategory,
} from "@/lib/marriage-counseling-comparison-utils";

const NEVER_COMPARE: MarriageQuestionDefinition["visibility"][] = [
  "private_reflection",
  "private_financial_disclosure",
  "counselor_with_consent",
];

export function questionRequiresExplicitShareConsent(
  question: MarriageQuestionDefinition,
): boolean {
  if (question.visibility === "explicit_consent_to_share") return true;
  if (question.sensitivity === "high" && question.visibility === "shared_after_both_submit") {
    return true;
  }
  return false;
}

export function consentGranted(
  consents: MarriageSharingConsentRecord[],
  journeyId: string,
  moduleId: string,
  questionId: string,
  userId: string,
): boolean {
  const row = consents.find(
    (c) =>
      c.journeyId === journeyId &&
      c.moduleId === moduleId &&
      c.questionId === questionId &&
      c.userId === userId,
  );
  return row?.granted === true;
}

/** Server-authoritative comparison items after visibility + consent rules. */
export function buildComparisonItemsWithConsent(
  questions: MarriageQuestionDefinition[],
  answerA: Record<string, unknown>,
  answerB: Record<string, unknown>,
  viewerId: string,
  partnerId: string,
  journeyId: string,
  moduleId: string,
  consents: MarriageSharingConsentRecord[],
): MarriageComparisonItem[] {
  const eligible = questions.filter((q) => !NEVER_COMPARE.includes(q.visibility));
  const items: MarriageComparisonItem[] = [];

  for (const question of eligible) {
    if (question.visibility !== "shared_after_both_submit" && question.visibility !== "explicit_consent_to_share") {
      continue;
    }
    if (questionRequiresExplicitShareConsent(question)) {
      const aOk = consentGranted(consents, journeyId, moduleId, question.id, viewerId);
      const bOk = consentGranted(consents, journeyId, moduleId, question.id, partnerId);
      if (!aOk || !bOk) continue;
    }

    const myAnswer = answerA[question.id];
    const partnerAnswer = answerB[question.id];
    items.push({
      questionId: question.id,
      prompt: question.prompt,
      discussionPrompt: question.discussionPrompt,
      myAnswer,
      partnerAnswer,
      category: compareCategory(question, myAnswer, partnerAnswer),
    });
  }

  return items;
}

/** Legacy helper — prefer buildComparisonItemsWithConsent when Stage 2 consents exist. */
export function buildComparisonItemsLegacy(
  questions: MarriageQuestionDefinition[],
  answerA: Record<string, unknown>,
  answerB: Record<string, unknown>,
): MarriageComparisonItem[] {
  return buildSharedComparisonItems(questions, answerA, answerB);
}
