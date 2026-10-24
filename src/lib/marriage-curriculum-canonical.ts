import {
  MARRIAGE_COUNSELING_CONTENT_VERSION,
  MARRIAGE_COUNSELING_MODULES,
} from "@/lib/marriage-counseling-curriculum";
import type {
  MarriageModuleDefinition,
  MarriageQuestionDefinition,
} from "@/lib/marriage-counseling-types";
import { validateMarriageCurriculumModules } from "@/lib/marriage-curriculum-validation";

const canonicalModuleById = new Map(MARRIAGE_COUNSELING_MODULES.map((m) => [m.id, m]));

function questionValidationIssues(
  moduleId: string,
  question: MarriageQuestionDefinition,
): boolean {
  const issues = validateMarriculumModulesSingleQuestion(moduleId, question);
  return issues.length > 0;
}

function validateMarriculumModulesSingleQuestion(
  moduleId: string,
  question: MarriageQuestionDefinition,
) {
  return validateMarriageCurriculumModules([
    {
      id: moduleId,
      title: "",
      summary: "",
      sortOrder: 0,
      programTypes: ["premarital"],
      questions: [question],
    },
  ]);
}

/** True when a stored/published question should be replaced by built-in 2026.2 canonical. */
export function questionNeedsCanonicalCorrection(
  moduleId: string,
  question: MarriageQuestionDefinition,
): boolean {
  const canonical = canonicalModuleById.get(moduleId)?.questions.find((q) => q.id === question.id);
  if (!canonical) return false;
  if (question.type !== canonical.type) return true;
  if (questionValidationIssues(moduleId, question)) return true;
  return false;
}

/** Merge admin-published modules with non-overridable 2026.2 Stage 1 corrections from seed. */
export function applyCanonicalQuestionCorrections(
  modules: MarriageModuleDefinition[],
): MarriageModuleDefinition[] {
  return modules.map((mod) => {
    const canonical = canonicalModuleById.get(mod.id);
    if (!canonical) return mod;
    const canonicalById = new Map(canonical.questions.map((q) => [q.id, q]));
    return {
      ...mod,
      questions: mod.questions.map((q) => {
        const replacement = canonicalById.get(q.id);
        if (!replacement) return q;
        if (questionNeedsCanonicalCorrection(mod.id, q)) {
          return { ...replacement };
        }
        return q;
      }),
    };
  });
}

export function getCanonicalModuleDefinition(moduleId: string): MarriageModuleDefinition | null {
  return canonicalModuleById.get(moduleId) ?? null;
}

export function getCanonicalModuleDefinitions(): MarriageModuleDefinition[] {
  return MARRIAGE_COUNSELING_MODULES.filter((m) => !m.archived);
}

/** Modules as served to new assessments and hub lists (published + corrections + stage2 merge applied elsewhere). */
export function correctModulesForRuntime(modules: MarriageModuleDefinition[]): MarriageModuleDefinition[] {
  return applyCanonicalQuestionCorrections(modules);
}

export const ACTIVE_MARRIAGE_ASSESSMENT_CONTENT_VERSION = MARRIAGE_COUNSELING_CONTENT_VERSION;
