import { MARRIAGE_COUNSELING_CONTENT_VERSION_V2026_1 } from "@/lib/marriage-counseling-curriculum-v2026-1";
import {
  ACTIVE_MARRIAGE_ASSESSMENT_CONTENT_VERSION,
  applyCanonicalQuestionCorrections,
  getCanonicalModuleDefinition,
  questionNeedsCanonicalCorrection,
} from "@/lib/marriage-curriculum-canonical";
import type {
  MarriageAssessmentResponseRecord,
  MarriageModuleDefinition,
  MarriageQuestionDefinition,
} from "@/lib/marriage-counseling-types";

export const ARCHIVED_ANSWERS_KEY = "_archivedAnswers";

export type ArchivedAssessmentAnswer = {
  value: unknown;
  priorContentVersion: string;
  priorQuestionType: string;
  archivedAt: string;
  reason: "question_type_changed" | "options_incompatible";
};

export type AssessmentMigrationNotice = {
  questionId: string;
  message: string;
};

function isEmptyAnswer(value: unknown): boolean {
  return value === undefined || value === null || value === "" || value === "__skip__";
}

function likertStyleValue(value: unknown): boolean {
  if (typeof value === "number") return value >= 1 && value <= 5;
  const s = String(value);
  return (
    ["1", "2", "3", "4", "5"].includes(s) ||
    ["strongly_disagree", "disagree", "neutral", "agree", "strongly_agree"].includes(s)
  );
}

export function isAnswerCompatibleWithQuestion(
  question: MarriageQuestionDefinition,
  value: unknown,
): boolean {
  if (isEmptyAnswer(value)) return true;
  if (question.type === "single_choice" || question.type === "scenario") {
    const id = String(value);
    return Boolean(question.options?.some((o) => o.id === id));
  }
  if (question.type === "multiple_choice") {
    if (!Array.isArray(value)) return false;
    return value.every((id) => question.options?.some((o) => o.id === String(id)));
  }
  if (question.type === "likert" || question.type === "agreement") {
    return likertStyleValue(value);
  }
  return true;
}

function readArchived(answers: Record<string, unknown>): Record<string, ArchivedAssessmentAnswer> {
  const raw = answers[ARCHIVED_ANSWERS_KEY];
  if (!raw || typeof raw !== "object") return {};
  return raw as Record<string, ArchivedAssessmentAnswer>;
}

function writeArchived(
  answers: Record<string, unknown>,
  archived: Record<string, ArchivedAssessmentAnswer>,
): Record<string, unknown> {
  if (Object.keys(archived).length === 0) {
    const next = { ...answers };
    delete next[ARCHIVED_ANSWERS_KEY];
    return next;
  }
  return { ...answers, [ARCHIVED_ANSWERS_KEY]: archived };
}

export type DraftMigrationResult = {
  record: MarriageAssessmentResponseRecord;
  notices: AssessmentMigrationNotice[];
  changed: boolean;
};

/**
 * Upgrade in-progress drafts to corrected 2026.2 question definitions without losing data.
 * Submitted responses must not be passed here.
 */
export function migrateDraftAssessmentResponse(input: {
  record: MarriageAssessmentResponseRecord;
  priorModule: MarriageModuleDefinition | null;
  targetModule: MarriageModuleDefinition;
}): DraftMigrationResult {
  const { record, priorModule, targetModule } = input;
  if (record.status === "submitted") {
    return { record, notices: [], changed: false };
  }

  const notices: AssessmentMigrationNotice[] = [];
  let answers: Record<string, unknown> = { ...record.answers };
  const archived = readArchived(answers);
  let changed = false;

  const priorQuestions = new Map(
    (priorModule?.questions ?? []).map((q) => [q.id, q]),
  );

  for (const question of targetModule.questions) {
    const currentValue = answers[question.id];
    if (isEmptyAnswer(currentValue)) continue;

    const priorQuestion = priorQuestions.get(question.id);
    const priorBroken =
      priorQuestion && questionNeedsCanonicalCorrection(record.moduleId, priorQuestion);
    const incompatible = !isAnswerCompatibleWithQuestion(question, currentValue);

    if (priorBroken || incompatible) {
      archived[question.id] = {
        value: currentValue,
        priorContentVersion: record.contentVersion,
        priorQuestionType: priorQuestion?.type ?? "unknown",
        archivedAt: new Date().toISOString(),
        reason: priorBroken ? "question_type_changed" : "options_incompatible",
      };
      delete answers[question.id];
      changed = true;
      notices.push({
        questionId: question.id,
        message:
          "This question was updated for clarity. Your earlier answer is kept privately on file — please answer the revised question below.",
      });
    }
  }

  if (changed) {
    answers = writeArchived(answers, archived);
  }

  const shouldBumpVersion =
    record.contentVersion === MARRIAGE_COUNSELING_CONTENT_VERSION_V2026_1 ||
    record.contentVersion !== ACTIVE_MARRIAGE_ASSESSMENT_CONTENT_VERSION ||
    changed;

  if (shouldBumpVersion) {
    changed = true;
  }

  const next: MarriageAssessmentResponseRecord = {
    ...record,
    contentVersion: ACTIVE_MARRIAGE_ASSESSMENT_CONTENT_VERSION,
    answers,
    lastSavedAt: changed ? new Date().toISOString() : record.lastSavedAt,
  };

  return { record: next, notices, changed };
}

export function moduleWithRuntimeCorrections(
  module: MarriageModuleDefinition | null,
): MarriageModuleDefinition | null {
  if (!module) return null;
  const corrected = applyCanonicalQuestionCorrections([module])[0];
  return corrected ?? module;
}

export function canonicalAssessmentModule(moduleId: string): MarriageModuleDefinition | null {
  return getCanonicalModuleDefinition(moduleId);
}
