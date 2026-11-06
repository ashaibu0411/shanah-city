import type { MarriageModuleDefinition, MarriageQuestionDefinition } from "@/lib/marriage-counseling-types";

export const MARRIAGE_INTIMACY_MODULE_ID = "s2-mod-06-intimacy";
export const MARRIAGE_INTIMACY_OPT_IN_QUESTION_ID = "m06-opt-in";
export const MARRIAGE_INTIMACY_INTRO_LESSON_ID = "m06-l01";

export type IntimacyOptInChoice = "yes" | "no" | null;

/** Consent is participant-specific and must be saved before any sensitive answer. */
export function intimacyOptInChoice(answers: Record<string, unknown> | null | undefined): IntimacyOptInChoice {
  const value = answers?.[MARRIAGE_INTIMACY_OPT_IN_QUESTION_ID];
  return value === "yes" || value === "no" ? value : null;
}

/** Hide the remaining lesson descriptions and question bodies until this participant opts in. */
export function visibleIntimacyModule(
  module: MarriageModuleDefinition,
  answers: Record<string, unknown> | null | undefined,
): MarriageModuleDefinition {
  if (module.id !== MARRIAGE_INTIMACY_MODULE_ID || intimacyOptInChoice(answers) === "yes") {
    return module;
  }
  return {
    ...module,
    lessons: module.lessons?.filter((lesson) => lesson.id === MARRIAGE_INTIMACY_INTRO_LESSON_ID),
    questions: module.questions.filter((question) => question.id === MARRIAGE_INTIMACY_OPT_IN_QUESTION_ID),
  };
}

/** Limit answer payload as well as question payload before consent (including legacy drafts). */
export function visibleIntimacyAnswers(
  moduleId: string,
  answers: Record<string, unknown>,
): Record<string, unknown> {
  if (moduleId !== MARRIAGE_INTIMACY_MODULE_ID || intimacyOptInChoice(answers) === "yes") return answers;
  const optIn = answers[MARRIAGE_INTIMACY_OPT_IN_QUESTION_ID];
  return optIn === undefined ? {} : { [MARRIAGE_INTIMACY_OPT_IN_QUESTION_ID]: optIn };
}

/**
 * Validate before applying the atomic draft patch.
 * Consent cannot be sent alongside sensitive answers: the opt-in must have
 * already been persisted independently. Changing or withdrawing an opt-in
 * clears saved sensitive draft answers (without marking the assessment submitted).
 */
export function prepareIntimacyDraftPatch(
  moduleId: string,
  existingAnswers: Record<string, unknown>,
  proposedPatch: Record<string, unknown>,
  questions: MarriageQuestionDefinition[],
): Record<string, unknown> {
  if (moduleId !== MARRIAGE_INTIMACY_MODULE_ID) return proposedPatch;
  const optId = MARRIAGE_INTIMACY_OPT_IN_QUESTION_ID;
  const questionIds = new Set(questions.map((question) => question.id));
  for (const id of Object.keys(proposedPatch)) {
    if (!questionIds.has(id)) throw new Error("Unknown intimacy question.");
  }

  const hasOptInPatch = Object.prototype.hasOwnProperty.call(proposedPatch, optId);
  const requestedChoice = proposedPatch[optId];
  if (hasOptInPatch && requestedChoice !== "yes" && requestedChoice !== "no") {
    throw new Error("Choose Yes or Not now for the intimacy module.");
  }
  // A withdrawal generates null-valued cleanup patches for every sensitive field.
  // Only populated sensitive values require pre-existing, independently saved Yes.
  const sensitiveKeysWithAnswers = Object.keys(proposedPatch).filter(
    (key) => key !== optId && proposedPatch[key] !== null,
  );
  if (sensitiveKeysWithAnswers.length > 0 &&
      (hasOptInPatch || intimacyOptInChoice(existingAnswers) !== "yes")) {
    throw new Error("You must opt in and save your choice before answering intimacy questions.");
  }

  if (hasOptInPatch) {
    // On withdrawal or a fresh opt-in, never carry forward sensitive data collected
    // under an earlier or unconfirmed choice.
    if (requestedChoice === "no" || intimacyOptInChoice(existingAnswers) !== "yes") {
      return {
        ...Object.fromEntries(questions.filter((question) => question.id !== optId).map((question) => [question.id, null])),
        [optId]: requestedChoice,
      };
    }
  }
  return proposedPatch;
}

export function assertIntimacyCanSubmit(moduleId: string, answers: Record<string, unknown>): void {
  if (moduleId === MARRIAGE_INTIMACY_MODULE_ID && intimacyOptInChoice(answers) !== "yes") {
    throw new Error("The intimacy module is optional. Choose Yes to take part, or return to the learning center.");
  }
}
