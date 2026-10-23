import type { PublicMember } from "@/lib/auth-types";
import { viewerHasClinicalCounselorAccess } from "@/lib/marriage-counseling-access";
import type { MarriageCounselingJourneyRecord } from "@/lib/marriage-counseling-types";
import {
  resolveAssignedCounselorDisplayName,
  resolveCoupleDisplayNames,
} from "@/lib/marriage-counselor-journey-names";
import { listModulesForJourney } from "@/lib/marriage-curriculum-service";
import { marriageStore } from "@/lib/stores/marriage-counseling-store";

const store = () => marriageStore();

export type MarriageCounselorModuleProgressOverview = {
  moduleId: string;
  title: string;
  bothSubmitted: boolean;
  awaitingBoth: boolean;
  submittedCount: number;
};

export type MarriageCounselorAdministrativeOverview = {
  access: "administrative";
  journeyId: string;
  coupleNames: string;
  assignedCounselorUserId: string | null;
  assignedCounselorName: string | null;
  journeyStatus: string;
  programType: string;
  moduleCount: number;
  completedModules: number;
  viewerHasClinicalAccess: boolean;
};

export async function buildModuleProgressOverview(
  journey: MarriageCounselingJourneyRecord,
): Promise<MarriageCounselorModuleProgressOverview[]> {
  const modules = await listModulesForJourney(journey);
  const progress: MarriageCounselorModuleProgressOverview[] = [];
  for (const mod of modules) {
    const responses = await store().listResponsesForJourneyModule(journey.id, mod.id);
    const submitted = responses.filter((r) => r.status === "submitted");
    progress.push({
      moduleId: mod.id,
      title: mod.title,
      awaitingBoth: submitted.length < 2,
      bothSubmitted: submitted.length >= 2,
      submittedCount: submitted.length,
    });
  }
  return progress;
}

export async function buildMarriageCounselorAdministrativeOverview(
  viewer: PublicMember,
  journey: MarriageCounselingJourneyRecord,
): Promise<MarriageCounselorAdministrativeOverview> {
  const moduleProgress = await buildModuleProgressOverview(journey);
  const completedModules = moduleProgress.filter((m) => m.bothSubmitted).length;
  return {
    access: "administrative",
    journeyId: journey.id,
    coupleNames: await resolveCoupleDisplayNames(journey),
    assignedCounselorUserId: journey.counselorUserId,
    assignedCounselorName: await resolveAssignedCounselorDisplayName(journey.counselorUserId),
    journeyStatus: journey.status,
    programType: journey.programType,
    moduleCount: moduleProgress.length,
    completedModules,
    viewerHasClinicalAccess: await viewerHasClinicalCounselorAccess(viewer, journey),
  };
}
