import type {
  MarriageModuleDefinition,
  MarriageQuestionDefinition,
  MarriageStage2LessonDefinition,
} from "@/lib/marriage-counseling-types";

export function isQuestionAnswered(question: MarriageQuestionDefinition, answers: Record<string, unknown>): boolean {
  const value = answers[question.id];
  if (value === undefined || value === null || value === "") return false;
  if (value === "__skip__") return Boolean(question.allowSkip);
  if (question.type === "partner_prediction") {
    const choice =
      typeof value === "object" && value && "choice" in (value as object)
        ? (value as { choice: string }).choice
        : value;
    return Boolean(choice);
  }
  if (question.type === "budget_worksheet") {
    return typeof value === "object" && value !== null && "monthlyIncome" in (value as object);
  }
  return true;
}

export function computeModuleSubmissionProgress(
  module: MarriageModuleDefinition,
  answers: Record<string, unknown>,
) {
  const required = module.questions.filter((q) => q.required);
  const optional = module.questions.filter((q) => !q.required);
  const requiredDone = required.filter((q) => isQuestionAnswered(q, answers)).length;
  const optionalDone = optional.filter((q) => isQuestionAnswered(q, answers)).length;
  const canSubmit = required.every((q) => isQuestionAnswered(q, answers));
  return {
    requiredTotal: required.length,
    requiredDone,
    optionalTotal: optional.length,
    optionalDone,
    canSubmit,
  };
}

export function computeLessonProgress(
  lesson: MarriageStage2LessonDefinition,
  questions: MarriageQuestionDefinition[],
  answers: Record<string, unknown>,
) {
  const qs = questions.filter((q) => q.lessonId === lesson.id);
  const required = qs.filter((q) => q.required);
  const optional = qs.filter((q) => !q.required);
  const answered = qs.filter((q) => isQuestionAnswered(q, answers)).length;
  const requiredComplete = required.every((q) => isQuestionAnswered(q, answers));
  return {
    answered,
    total: qs.length,
    requiredTotal: required.length,
    requiredDone: required.filter((q) => isQuestionAnswered(q, answers)).length,
    optionalRemaining: optional.filter((q) => !isQuestionAnswered(q, answers)).length,
    requiredComplete,
    pct: qs.length ? answered / qs.length : 0,
  };
}

export type CounselorPartnerLessonRow = {
  answered: number;
  total: number;
  requiredComplete: boolean;
  optionalRemaining: number;
};

export function counselorLessonRowsForModule(
  mod: MarriageModuleDefinition,
  answersByUserId: Map<string, Record<string, unknown>>,
  participantAId: string,
  participantBId: string | null,
): Array<{
  lessonId: string;
  title: string;
  partnerA: CounselorPartnerLessonRow;
  partnerB: CounselorPartnerLessonRow | null;
}> {
  if (!mod.lessons?.length) return [];
  const a = answersByUserId.get(participantAId) ?? {};
  const b = participantBId ? (answersByUserId.get(participantBId) ?? {}) : null;
  return mod.lessons.map((lesson) => {
    const pa = computeLessonProgress(lesson, mod.questions, a);
    const pb = b
      ? computeLessonProgress(lesson, mod.questions, b)
      : null;
    return {
      lessonId: lesson.id,
      title: lesson.title,
      partnerA: {
        answered: pa.answered,
        total: pa.total,
        requiredComplete: pa.requiredComplete,
        optionalRemaining: pa.optionalRemaining,
      },
      partnerB: pb
        ? {
            answered: pb.answered,
            total: pb.total,
            requiredComplete: pb.requiredComplete,
            optionalRemaining: pb.optionalRemaining,
          }
        : null,
    };
  });
}
