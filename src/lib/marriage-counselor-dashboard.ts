import type { PublicMember } from "@/lib/auth-types";
import {
  assertMarriageCounselorRole,
  viewerHasClinicalCounselorAccess,
} from "@/lib/marriage-counseling-access";
import { isSeniorPastor } from "@/lib/marriage-counselor-assignment-authority";
import type { MarriageCounselingJourneyRecord } from "@/lib/marriage-counseling-types";
import {
  buildMarriageCounselorAdministrativeOverview,
  type MarriageCounselorAdministrativeOverview,
  type MarriageCounselorModuleProgressOverview,
} from "@/lib/marriage-counselor-admin-overview";
import {
  buildMarriageCounselorClinicalDetail,
  type MarriageCounselorAuthorizedAnswerView,
} from "@/lib/marriage-counselor-clinical-detail";
import { marriageStore } from "@/lib/stores/marriage-counseling-store";

const store = () => marriageStore();

export async function listMarriageCounselorDashboardJourneys(
  viewerId: string,
): Promise<MarriageCounselingJourneyRecord[]> {
  return store().listJourneysForCounselor(viewerId);
}

export async function assertCounselorCanAccessJourneyOnDashboard(
  viewer: PublicMember,
  journey: MarriageCounselingJourneyRecord,
): Promise<void> {
  await assertMarriageCounselorRole(viewer);
  if (journey.status === "archived") {
    throw new Error("Access denied.");
  }
  const visible = await listMarriageCounselorDashboardJourneys(viewer.id);
  if (visible.some((j) => j.id === journey.id)) {
    return;
  }
  if (journey.programType === "premarital" && (await isSeniorPastor(viewer))) {
    return;
  }
  throw new Error("Access denied.");
}

export type MarriageCounselorClinicalDashboardRow = {
  access: "clinical";
  journeyId: string;
  coupleNames: string;
  journeyStatus: string;
  programType: string;
  moduleProgress: MarriageCounselorModuleProgressOverview[];
  authorizedAnswers: MarriageCounselorAuthorizedAnswerView[];
  sessions: Array<{
    id: string;
    scheduledAt: string;
    schedulingTimeZone?: string;
    topic?: string;
    zoomUrl?: string;
    status?: string;
  }>;
  assignments: Array<{ id: string; title: string; dueAt?: string }>;
  homeworkDue: Array<{ id: string; title: string; dueAt?: string }>;
};

export type MarriageCounselorDashboardRow =
  | MarriageCounselorAdministrativeOverview
  | MarriageCounselorClinicalDashboardRow;

export async function buildClinicalDashboardRow(
  viewer: PublicMember,
  journey: MarriageCounselingJourneyRecord,
): Promise<MarriageCounselorClinicalDashboardRow> {
  const detail = await buildMarriageCounselorClinicalDetail(viewer, journey);
  const dueAssignments = detail.assignments.filter(
    (a) => a.dueAt && new Date(a.dueAt).getTime() >= Date.now(),
  );
  return {
    access: "clinical",
    journeyId: detail.journeyId,
    coupleNames: detail.coupleNames,
    journeyStatus: detail.journeyStatus,
    programType: detail.programType,
    moduleProgress: detail.moduleProgress,
    authorizedAnswers: detail.authorizedAnswers,
    sessions: detail.sessions,
    assignments: detail.assignments.map((a) => ({
      id: a.id,
      title: a.title,
      dueAt: a.dueAt,
    })),
    homeworkDue: dueAssignments.map((a) => ({
      id: a.id,
      title: a.title,
      dueAt: a.dueAt,
    })),
  };
}

export async function buildCounselorDashboardRows(
  viewer: PublicMember,
): Promise<MarriageCounselorDashboardRow[]> {
  await assertMarriageCounselorRole(viewer);
  const journeys = (await listMarriageCounselorDashboardJourneys(viewer.id)).slice(0, 50);
  const rows: MarriageCounselorDashboardRow[] = [];
  for (const journey of journeys) {
    if (await viewerHasClinicalCounselorAccess(viewer, journey)) {
      rows.push(await buildClinicalDashboardRow(viewer, journey));
    } else {
      rows.push(await buildMarriageCounselorAdministrativeOverview(viewer, journey));
    }
  }
  return rows;
}
