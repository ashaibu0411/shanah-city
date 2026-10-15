import type { PublicMember } from "@/lib/auth-types";
import { getUserById } from "@/lib/auth-server";
import {
  assertCounselorForJourney,
  counselorCanViewJourney,
  isMarriageCounselor,
} from "@/lib/marriage-counseling-access";
import { logMarriageAudit } from "@/lib/marriage-counseling-audit";
import { resolveJourneyPartnerId, viewerIsJourneyParticipant } from "@/lib/marriage-counseling-participants";
import { buildSharedComparisonItems } from "@/lib/marriage-counseling-comparison-utils";
import {
  getActiveContentVersionLabel,
  getModuleForContentVersion,
  listModulesForJourney,
} from "@/lib/marriage-curriculum-service";
import type {
  MarriageCounselingSessionRecord,
  MarriageCounselorAssignmentRecord,
  MarriageCounselorNoteRecord,
} from "@/lib/marriage-counseling-types";
import { counselorLessonRowsForModule, computeModuleSubmissionProgress } from "@/lib/marriage-module-progress";
import { marriageStore } from "@/lib/stores/marriage-counseling-store";

const store = () => marriageStore();

export async function createCounselingSession(
  counselor: PublicMember,
  input: {
    journeyId: string;
    scheduledAt: string;
    topic?: string;
    zoomUrl?: string;
    prepModuleIds?: string[];
    homework?: Array<{ title: string; description?: string; moduleId?: string; dueAt?: string }>;
  },
) {
  const journey = await store().getJourneyById(input.journeyId);
  if (!journey) throw new Error("Journey not found.");
  await assertCounselorForJourney(counselor, journey);

  const now = new Date().toISOString();
  const homeworkIds: string[] = [];
  for (const item of input.homework ?? []) {
    const assignment: MarriageCounselorAssignmentRecord = {
      id: `mca-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      journeyId: journey.id,
      counselorUserId: counselor.id,
      title: item.title,
      description: item.description,
      moduleId: item.moduleId,
      dueAt: item.dueAt,
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

  return session;
}

export async function updateCounselingSession(
  counselor: PublicMember,
  sessionId: string,
  patch: Partial<{
    scheduledAt: string;
    topic: string;
    zoomUrl: string;
    status: "scheduled" | "completed" | "cancelled";
    notes: string;
  }>,
) {
  const session = await store().getSessionById(sessionId);
  if (!session) throw new Error("Session not found.");
  const journey = await store().getJourneyById(session.journeyId);
  if (!journey) throw new Error("Journey not found.");
  await assertCounselorForJourney(counselor, journey);

  const now = new Date().toISOString();
  const updated: MarriageCounselingSessionRecord = {
    ...session,
    ...patch,
    updatedAt: now,
    completedAt: patch.status === "completed" ? now : session.completedAt,
    cancelledAt: patch.status === "cancelled" ? now : session.cancelledAt,
  };
  await store().saveSession(updated);
  return updated;
}

export async function saveCounselorPrivateNote(
  counselor: PublicMember,
  journeyId: string,
  body: string,
) {
  const journey = await store().getJourneyById(journeyId);
  if (!journey) throw new Error("Journey not found.");
  await assertCounselorForJourney(counselor, journey);
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
  },
) {
  const journey = await store().getJourneyById(input.journeyId);
  if (!journey) throw new Error("Journey not found.");
  await assertCounselorForJourney(counselor, journey);
  const now = new Date().toISOString();
  const assignment: MarriageCounselorAssignmentRecord = {
    id: `mca-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    journeyId: journey.id,
    counselorUserId: counselor.id,
    title: input.title.trim(),
    description: input.description?.trim(),
    moduleId: input.moduleId,
    dueAt: input.dueAt,
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
  if (!journey) throw new Error("Journey not found.");
  await counselorCanViewJourney(counselor, journey);

  const modules = await listModulesForJourney(journey);
  const moduleProgress = [];
  const stage2LessonProgress: Array<{
    moduleId: string;
    title: string;
    partnerAStatus: string;
    partnerBStatus: string;
    comparisonReady: boolean;
    partnerARequiredComplete: boolean;
    partnerBRequiredComplete: boolean;
    optionalRemainingA: number;
    optionalRemainingB: number;
    lessons: ReturnType<typeof counselorLessonRowsForModule>;
  }> = [];

  const participantAId = journey.participantAId ?? "";
  const participantBId = journey.participantBId ?? null;

  for (const mod of modules) {
    const responses = await store().listResponsesForJourneyModule(journey.id, mod.id);
    const submitted = responses.filter((r) => r.status === "submitted");
    moduleProgress.push({
      moduleId: mod.id,
      title: mod.title,
      awaitingBoth: submitted.length < 2,
      bothSubmitted: submitted.length >= 2,
    });

    const contentVersion =
      journey.curriculumVersion ?? responses[0]?.contentVersion ?? (await getActiveContentVersionLabel());
    const moduleDef = await getModuleForContentVersion(mod.id, contentVersion);
    if (!moduleDef?.lessons?.length || !participantAId) continue;

    const answersByUser = new Map<string, Record<string, unknown>>();
    for (const r of responses) {
      answersByUser.set(r.userId, r.answers ?? {});
    }
    const progA = computeModuleSubmissionProgress(moduleDef, answersByUser.get(participantAId) ?? {});
    const progB = participantBId
      ? computeModuleSubmissionProgress(moduleDef, answersByUser.get(participantBId) ?? {})
      : null;
    const version = submitted[0]?.contentVersion;
    let comparisonReady = false;
    if (submitted.length >= 2 && version) {
      comparisonReady = Boolean(await store().getUnlock(journey.id, mod.id, version));
    }
    const statusFor = (uid: string) => responses.find((r) => r.userId === uid)?.status ?? "not_started";

    stage2LessonProgress.push({
      moduleId: mod.id,
      title: mod.title,
      partnerAStatus: statusFor(participantAId),
      partnerBStatus: participantBId ? statusFor(participantBId) : "not_started",
      comparisonReady,
      partnerARequiredComplete: progA.canSubmit,
      partnerBRequiredComplete: progB?.canSubmit ?? false,
      optionalRemainingA: progA.optionalTotal - progA.optionalDone,
      optionalRemainingB: progB ? progB.optionalTotal - progB.optionalDone : 0,
      lessons: counselorLessonRowsForModule(moduleDef, answersByUser, participantAId, participantBId),
    });
  }

  const comparisonSummaries: Array<{
    moduleId: string;
    moduleTitle: string;
    needsAttention: number;
    aligned: number;
    items: ReturnType<typeof buildSharedComparisonItems>;
  }> = [];

  for (const mod of modules) {
    const responses = await store().listResponsesForJourneyModule(journey.id, mod.id);
    const submitted = responses.filter((r) => r.status === "submitted");
    if (submitted.length >= 2) {
      const version = submitted[0].contentVersion;
      const unlock = await store().getUnlock(journey.id, mod.id, version);
      if (unlock) {
        const moduleDef = await getModuleForContentVersion(mod.id, version);
        if (moduleDef) {
          const items = buildSharedComparisonItems(
            moduleDef.questions,
            submitted[0].answers,
            submitted[1].answers,
          );
          comparisonSummaries.push({
            moduleId: mod.id,
            moduleTitle: mod.title,
            needsAttention: items.filter((i) => i.category !== "aligned").length,
            aligned: items.filter((i) => i.category === "aligned").length,
            items,
          });
        }
      }
    }
  }

  const authorizedAnswers = [];
  for (const mod of modules) {
    const responses = await store().listResponsesForJourneyModule(journey.id, mod.id);
    for (const response of responses) {
      if (response.status !== "submitted") continue;
      const moduleDef = await getModuleForContentVersion(mod.id, response.contentVersion);
      if (!moduleDef) continue;
      for (const question of moduleDef.questions) {
        if (question.visibility !== "counselor_with_consent") continue;
        const user = await getUserById(response.userId);
        authorizedAnswers.push({
          moduleId: mod.id,
          moduleTitle: mod.title,
          questionId: question.id,
          prompt: question.prompt,
          userId: response.userId,
          userName: user?.name ?? "Member",
          answer: response.answers[question.id],
        });
      }
    }
  }

  const partnerA = journey.participantAId ? await getUserById(journey.participantAId) : null;
  let partnerBName = journey.participantBId ? (await getUserById(journey.participantBId))?.name : null;
  if (!partnerA && journey.coupleLinkId) {
    const { getCoupleLinkById } = await import("@/lib/couple-link-server");
    const link = await getCoupleLinkById(journey.coupleLinkId);
    if (link) {
      const a = await getUserById(link.userAId);
      const b = await getUserById(link.userBId);
      return {
        journey,
        coupleLabel: [a?.name, b?.name].filter(Boolean).join(" & "),
        moduleProgress,
        stage2LessonProgress,
        comparisonSummaries,
        attentionAreas: comparisonSummaries
          .flatMap((s) => s.items.filter((i) => i.category !== "aligned"))
          .slice(0, 12),
        authorizedAnswers,
        sessions: await store().listSessions(journey.id),
        assignments: await store().listAssignments(journey.id),
        notes: await store().listCounselorNotes(journey.id),
        revisions: await store().listRevisionRequests(journey.id),
      };
    }
  }

  return {
    journey,
    coupleLabel: [partnerA?.name, partnerBName].filter(Boolean).join(" & "),
    moduleProgress,
    stage2LessonProgress,
    comparisonSummaries,
    attentionAreas: comparisonSummaries
      .flatMap((s) => s.items.filter((i) => i.category !== "aligned"))
      .slice(0, 12),
    authorizedAnswers,
    sessions: await store().listSessions(journey.id),
    assignments: await store().listAssignments(journey.id),
    notes: await store().listCounselorNotes(journey.id),
    revisions: await store().listRevisionRequests(journey.id),
  };
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
  await assertCounselorForJourney(counselor, journey);

  const now = new Date().toISOString();
  await store().updateRevisionRequest(requestId, {
    status: decision,
    resolvedAt: now,
    resolvedBy: counselor.id,
  });

  if (decision === "approved") {
    const existing = await store().getResponse(journey.id, request.moduleId, request.userId);
    if (existing) {
      await store().saveResponse({
        ...existing,
        status: "draft",
        revisionGeneration: (existing.revisionGeneration ?? 0) + 1,
        submittedAt: undefined,
        lastSavedAt: now,
      });
    }
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
  if (!(await isMarriageCounselor(viewer))) throw new Error("Counselor access required.");
  const assigned = await store().listJourneysForCounselor(viewer.id);
  const allActive = assigned.length ? assigned : await store().listAllActiveJourneys();

  const rows = [];
  for (const journey of allActive.slice(0, 50)) {
    const detail = await getCounselorJourneyDetail(viewer, journey.id);
    const dueAssignments = detail.assignments.filter(
      (a) => a.dueAt && new Date(a.dueAt).getTime() >= Date.now(),
    );
    rows.push({
      ...detail,
      homeworkDue: dueAssignments,
    });
  }
  return { rows, counselorId: viewer.id };
}
