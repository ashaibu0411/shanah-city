import type { PublicMember } from "@/lib/auth-types";
import {
  assertClinicalCounselorForJourney,
  viewerHasClinicalCounselorAccess,
} from "@/lib/marriage-counseling-access";
import {
  assertCounselorCanAccessJourneyOnDashboard,
  buildCounselorDashboardRows,
} from "@/lib/marriage-counselor-dashboard";
import { buildMarriageCounselorAdministrativeOverview } from "@/lib/marriage-counselor-admin-overview";
import { buildMarriageCounselorClinicalDetail } from "@/lib/marriage-counselor-clinical-detail";
import { logMarriageAudit } from "@/lib/marriage-counseling-audit";
import { resolveJourneyPartnerId, viewerIsJourneyParticipant } from "@/lib/marriage-counseling-participants";
import {
  getModuleForContentVersion,
} from "@/lib/marriage-curriculum-service";
import type {
  MarriageCounselingSessionRecord,
  MarriageCounselorAssignmentRecord,
  MarriageCounselorNoteRecord,
} from "@/lib/marriage-counseling-types";
import { listCounselorWithConsentQuestionIds } from "@/lib/marriage-assessment-answer-changes";
import {
  MARRIAGE_COUNSELOR_ACCESS_DENIED,
  throwCounselorAccessDenied,
  toCounselorSessionApiView,
  type MarriageCounselorSessionApiView,
} from "@/lib/marriage-counselor-api-security";
import { normalizeAssignmentDueAtInput } from "@/lib/marriage-session-scheduling";
import { marriageStore } from "@/lib/stores/marriage-counseling-store";

const store = () => marriageStore();

export async function createCounselingSession(
  counselor: PublicMember,
  input: {
    journeyId: string;
    scheduledAt: string;
    schedulingTimeZone?: string;
    topic?: string;
    zoomUrl?: string;
    prepModuleIds?: string[];
    homework?: Array<{ title: string; description?: string; moduleId?: string; dueAt?: string }>;
  },
) {
  const journey = await store().getJourneyById(input.journeyId);
  if (!journey) throwCounselorAccessDenied();
  await assertClinicalCounselorForJourney(counselor, journey);

  const now = new Date().toISOString();
  const homeworkIds: string[] = [];
  for (const item of input.homework ?? []) {
    const due = item.dueAt
      ? normalizeAssignmentDueAtInput({
          dueAt: item.dueAt,
          schedulingTimeZone: input.schedulingTimeZone,
        })
      : undefined;
    const assignment: MarriageCounselorAssignmentRecord = {
      id: `mca-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      journeyId: journey.id,
      counselorUserId: counselor.id,
      title: item.title,
      description: item.description,
      moduleId: item.moduleId,
      dueAt: due?.dueAt,
      dueAtTimeZone: due?.dueAtTimeZone,
      completedByUserIds: [],
      createdAt: now,
    };
    await store().saveAssignment(assignment);
    homeworkIds.push(assignment.id);
  }

  const session: MarriageCounselingSessionRecord = {
    id: `mcs-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    journeyId: journey.id,
    scheduledAt: input.scheduledAt,
    schedulingTimeZone: input.schedulingTimeZone,
    topic: input.topic,
    zoomUrl: input.zoomUrl?.trim() || undefined,
    prepModuleIds: input.prepModuleIds,
    homeworkAssignmentIds: homeworkIds,
    status: "scheduled",
    createdBy: counselor.id,
    createdAt: now,
    updatedAt: now,
  };
  await store().saveSession(session);

  await logMarriageAudit({
    actorUserId: counselor.id,
    action: "session_created",
    journeyId: journey.id,
    meta: { sessionId: session.id },
  });

  return toCounselorSessionApiView(session, counselor.id);
}

export async function updateCounselingSession(
  counselor: PublicMember,
  sessionId: string,
  patch: Partial<{
    scheduledAt: string;
    schedulingTimeZone: string;
    topic: string;
    zoomUrl: string;
    status: "scheduled" | "completed" | "cancelled";
    notes: string;
  }>,
): Promise<MarriageCounselorSessionApiView> {
  const session = await store().getSessionById(sessionId);
  if (!session) throwCounselorAccessDenied();

  const journey = await store().getJourneyById(session.journeyId);
  if (!journey || journey.id !== session.journeyId) throwCounselorAccessDenied();

  try {
    await assertClinicalCounselorForJourney(counselor, journey);
  } catch {
    throwCounselorAccessDenied();
  }

  if (session.createdBy !== counselor.id) throwCounselorAccessDenied();

  const now = new Date().toISOString();
  const updated: MarriageCounselingSessionRecord = {
    ...session,
    ...patch,
    updatedAt: now,
    completedAt: patch.status === "completed" ? now : session.completedAt,
    cancelledAt: patch.status === "cancelled" ? now : session.cancelledAt,
  };
  await store().saveSession(updated);
  return toCounselorSessionApiView(updated, counselor.id);
}

export async function saveCounselorPrivateNote(
  counselor: PublicMember,
  journeyId: string,
  body: string,
) {
  const journey = await store().getJourneyById(journeyId);
  if (!journey) throwCounselorAccessDenied();
  await assertClinicalCounselorForJourney(counselor, journey);
  const now = new Date().toISOString();
  const note: MarriageCounselorNoteRecord = {
    id: `mcn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    journeyId,
    counselorUserId: counselor.id,
    body: body.trim(),
    createdAt: now,
    updatedAt: now,
  };
  await store().saveCounselorNote(note);
  await logMarriageAudit({
    actorUserId: counselor.id,
    action: "counselor_note_saved",
    journeyId,
  });
  return note;
}

export async function createCounselorActivityAssignment(
  counselor: PublicMember,
  input: {
    journeyId: string;
    title: string;
    description?: string;
    moduleId?: string;
    dueAt?: string;
    dueAtLocal?: string;
    schedulingTimeZone?: string;
  },
) {
  const journey = await store().getJourneyById(input.journeyId);
  if (!journey) throwCounselorAccessDenied();
  await assertClinicalCounselorForJourney(counselor, journey);
  const now = new Date().toISOString();
  const due = normalizeAssignmentDueAtInput({
    dueAt: input.dueAt,
    dueAtLocal: input.dueAtLocal,
    schedulingTimeZone: input.schedulingTimeZone,
  });
  const assignment: MarriageCounselorAssignmentRecord = {
    id: `mca-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    journeyId: journey.id,
    counselorUserId: counselor.id,
    title: input.title.trim(),
    description: input.description?.trim(),
    moduleId: input.moduleId,
    dueAt: due?.dueAt,
    dueAtTimeZone: due?.dueAtTimeZone,
    completedByUserIds: [],
    createdAt: now,
  };
  await store().saveAssignment(assignment);
  await logMarriageAudit({
    actorUserId: counselor.id,
    action: "counselor_assignment_created",
    journeyId: journey.id,
    meta: { assignmentId: assignment.id, moduleId: input.moduleId ?? "" },
  });
  return assignment;
}

export async function markHomeworkComplete(
  viewer: PublicMember,
  assignmentId: string,
) {
  const assignment = await store().getAssignmentById(assignmentId);
  if (!assignment) throw new Error("Assignment not found.");
  const journey = await store().getJourneyById(assignment.journeyId);
  if (!journey) throw new Error("Journey not found.");
  if (!(await viewerIsJourneyParticipant(journey, viewer.id))) {
    throw new Error("Not allowed.");
  }
  if (!assignment.completedByUserIds.includes(viewer.id)) {
    assignment.completedByUserIds.push(viewer.id);
  }
  await store().saveAssignment(assignment);
  return assignment;
}

export async function getCounselorJourneyDetail(counselor: PublicMember, journeyId: string) {
  const journey = await store().getJourneyById(journeyId);
  if (!journey) throw new Error(MARRIAGE_COUNSELOR_ACCESS_DENIED);
  if (journey.status === "archived") {
    throw new Error(MARRIAGE_COUNSELOR_ACCESS_DENIED);
  }
  try {
    await assertCounselorCanAccessJourneyOnDashboard(counselor, journey);
  } catch {
    throw new Error(MARRIAGE_COUNSELOR_ACCESS_DENIED);
  }
  if (await viewerHasClinicalCounselorAccess(counselor, journey)) {
    return buildMarriageCounselorClinicalDetail(counselor, journey);
  }
  return buildMarriageCounselorAdministrativeOverview(counselor, journey);
}

export async function requestAssessmentRevision(
  viewer: PublicMember,
  moduleId: string,
  reason?: string,
) {
  const journey = await store().getActiveJourneyForUser(viewer.id);
  if (!journey) throw new Error("No active journey.");
  const response = await store().getResponse(journey.id, moduleId, viewer.id);
  if (response?.status !== "submitted") throw new Error("Submit the assessment before requesting revision.");

  const record = await store().createRevisionRequest({
    id: `mrr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    journeyId: journey.id,
    moduleId,
    userId: viewer.id,
    reason,
    status: "pending",
    requestedAt: new Date().toISOString(),
  });
  return record;
}

export async function resolveRevisionRequest(
  counselor: PublicMember,
  requestId: string,
  decision: "approved" | "denied",
) {
  const request = await store().getRevisionRequestById(requestId);
  if (!request) throw new Error("Request not found.");
  const journey = await store().getJourneyById(request.journeyId);
  if (!journey) throw new Error("Journey not found.");
  await assertClinicalCounselorForJourney(counselor, journey);

  if (request.status !== "pending") {
    return { ok: true };
  }

  const now = new Date().toISOString();

  if (decision === "approved") {
    const response = await store().getResponse(journey.id, request.moduleId, request.userId);
    if (!response) throw new Error("Assessment response not found.");
    const moduleDef = await getModuleForContentVersion(request.moduleId, response.contentVersion);
    if (!moduleDef) throw new Error("Module not found.");
    const counselorConsentQuestionIds = listCounselorWithConsentQuestionIds(moduleDef.questions);
    await store().approveAssessmentRevisionRequest(
      requestId,
      counselor.id,
      counselorConsentQuestionIds,
    );
  } else {
    await store().updateRevisionRequest(requestId, {
      status: "denied",
      resolvedAt: now,
      resolvedBy: counselor.id,
    });
  }

  await logMarriageAudit({
    actorUserId: counselor.id,
    action: decision === "approved" ? "revision_approved" : "revision_denied",
    journeyId: journey.id,
    targetUserId: request.userId,
    meta: { moduleId: request.moduleId },
  });

  return { ok: true };
}

export async function getEnhancedCounselorDashboard(viewer: PublicMember) {
  const { buildMarriageCounselorCommandCenter } = await import(
    "@/lib/marriage-counselor-command-center-server"
  );
  const [rows, commandCenter] = await Promise.all([
    buildCounselorDashboardRows(viewer),
    buildMarriageCounselorCommandCenter(viewer),
  ]);
  return { rows, commandCenter, counselorId: viewer.id };
}
