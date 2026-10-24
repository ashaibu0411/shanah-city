import {
  MARRIAGE_COUNSELING_CONTENT_VERSION,
  MARRIAGE_COUNSELING_MODULES,
} from "@/lib/marriage-counseling-curriculum";
import {
  MARRIAGE_COUNSELING_CONTENT_VERSION_V2026_1,
  MARRIAGE_COUNSELING_MODULES_V2026_1,
} from "@/lib/marriage-counseling-curriculum-v2026-1";
import {
  ACTIVE_MARRIAGE_ASSESSMENT_CONTENT_VERSION,
  applyCanonicalQuestionCorrections,
  getCanonicalModuleDefinition,
} from "@/lib/marriage-curriculum-canonical";
import { DEFAULT_PROGRAM_TRACKS } from "@/lib/marriage-counseling-program-tracks";
import type {
  MarriageCounselingJourneyRecord,
  MarriageModuleDefinition,
  MarriageProgramTrackEntry,
  MarriageProgramType,
} from "@/lib/marriage-counseling-types";
import { marriageCurriculumStore } from "@/lib/stores/marriage-curriculum-store";
import {
  mergeMissingStage2Modules,
} from "@/lib/marriage-curriculum-stage2-merge";
import { allStage2ModuleDefinitions } from "@/lib/marriage-stage2-module-registry";
import { isMarriageStage2Enabled } from "@/lib/marriage-stage2-feature";

const curriculumStore = () => marriageCurriculumStore();

export async function getActiveContentVersionLabel() {
  const published = await curriculumStore().getPublishedCurriculumVersion();
  if (!published) return ACTIVE_MARRIAGE_ASSESSMENT_CONTENT_VERSION;
  if (published.version === MARRIAGE_COUNSELING_CONTENT_VERSION_V2026_1) {
    return ACTIVE_MARRIAGE_ASSESSMENT_CONTENT_VERSION;
  }
  return published.version;
}

export async function getAllModuleDefinitions(): Promise<MarriageModuleDefinition[]> {
  const published = await curriculumStore().getPublishedCurriculumVersion();
  let modules = published?.modules?.length
    ? published.modules.filter((m) => !m.archived)
    : MARRIAGE_COUNSELING_MODULES.filter((m) => !m.archived);
  modules = applyCanonicalQuestionCorrections(modules);
  modules = mergeMissingStage2Modules(modules);
  return modules;
}

export async function getModuleDefinition(moduleId: string): Promise<MarriageModuleDefinition | null> {
  const modules = await getAllModuleDefinitions();
  return modules.find((m) => m.id === moduleId) ?? null;
}

export async function getProgramTrackEntries(
  programType: MarriageProgramType,
): Promise<MarriageProgramTrackEntry[]> {
  return curriculumStore().getProgramTrack(programType);
}

export async function resolveJourneyModuleEntries(
  journey: MarriageCounselingJourneyRecord,
): Promise<MarriageProgramTrackEntry[]> {
  if (journey.programType === "guided") {
    const ids = journey.guidedModuleIds ?? [];
    return ids.map((moduleId) => ({ moduleId, required: true }));
  }
  const track = await getProgramTrackEntries(journey.programType);
  if (track.length) return track;
  return DEFAULT_PROGRAM_TRACKS[journey.programType];
}

export async function listModulesForJourney(journey: MarriageCounselingJourneyRecord) {
  const entries = await resolveJourneyModuleEntries(journey);
  const all = await getAllModuleDefinitions();
  const byId = new Map(all.map((m) => [m.id, m]));
  return entries
    .map((entry) => {
      const mod = byId.get(entry.moduleId);
      if (!mod) return null;
      return { ...mod, requiredForJourney: entry.required };
    })
    .filter(Boolean) as Array<MarriageModuleDefinition & { requiredForJourney: boolean }>;
}

/** Module snapshot for a specific submitted content version (preserves historical prompts). */
export async function getModuleForContentVersion(
  moduleId: string,
  contentVersion: string,
): Promise<MarriageModuleDefinition | null> {
  const versions = await curriculumStore().listCurriculumVersions();
  const match = versions.find((v) => v.version === contentVersion && v.status !== "draft");
  if (match) {
    const mod = match.modules.find((m) => m.id === moduleId);
    if (mod) {
      const corrected = applyCanonicalQuestionCorrections([mod])[0];
      return corrected ?? mod;
    }
    // Published snapshot may predate Stage 2 modules — fall through to live definitions.
  }
  if (contentVersion === MARRIAGE_COUNSELING_CONTENT_VERSION) {
    const legacy = getCanonicalModuleDefinition(moduleId);
    if (legacy) return legacy;
  }
  if (contentVersion === MARRIAGE_COUNSELING_CONTENT_VERSION_V2026_1) {
    const frozen = MARRIAGE_COUNSELING_MODULES_V2026_1.find((m) => m.id === moduleId);
    if (frozen) return frozen;
  }
  if (isMarriageStage2Enabled() && moduleId.startsWith("s2-")) {
    const stage2 = allStage2ModuleDefinitions().find((m) => m.id === moduleId);
    if (stage2) return stage2;
  }
  return getModuleDefinition(moduleId);
}
