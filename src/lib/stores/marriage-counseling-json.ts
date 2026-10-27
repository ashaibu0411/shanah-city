import { promises as fs } from "fs";
import path from "path";
import type {
  MarriageAssessmentResponseRecord,
  MarriageAuditLogRecord,
  MarriageComparisonUnlockRecord,
  MarriageCounselingJourneyRecord,
  MarriageCounselingSessionRecord,
  MarriageCounselorAssignmentRecord,
  MarriageCounselorNoteRecord,
  MarriageDiscussionMarkRecord,
  MarriageJournalEntryRecord,
  MarriageJourneyConsentRecord,
  MarriageJourneyInviteRecord,
  MarriageRevisionRequestRecord,
  MarriageActionPlanRecord,
  MarriageSharedGoalRecord,
  MarriageSharingConsentRecord,
  MarriageActivitySyncSessionRecord,
  MarriageAnswerChangeGenerationRecord,
  MarriagePartnerSharingConsentPatch,
  MarriageQuestionDefinition,
  MarriageCounselorAssignmentRequestRecord,
  MarriageCounselorAssignmentAcknowledgmentRecord,
  MarriageCounselorParticipantRevocationRecord,
  MarriageJourneyAdministrativeCoordinatorRecord,
  MarriagePrepDefaultCounselorSettingRecord,
  MarriagePremaritalProgramSessionRecord,
  MarriagePremaritalProgramMetaRecord,
} from "@/lib/marriage-counseling-types";
import { getChangedCounselorConsentQuestionIds } from "@/lib/marriage-assessment-answer-changes";
import {
  COUNSELOR_CONSENT_ANSWER_CHANGED_MESSAGE,
  computeAnswerFingerprint,
  isAnswerDisclosableToCounselor,
} from "@/lib/marriage-counselor-consent";
import type {
  ApplyCounselorConsentGrantInput,
  ApplyCounselorConsentRevokeInput,
} from "@/lib/stores/marriage-counseling-db";
import {
  assertCounselorSharingConsentGrant,
  buildCounselorConsentRevocationRecord,
  mergePartnerSharingConsentPatch,
} from "@/lib/marriage-sharing-consent-persistence";
import { isJourneyCounselorAccessRevoked } from "@/lib/marriage-counseling-access";
import {
  assertNoCounselorFieldsInGenericJourneyPatch,
  counselorJourneyAccessChangeRequiresInvalidation,
  type CounselorJourneyAccessPatch,
} from "@/lib/marriage-counselor-assignment-change";
import { invalidateAllCounselorDisclosureForJourneyInMemory } from "@/lib/marriage-counselor-journey-consent-invalidation";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE =
  process.env.MARRIAGE_COUNSELING_DATA_FILE?.trim() ||
  path.join(DATA_DIR, "marriage-counseling.json");

type StoreFile = {
  journeys: MarriageCounselingJourneyRecord[];
  consents: MarriageJourneyConsentRecord[];
  responses: MarriageAssessmentResponseRecord[];
  unlocks: MarriageComparisonUnlockRecord[];
  journal: MarriageJournalEntryRecord[];
  assignments: MarriageCounselorAssignmentRecord[];
  sessions: MarriageCounselingSessionRecord[];
  counselorNotes: MarriageCounselorNoteRecord[];
  discussionMarks: MarriageDiscussionMarkRecord[];
  invites: MarriageJourneyInviteRecord[];
  revisionRequests: MarriageRevisionRequestRecord[];
  auditLogs: MarriageAuditLogRecord[];
  actionPlans: MarriageActionPlanRecord[];
  sharedGoals: MarriageSharedGoalRecord[];
  sharingConsents: MarriageSharingConsentRecord[];
  activitySyncSessions: MarriageActivitySyncSessionRecord[];
  answerChangeGenerations: MarriageAnswerChangeGenerationRecord[];
  assignmentRequests: MarriageCounselorAssignmentRequestRecord[];
  assignmentAcknowledgments: MarriageCounselorAssignmentAcknowledgmentRecord[];
  participantCounselorRevocations: MarriageCounselorParticipantRevocationRecord[];
  administrativeCoordinators: MarriageJourneyAdministrativeCoordinatorRecord[];
  defaultPremaritalCounselor?: MarriagePrepDefaultCounselorSettingRecord | null;
  premaritalProgramSessions?: MarriagePremaritalProgramSessionRecord[];
  premaritalProgramMeta?: MarriagePremaritalProgramMetaRecord[];
  premaritalSessionClinical?: import("@/lib/marriage-counseling-types").MarriagePremaritalSessionClinicalRecord[];
  premaritalReadinessReviews?: import("@/lib/marriage-counseling-types").MarriagePremaritalReadinessReviewRecord[];
  premaritalReadinessAudit?: import("@/lib/marriage-counseling-types").MarriagePremaritalReadinessReviewAuditRecord[];
  premaritalReminderDeliveries?: Array<{
    id: string;
    kind: string;
    referenceKey: string;
    journeyId: string;
    sentAt: string;
  }>;
};

async function readStore(): Promise<StoreFile> {
  try {
    const raw = await fs.readFile(FILE, "utf-8");
    return ensureStage2Collections(JSON.parse(raw) as StoreFile);
  } catch {
    return {
      journeys: [],
      consents: [],
      responses: [],
      unlocks: [],
      journal: [],
      assignments: [],
      sessions: [],
      counselorNotes: [],
      discussionMarks: [],
      invites: [],
      revisionRequests: [],
      auditLogs: [],
      actionPlans: [],
      sharedGoals: [],
      sharingConsents: [],
      activitySyncSessions: [],
      answerChangeGenerations: [],
      assignmentRequests: [],
      assignmentAcknowledgments: [],
      participantCounselorRevocations: [],
      administrativeCoordinators: [],
    };
  }
}

function ensureStage2Collections(store: StoreFile): StoreFile {
  if (!store.actionPlans) store.actionPlans = [];
  if (!store.sharedGoals) store.sharedGoals = [];
  if (!store.sharingConsents) store.sharingConsents = [];
  if (!store.activitySyncSessions) store.activitySyncSessions = [];
  if (!store.answerChangeGenerations) store.answerChangeGenerations = [];
  if (!store.assignmentRequests) store.assignmentRequests = [];
  if (!store.assignmentAcknowledgments) store.assignmentAcknowledgments = [];
  if (!store.participantCounselorRevocations) store.participantCounselorRevocations = [];
  if (!store.administrativeCoordinators) store.administrativeCoordinators = [];
  if (store.defaultPremaritalCounselor === undefined) store.defaultPremaritalCounselor = null;
  if (!store.premaritalProgramSessions) store.premaritalProgramSessions = [];
  if (!store.premaritalProgramMeta) store.premaritalProgramMeta = [];
  if (!store.premaritalSessionClinical) store.premaritalSessionClinical = [];
  if (!store.premaritalReadinessReviews) store.premaritalReadinessReviews = [];
  if (!store.premaritalReadinessAudit) store.premaritalReadinessAudit = [];
  if (!store.premaritalReminderDeliveries) store.premaritalReminderDeliveries = [];
  return store;
}

function normalizeJourney(j: MarriageCounselingJourneyRecord): MarriageCounselingJourneyRecord {
  return {
    ...j,
    pairingMode: j.pairingMode ?? (j.coupleLinkId ? "spouse_link" : "journey_invite"),
    participantBId: j.participantBId ?? null,
    guidedModuleIds: j.guidedModuleIds ?? [],
  };
}

async function writeStore(data: StoreFile) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(data, null, 2));
}

export async function listJourneysForCoupleLink(coupleLinkId: string) {
  const store = await readStore();
  return store.journeys
    .filter((j) => j.coupleLinkId === coupleLinkId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getJourneyById(id: string) {
  const store = await readStore();
  const j = store.journeys.find((entry) => entry.id === id);
  return j ? normalizeJourney(j) : null;
}

export async function listArchivedJourneysForUser(userId: string) {
  const store = await readStore();
  const archived = store.journeys.filter((j) => j.status === "archived");
  const byId = new Map<string, MarriageCounselingJourneyRecord>();
  for (const raw of archived) {
    const j = normalizeJourney(raw);
    if (j.participantAId === userId || j.participantBId === userId) {
      byId.set(j.id, j);
    }
    if (j.coupleLinkId) {
      const { getCoupleLinkById } = await import("@/lib/couple-link-server");
      const link = await getCoupleLinkById(j.coupleLinkId);
      if (link && (link.userAId === userId || link.userBId === userId)) {
        byId.set(j.id, j);
      }
    }
  }
  return [...byId.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listActiveJourneysForUser(userId: string) {
  const store = await readStore();
  const active = store.journeys.filter((j) => j.status === "active");
  const byId = new Map<string, MarriageCounselingJourneyRecord>();
  for (const raw of active) {
    const j = normalizeJourney(raw);
    if (j.participantAId === userId || j.participantBId === userId) {
      byId.set(j.id, j);
    }
    if (j.coupleLinkId) {
      const { getCoupleLinkById } = await import("@/lib/couple-link-server");
      const link = await getCoupleLinkById(j.coupleLinkId);
      if (link && (link.userAId === userId || link.userBId === userId)) {
        byId.set(j.id, j);
      }
    }
  }
  return [...byId.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function countSubmittedResponsesForJourney(journeyId: string) {
  const store = await readStore();
  return store.responses.filter((r) => r.journeyId === journeyId && r.status === "submitted")
    .length;
}

/** Submitted or in-progress assessment work (includes Stage 2 activities). */
export async function countMeaningfulAssessmentActivityForJourney(journeyId: string) {
  const store = await readStore();
  return store.responses.filter(
    (r) =>
      r.journeyId === journeyId && (r.status === "submitted" || r.status === "draft"),
  ).length;
}

export async function getActiveJourneyForUser(userId: string) {
  const { resolveHubActiveJourneyForUser } = await import("@/lib/marriage-active-journey-lifecycle");
  const actives = await listActiveJourneysForUser(userId);
  return resolveHubActiveJourneyForUser(userId, actives);
}

export async function getActiveJourneyForCoupleLink(coupleLinkId: string) {
  const journeys = await listJourneysForCoupleLink(coupleLinkId);
  return journeys.find((j) => j.status === "active") ?? null;
}

export async function createJourney(
  input: Omit<MarriageCounselingJourneyRecord, "id" | "createdAt" | "updatedAt"> & {
    id?: string;
  },
) {
  const store = await readStore();
  const now = new Date().toISOString();
  const record: MarriageCounselingJourneyRecord = normalizeJourney({
    id: input.id ?? `mj-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    coupleLinkId: input.coupleLinkId,
    programType: input.programType,
    status: input.status,
    currentModuleId: input.currentModuleId,
    counselorUserId: input.counselorUserId,
    createdBy: input.createdBy,
    createdAt: now,
    updatedAt: now,
    pairingMode: input.pairingMode,
    participantAId: input.participantAId,
    participantBId: input.participantBId,
    guidedModuleIds: input.guidedModuleIds,
    curriculumVersion: input.curriculumVersion,
  });
  store.journeys.push(record);
  await writeStore(store);
  return record;
}

export async function updateJourney(
  id: string,
  patch: Partial<
    Pick<
      MarriageCounselingJourneyRecord,
      | "status"
      | "currentModuleId"
      | "counselorUserId"
      | "completedAt"
      | "participantBId"
      | "guidedModuleIds"
      | "curriculumVersion"
      | "counselorAccessRevokedAt"
      | "deletionRequestedAt"
      | "counselingDeliveryMode"
    >
  >,
) {
  assertNoCounselorFieldsInGenericJourneyPatch(patch);
  const store = await readStore();
  const index = store.journeys.findIndex((j) => j.id === id);
  if (index === -1) throw new Error("Journey not found.");
  store.journeys[index] = {
    ...store.journeys[index],
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  await writeStore(store);
  return store.journeys[index];
}

/** Single read/modify/write — mirrors DB journey lock + bulk counselor invalidation. */
export async function applyCounselorJourneyAccessChange(
  journeyId: string,
  patch: CounselorJourneyAccessPatch,
) {
  const now = new Date().toISOString();
  const store = await readStore();
  const index = store.journeys.findIndex((j) => j.id === journeyId);
  if (index === -1) throw new Error("Journey not found.");
  const journey = store.journeys[index]!;

  if (counselorJourneyAccessChangeRequiresInvalidation(journey, patch)) {
    store.sharingConsents = invalidateAllCounselorDisclosureForJourneyInMemory(
      store.sharingConsents,
      journeyId,
      now,
    );
  }

  store.journeys[index] = {
    ...journey,
    counselorUserId:
      patch.counselorUserId !== undefined ? patch.counselorUserId : journey.counselorUserId,
    counselorAccessRevokedAt:
      patch.counselorAccessRevokedAt !== undefined
        ? patch.counselorAccessRevokedAt
        : journey.counselorAccessRevokedAt,
    updatedAt: now,
  };
  await writeStore(store);
  return store.journeys[index]!;
}

export async function upsertConsent(record: MarriageJourneyConsentRecord) {
  const store = await readStore();
  const index = store.consents.findIndex(
    (c) => c.journeyId === record.journeyId && c.userId === record.userId,
  );
  if (index === -1) store.consents.push(record);
  else store.consents[index] = record;
  await writeStore(store);
  return record;
}

export async function getConsentsForJourney(journeyId: string) {
  const store = await readStore();
  return store.consents.filter((c) => c.journeyId === journeyId);
}

export async function getResponse(journeyId: string, moduleId: string, userId: string) {
  const store = await readStore();
  return (
    store.responses.find(
      (r) => r.journeyId === journeyId && r.moduleId === moduleId && r.userId === userId,
    ) ?? null
  );
}

export async function listResponsesForJourneyModule(journeyId: string, moduleId: string) {
  const store = await readStore();
  return store.responses.filter((r) => r.journeyId === journeyId && r.moduleId === moduleId);
}

function responseIndex(store: StoreFile, record: MarriageAssessmentResponseRecord) {
  return store.responses.findIndex(
    (r) =>
      r.journeyId === record.journeyId &&
      r.moduleId === record.moduleId &&
      r.userId === record.userId,
  );
}

export async function saveResponse(record: MarriageAssessmentResponseRecord) {
  const store = await readStore();
  const index = responseIndex(store, record);
  if (index === -1) store.responses.push(record);
  else store.responses[index] = record;
  await writeStore(store);
  return record;
}

/** Same lock order as DB advisory draft lock — one read/modify/write per operation (single writer). */
function invalidateCounselorQuestionsInJsonStore(
  store: StoreFile,
  params: {
    journeyId: string;
    moduleId: string;
    userId: string;
    questionIds: string[];
    revokedAt: string;
  },
): void {
  const { journeyId, moduleId, userId, questionIds, revokedAt } = params;
  for (const questionId of questionIds) {
    const genIndex = store.answerChangeGenerations.findIndex(
      (g) =>
        g.journeyId === journeyId &&
        g.moduleId === moduleId &&
        g.questionId === questionId &&
        g.userId === userId,
    );
    if (genIndex === -1) {
      store.answerChangeGenerations.push({
        journeyId,
        moduleId,
        questionId,
        userId,
        generation: 1,
      });
    } else {
      store.answerChangeGenerations[genIndex] = {
        ...store.answerChangeGenerations[genIndex]!,
        generation: store.answerChangeGenerations[genIndex]!.generation + 1,
      };
    }

    const consentIndex = store.sharingConsents.findIndex(
      (c) =>
        c.journeyId === journeyId &&
        c.moduleId === moduleId &&
        c.questionId === questionId &&
        c.userId === userId,
    );
    const existing = consentIndex === -1 ? null : store.sharingConsents[consentIndex]!;
    const revocation = buildCounselorConsentRevocationRecord(
      existing,
      { journeyId, moduleId, questionId, userId },
      revokedAt,
    );
    if (revocation) {
      if (consentIndex === -1) store.sharingConsents.push(revocation);
      else store.sharingConsents[consentIndex] = revocation;
    }
  }
}

export type ApplyAssessmentDraftPatchInput = {
  journeyId: string;
  moduleId: string;
  userId: string;
  contentVersion: string;
  patch: Record<string, unknown>;
  questions: MarriageQuestionDefinition[];
  lastSavedAt: string;
};

export async function applyAssessmentDraftPatch(input: ApplyAssessmentDraftPatchInput) {
  const { journeyId, moduleId, userId, contentVersion, patch, questions, lastSavedAt } = input;
  const store = await readStore();

  const rowIndex = store.responses.findIndex(
    (r) => r.journeyId === journeyId && r.moduleId === moduleId && r.userId === userId,
  );
  const row = rowIndex === -1 ? null : store.responses[rowIndex]!;

  if (row?.status === "submitted") {
    throw new Error("This assessment is submitted. Contact your counselor to revise.");
  }

  const previousAnswers = row?.answers ?? {};
  const mergedAnswers = { ...previousAnswers, ...patch };
  const changedCounselorQuestionIds = getChangedCounselorConsentQuestionIds(
    questions,
    previousAnswers,
    mergedAnswers,
  );

  const record: MarriageAssessmentResponseRecord = {
    id: row?.id ?? `mar-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    journeyId,
    moduleId,
    contentVersion,
    userId,
    status: "draft",
    answers: mergedAnswers,
    lastSavedAt,
    submittedAt: undefined,
    revisionGeneration: row?.revisionGeneration ?? 0,
  };

  if (rowIndex === -1) store.responses.push(record);
  else store.responses[rowIndex] = record;

  if (changedCounselorQuestionIds.length > 0) {
    invalidateCounselorQuestionsInJsonStore(store, {
      journeyId,
      moduleId,
      userId,
      questionIds: changedCounselorQuestionIds,
      revokedAt: lastSavedAt,
    });
  }

  await writeStore(store);
  return { lastSavedAt };
}

export async function saveAssessmentResponseWithCounselorConsentInvalidation(
  record: MarriageAssessmentResponseRecord,
  invalidateCounselorQuestionIds: string[],
) {
  const store = await readStore();
  const index = responseIndex(store, record);
  if (index === -1) store.responses.push(record);
  else store.responses[index] = record;

  if (invalidateCounselorQuestionIds.length > 0) {
    invalidateCounselorQuestionsInJsonStore(store, {
      journeyId: record.journeyId,
      moduleId: record.moduleId,
      userId: record.userId,
      questionIds: invalidateCounselorQuestionIds,
      revokedAt: record.lastSavedAt,
    });
  }

  await writeStore(store);
  return record;
}

export async function approveAssessmentRevisionRequest(
  revisionRequestId: string,
  resolvedByUserId: string,
  counselorConsentQuestionIds: string[],
): Promise<{ ok: true; idempotent: boolean }> {
  const now = new Date().toISOString();
  const store = await readStore();

  const reqIndex = store.revisionRequests.findIndex((r) => r.id === revisionRequestId);
  if (reqIndex === -1) throw new Error("Request not found.");
  const request = store.revisionRequests[reqIndex]!;
  if (request.status !== "pending") {
    return { ok: true, idempotent: true };
  }

  const rowIndex = store.responses.findIndex(
    (r) =>
      r.journeyId === request.journeyId &&
      r.moduleId === request.moduleId &&
      r.userId === request.userId,
  );
  if (rowIndex === -1) throw new Error("Assessment response not found.");
  const row = store.responses[rowIndex]!;

  store.revisionRequests[reqIndex] = {
    ...request,
    status: "approved",
    resolvedAt: now,
    resolvedBy: resolvedByUserId,
  };

  store.responses[rowIndex] = {
    ...row,
    status: "draft",
    submittedAt: undefined,
    lastSavedAt: now,
    revisionGeneration: (row.revisionGeneration ?? 0) + 1,
  };

  if (counselorConsentQuestionIds.length > 0) {
    invalidateCounselorQuestionsInJsonStore(store, {
      journeyId: request.journeyId,
      moduleId: request.moduleId,
      userId: request.userId,
      questionIds: counselorConsentQuestionIds,
      revokedAt: now,
    });
  }

  await writeStore(store);
  return { ok: true, idempotent: false };
}

export async function getUnlock(journeyId: string, moduleId: string, contentVersion: string) {
  const store = await readStore();
  return (
    store.unlocks.find(
      (u) =>
        u.journeyId === journeyId &&
        u.moduleId === moduleId &&
        u.contentVersion === contentVersion,
    ) ?? null
  );
}

export async function createUnlock(record: MarriageComparisonUnlockRecord) {
  const store = await readStore();
  if (
    store.unlocks.some(
      (u) =>
        u.journeyId === record.journeyId &&
        u.moduleId === record.moduleId &&
        u.contentVersion === record.contentVersion,
    )
  ) {
    return record;
  }
  store.unlocks.push(record);
  await writeStore(store);
  return record;
}

export async function listJournal(journeyId: string, viewerId: string) {
  const store = await readStore();
  return store.journal
    .filter((e) => e.journeyId === journeyId && (e.visibility === "shared" || e.authorId === viewerId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function addJournalEntry(entry: MarriageJournalEntryRecord) {
  const store = await readStore();
  store.journal.push(entry);
  await writeStore(store);
  return entry;
}

export async function listSessions(journeyId: string) {
  const store = await readStore();
  return store.sessions
    .filter((s) => s.journeyId === journeyId && s.status !== "cancelled")
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
}

export async function listAllSessionsForJourney(journeyId: string) {
  const store = await readStore();
  return store.sessions
    .filter((s) => s.journeyId === journeyId)
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
}

export async function saveSession(session: MarriageCounselingSessionRecord) {
  const store = await readStore();
  const index = store.sessions.findIndex((s) => s.id === session.id);
  if (index === -1) store.sessions.push(session);
  else store.sessions[index] = session;
  await writeStore(store);
  return session;
}

export async function getSessionById(id: string) {
  const store = await readStore();
  return store.sessions.find((s) => s.id === id) ?? null;
}

export async function listAssignments(journeyId: string) {
  const store = await readStore();
  return store.assignments
    .filter((a) => a.journeyId === journeyId)
    .sort((a, b) => (a.dueAt ?? a.createdAt).localeCompare(b.dueAt ?? b.createdAt));
}

export async function getAssignmentById(id: string) {
  const store = await readStore();
  return store.assignments.find((a) => a.id === id) ?? null;
}

export async function saveAssignment(assignment: MarriageCounselorAssignmentRecord) {
  const store = await readStore();
  const index = store.assignments.findIndex((a) => a.id === assignment.id);
  if (index === -1) store.assignments.push(assignment);
  else store.assignments[index] = assignment;
  await writeStore(store);
  return assignment;
}

export async function listCounselorNotes(journeyId: string) {
  const store = await readStore();
  return store.counselorNotes
    .filter((n) => n.journeyId === journeyId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function saveCounselorNote(note: MarriageCounselorNoteRecord) {
  const store = await readStore();
  const index = store.counselorNotes.findIndex((n) => n.id === note.id);
  if (index === -1) store.counselorNotes.push(note);
  else store.counselorNotes[index] = note;
  await writeStore(store);
  return note;
}

export async function createInvite(record: MarriageJourneyInviteRecord) {
  const store = await readStore();
  const duplicate = store.invites.find(
    (i) =>
      i.journeyId === record.journeyId &&
      !i.revokedAt &&
      !i.acceptedAt &&
      i.expiresAt > new Date().toISOString(),
  );
  if (duplicate) throw new Error("An active invitation already exists for this journey.");
  store.invites.push(record);
  await writeStore(store);
  return record;
}

export async function getInviteByCode(code: string) {
  const store = await readStore();
  const normalized = code.trim().toUpperCase();
  return store.invites.find((i) => i.code === normalized) ?? null;
}

export async function updateInvite(id: string, patch: Partial<MarriageJourneyInviteRecord>) {
  const store = await readStore();
  const index = store.invites.findIndex((i) => i.id === id);
  if (index === -1) throw new Error("Invite not found.");
  store.invites[index] = { ...store.invites[index], ...patch };
  await writeStore(store);
  return store.invites[index];
}

export async function listInvitesForJourney(journeyId: string) {
  const store = await readStore();
  return store.invites.filter((i) => i.journeyId === journeyId);
}

export async function createRevisionRequest(record: MarriageRevisionRequestRecord) {
  const store = await readStore();
  store.revisionRequests.push(record);
  await writeStore(store);
  return record;
}

export async function updateRevisionRequest(id: string, patch: Partial<MarriageRevisionRequestRecord>) {
  const store = await readStore();
  const index = store.revisionRequests.findIndex((r) => r.id === id);
  if (index === -1) throw new Error("Revision request not found.");
  store.revisionRequests[index] = { ...store.revisionRequests[index], ...patch };
  await writeStore(store);
  return store.revisionRequests[index];
}

export async function listRevisionRequests(journeyId: string) {
  const store = await readStore();
  return store.revisionRequests.filter((r) => r.journeyId === journeyId);
}

export async function getRevisionRequestById(id: string) {
  const store = await readStore();
  return store.revisionRequests.find((r) => r.id === id) ?? null;
}

export async function appendAuditLog(record: MarriageAuditLogRecord) {
  const store = await readStore();
  store.auditLogs.push(record);
  if (store.auditLogs.length > 5000) {
    store.auditLogs = store.auditLogs.slice(-5000);
  }
  await writeStore(store);
  return record;
}

export async function listAuditLogs(journeyId?: string) {
  const store = await readStore();
  return store.auditLogs
    .filter((l) => (journeyId ? l.journeyId === journeyId : true))
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 200);
}

export async function archiveJourneyData(journeyId: string) {
  const store = await readStore();
  const index = store.journeys.findIndex((j) => j.id === journeyId);
  if (index === -1) throw new Error("Journey not found.");
  store.journeys[index].status = "archived";
  store.journeys[index].updatedAt = new Date().toISOString();
  await writeStore(store);
  return store.journeys[index];
}

export async function listJourneysForCounselor(counselorUserId: string) {
  const store = await readStore();
  return store.journeys.filter(
    (j) => j.counselorUserId === counselorUserId && j.status !== "archived",
  );
}

export async function listAllActiveJourneys() {
  const store = await readStore();
  return store.journeys.filter((j) => j.status === "active");
}

export async function listJourneysWithPendingDeletionRequest() {
  const store = await readStore();
  return store.journeys
    .filter((j) => j.status === "active" && j.deletionRequestedAt)
    .sort((a, b) =>
      (a.deletionRequestedAt ?? "").localeCompare(b.deletionRequestedAt ?? ""),
    );
}

export async function upsertDiscussionMark(mark: MarriageDiscussionMarkRecord) {
  const store = await readStore();
  const index = store.discussionMarks.findIndex(
    (m) =>
      m.journeyId === mark.journeyId &&
      m.moduleId === mark.moduleId &&
      m.questionId === mark.questionId &&
      m.markedByUserId === mark.markedByUserId,
  );
  if (index === -1) store.discussionMarks.push(mark);
  else {
    const prev = store.discussionMarks[index];
    const merged: MarriageDiscussionMarkRecord = { ...prev, ...mark };
    if (mark.sharedNote === undefined) {
      merged.sharedNote = prev.sharedNote;
    }
    store.discussionMarks[index] = merged;
  }
  await writeStore(store);
  return mark;
}

export async function getDiscussionMarks(journeyId: string, moduleId: string) {
  const store = await readStore();
  return store.discussionMarks.filter((m) => m.journeyId === journeyId && m.moduleId === moduleId);
}

export async function reopenDiscussionForQuestion(
  journeyId: string,
  moduleId: string,
  questionId: string,
) {
  const store = await readStore();
  let cleared = 0;
  for (const m of store.discussionMarks) {
    if (m.journeyId !== journeyId || m.moduleId !== moduleId || m.questionId !== questionId) {
      continue;
    }
    m.discussedAt = null;
    cleared += 1;
  }
  await writeStore(store);
  return cleared;
}

export async function listActionPlans(journeyId: string) {
  const store = await readStore();
  return store.actionPlans
    .filter((p) => p.journeyId === journeyId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getActionPlanById(id: string) {
  const store = await readStore();
  return store.actionPlans.find((p) => p.id === id) ?? null;
}

export async function saveActionPlan(plan: MarriageActionPlanRecord) {
  const store = await readStore();
  const index = store.actionPlans.findIndex((p) => p.id === plan.id);
  if (index === -1) store.actionPlans.push(plan);
  else store.actionPlans[index] = plan;
  await writeStore(store);
  return plan;
}

export async function listSharedGoals(journeyId: string) {
  const store = await readStore();
  return store.sharedGoals
    .filter((g) => g.journeyId === journeyId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getSharedGoalById(id: string) {
  const store = await readStore();
  return store.sharedGoals.find((g) => g.id === id) ?? null;
}

export async function saveSharedGoal(goal: MarriageSharedGoalRecord) {
  const store = await readStore();
  const index = store.sharedGoals.findIndex((g) => g.id === goal.id);
  if (index === -1) store.sharedGoals.push(goal);
  else store.sharedGoals[index] = goal;
  await writeStore(store);
  return goal;
}

export async function listSharingConsents(journeyId: string, moduleId: string) {
  const store = await readStore();
  return store.sharingConsents.filter((c) => c.journeyId === journeyId && c.moduleId === moduleId);
}

export async function getSharingConsentByKey(
  journeyId: string,
  moduleId: string,
  questionId: string,
  userId: string,
): Promise<MarriageSharingConsentRecord | null> {
  const store = await readStore();
  return (
    store.sharingConsents.find(
      (c) =>
        c.journeyId === journeyId &&
        c.moduleId === moduleId &&
        c.questionId === questionId &&
        c.userId === userId,
    ) ?? null
  );
}

export async function savePartnerSharingConsent(patch: MarriagePartnerSharingConsentPatch) {
  const store = await readStore();
  const index = store.sharingConsents.findIndex(
    (c) =>
      c.journeyId === patch.journeyId &&
      c.moduleId === patch.moduleId &&
      c.questionId === patch.questionId &&
      c.userId === patch.userId,
  );
  const existing = index === -1 ? null : store.sharingConsents[index]!;
  const merged = mergePartnerSharingConsentPatch(existing, patch);
  if (index === -1) store.sharingConsents.push(merged);
  else store.sharingConsents[index] = merged;
  await writeStore(store);
  return merged;
}

export async function saveCounselorSharingConsent(record: MarriageSharingConsentRecord) {
  if (record.counselorDisclosureGranted) {
    assertCounselorSharingConsentGrant(record);
  }
  const store = await readStore();
  const index = store.sharingConsents.findIndex(
    (c) =>
      c.journeyId === record.journeyId &&
      c.moduleId === record.moduleId &&
      c.questionId === record.questionId &&
      c.userId === record.userId,
  );
  const normalized: MarriageSharingConsentRecord =
    record.counselorDisclosureGranted === true
      ? record
      : {
          ...record,
          counselorDisclosureGranted: false,
          consentedCounselorUserId: null,
          generationAtGrant: null,
          answerFingerprint: null,
          grantedAt: null,
        };
  if (index === -1) store.sharingConsents.push(normalized);
  else store.sharingConsents[index] = normalized;
  await writeStore(store);
  return normalized;
}

/** @deprecated Use savePartnerSharingConsent for Stage 2 partner sharing. */
export async function saveSharingConsent(record: MarriageSharingConsentRecord) {
  return savePartnerSharingConsent({
    journeyId: record.journeyId,
    moduleId: record.moduleId,
    questionId: record.questionId,
    userId: record.userId,
    granted: record.granted,
    updatedAt: record.updatedAt,
  });
}

export async function getAnswerChangeGeneration(
  journeyId: string,
  moduleId: string,
  questionId: string,
  userId: string,
): Promise<number> {
  const store = await readStore();
  const row = store.answerChangeGenerations.find(
    (g) =>
      g.journeyId === journeyId &&
      g.moduleId === moduleId &&
      g.questionId === questionId &&
      g.userId === userId,
  );
  return row?.generation ?? 0;
}

export async function incrementAnswerChangeGeneration(
  journeyId: string,
  moduleId: string,
  questionId: string,
  userId: string,
): Promise<number> {
  const store = await readStore();
  const index = store.answerChangeGenerations.findIndex(
    (g) =>
      g.journeyId === journeyId &&
      g.moduleId === moduleId &&
      g.questionId === questionId &&
      g.userId === userId,
  );
  if (index === -1) {
    store.answerChangeGenerations.push({
      journeyId,
      moduleId,
      questionId,
      userId,
      generation: 1,
    });
    await writeStore(store);
    return 1;
  }
  const next = store.answerChangeGenerations[index]!.generation + 1;
  store.answerChangeGenerations[index] = {
    ...store.answerChangeGenerations[index]!,
    generation: next,
  };
  await writeStore(store);
  return next;
}

function upsertSharingConsentInStore(store: StoreFile, record: MarriageSharingConsentRecord) {
  if (record.counselorDisclosureGranted) assertCounselorSharingConsentGrant(record);
  const index = store.sharingConsents.findIndex(
    (c) =>
      c.journeyId === record.journeyId &&
      c.moduleId === record.moduleId &&
      c.questionId === record.questionId &&
      c.userId === record.userId,
  );
  const normalized: MarriageSharingConsentRecord =
    record.counselorDisclosureGranted === true
      ? record
      : {
          ...record,
          counselorDisclosureGranted: false,
          consentedCounselorUserId: null,
          generationAtGrant: null,
          answerFingerprint: null,
          grantedAt: null,
        };
  if (index === -1) store.sharingConsents.push(normalized);
  else store.sharingConsents[index] = normalized;
}

/** Single read/modify/write — same serialization as DB advisory draft lock. */
export async function applyCounselorConsentGrant(
  input: ApplyCounselorConsentGrantInput,
): Promise<{ idempotent: boolean }> {
  const now = new Date().toISOString();
  const store = await readStore();

  const journey = store.journeys.find((j) => j.id === input.journeyId);
  if (!journey?.counselorUserId?.trim()) {
    throw new Error("No counselor is assigned to your journey yet.");
  }
  if (isJourneyCounselorAccessRevoked(journey)) {
    throw new Error("Counselor access has been revoked for this journey.");
  }
  if (journey.counselorUserId !== input.expectedCounselorUserId) {
    throw new Error("Counselor assignment does not match.");
  }

  const response = store.responses.find(
    (r) =>
      r.journeyId === input.journeyId &&
      r.moduleId === input.moduleId &&
      r.userId === input.userId,
  );
  if (!response || response.status !== "submitted") {
    throw new Error("Submit this assessment before sharing answers with your counselor.");
  }

  const answer = response.answers[input.questionId];
  if (!isAnswerDisclosableToCounselor(answer)) {
    throw new Error("This answer cannot be shared until you provide a response.");
  }

  const genRow = store.answerChangeGenerations.find(
    (g) =>
      g.journeyId === input.journeyId &&
      g.moduleId === input.moduleId &&
      g.questionId === input.questionId &&
      g.userId === input.userId,
  );
  const generation = genRow?.generation ?? 0;
  if (generation !== input.answerGeneration) {
    throw new Error(COUNSELOR_CONSENT_ANSWER_CHANGED_MESSAGE);
  }

  const fingerprint = computeAnswerFingerprint(answer);
  if (fingerprint !== input.answerFingerprint) {
    throw new Error(COUNSELOR_CONSENT_ANSWER_CHANGED_MESSAGE);
  }

  const consentIndex = store.sharingConsents.findIndex(
    (c) =>
      c.journeyId === input.journeyId &&
      c.moduleId === input.moduleId &&
      c.questionId === input.questionId &&
      c.userId === input.userId,
  );
  const existing = consentIndex === -1 ? null : store.sharingConsents[consentIndex]!;
  if (
    existing?.counselorDisclosureGranted &&
    existing.consentedCounselorUserId === journey.counselorUserId &&
    existing.generationAtGrant === generation &&
    existing.answerFingerprint === fingerprint
  ) {
    return { idempotent: true };
  }

  upsertSharingConsentInStore(store, {
    journeyId: input.journeyId,
    moduleId: input.moduleId,
    questionId: input.questionId,
    userId: input.userId,
    granted: existing?.granted ?? false,
    counselorDisclosureGranted: true,
    updatedAt: now,
    consentedCounselorUserId: journey.counselorUserId,
    generationAtGrant: generation,
    answerFingerprint: fingerprint,
    grantedAt: now,
  });
  await writeStore(store);
  return { idempotent: false };
}

export async function applyCounselorConsentRevoke(
  input: ApplyCounselorConsentRevokeInput,
): Promise<{ idempotent: boolean }> {
  const now = new Date().toISOString();
  const store = await readStore();

  const consentIndex = store.sharingConsents.findIndex(
    (c) =>
      c.journeyId === input.journeyId &&
      c.moduleId === input.moduleId &&
      c.questionId === input.questionId &&
      c.userId === input.userId,
  );
  const existing = consentIndex === -1 ? null : store.sharingConsents[consentIndex]!;
  const revocation = buildCounselorConsentRevocationRecord(existing, input, now);
  if (!revocation) {
    return { idempotent: true };
  }
  upsertSharingConsentInStore(store, revocation);
  await writeStore(store);
  return { idempotent: false };
}

export async function getActivitySyncSession(journeyId: string, moduleId: string) {
  const store = await readStore();
  return (
    store.activitySyncSessions.find(
      (s) => s.journeyId === journeyId && s.moduleId === moduleId && s.status === "open",
    ) ?? null
  );
}

export async function saveActivitySyncSession(session: MarriageActivitySyncSessionRecord) {
  const store = await readStore();
  const index = store.activitySyncSessions.findIndex((s) => s.id === session.id);
  if (index === -1) store.activitySyncSessions.push(session);
  else store.activitySyncSessions[index] = session;
  await writeStore(store);
  return session;
}

export async function saveCounselorAssignmentRequest(record: MarriageCounselorAssignmentRequestRecord) {
  const store = await readStore();
  const index = store.assignmentRequests.findIndex((r) => r.id === record.id);
  if (index === -1) store.assignmentRequests.push(record);
  else store.assignmentRequests[index] = record;
  await writeStore(store);
  return record;
}

export async function getCounselorAssignmentRequestById(id: string) {
  const store = await readStore();
  return store.assignmentRequests.find((r) => r.id === id) ?? null;
}

export async function getPendingCounselorAssignmentRequestForJourney(journeyId: string) {
  const store = await readStore();
  return (
    store.assignmentRequests.find(
      (r) => r.journeyId === journeyId && r.status === "pending",
    ) ?? null
  );
}

export async function getApprovedCounselorAssignmentRequestAwaitingExecution(journeyId: string) {
  const store = await readStore();
  return (
    store.assignmentRequests.find(
      (r) => r.journeyId === journeyId && r.status === "approved",
    ) ?? null
  );
}

export async function supersedePendingCounselorAssignmentRequests(
  journeyId: string,
  exceptRequestId?: string,
) {
  const store = await readStore();
  const now = new Date().toISOString();
  for (const r of store.assignmentRequests) {
    if (r.journeyId !== journeyId || r.status !== "pending") continue;
    if (exceptRequestId && r.id === exceptRequestId) continue;
    r.status = "superseded";
    r.reviewedAt = now;
  }
  await writeStore(store);
}

export async function listAllPendingCounselorAssignmentRequests() {
  const store = await readStore();
  return store.assignmentRequests
    .filter((r) => r.status === "pending")
    .sort((a, b) => {
      const byTime = b.requestedAt.localeCompare(a.requestedAt);
      if (byTime !== 0) return byTime;
      return b.id.localeCompare(a.id);
    });
}

export async function listCounselorAssignmentRequestHistory() {
  const store = await readStore();
  return store.assignmentRequests
    .filter((r) =>
      ["approved", "rejected", "executed", "cancelled", "superseded"].includes(r.status),
    )
    .sort((a, b) => {
      const aKey = a.reviewedAt ?? a.requestedAt;
      const bKey = b.reviewedAt ?? b.requestedAt;
      const byTime = bKey.localeCompare(aKey);
      if (byTime !== 0) return byTime;
      return b.id.localeCompare(a.id);
    });
}

export async function saveCounselorAssignmentAcknowledgment(
  record: MarriageCounselorAssignmentAcknowledgmentRecord,
) {
  const store = await readStore();
  const index = store.assignmentAcknowledgments.findIndex(
    (a) => a.requestId === record.requestId && a.userId === record.userId,
  );
  if (index === -1) store.assignmentAcknowledgments.push(record);
  else store.assignmentAcknowledgments[index] = record;
  await writeStore(store);
  return record;
}

export async function listCounselorAssignmentAcknowledgmentsForRequest(requestId: string) {
  const store = await readStore();
  return store.assignmentAcknowledgments.filter((a) => a.requestId === requestId);
}

export async function upsertParticipantCounselorRevocation(
  record: MarriageCounselorParticipantRevocationRecord,
) {
  const store = await readStore();
  const index = store.participantCounselorRevocations.findIndex(
    (r) => r.journeyId === record.journeyId && r.userId === record.userId,
  );
  if (index === -1) store.participantCounselorRevocations.push(record);
  else store.participantCounselorRevocations[index] = record;
  await writeStore(store);
  return record;
}

export async function listParticipantCounselorRevocations(journeyId: string) {
  const store = await readStore();
  return store.participantCounselorRevocations.filter((r) => r.journeyId === journeyId);
}

export async function clearParticipantCounselorRevocations(journeyId: string) {
  const store = await readStore();
  store.participantCounselorRevocations = store.participantCounselorRevocations.filter(
    (r) => r.journeyId !== journeyId,
  );
  await writeStore(store);
}

/** Single read/write execution path mirroring PostgreSQL validation semantics. */
export async function tryExecuteCounselorAssignmentRequestAtomic(
  requestId: string,
): Promise<{ executed: boolean; journeyId: string }> {
  const now = new Date().toISOString();
  const store = await readStore();
  const reqIndex = store.assignmentRequests.findIndex((r) => r.id === requestId);
  if (reqIndex === -1) throw new Error("Request not found.");
  const request = store.assignmentRequests[reqIndex]!;
  const journeyIndex = store.journeys.findIndex((j) => j.id === request.journeyId);
  if (journeyIndex === -1) throw new Error("Journey not found.");
  const journey = store.journeys[journeyIndex]!;

  const {
    assertApprovedRequestReadyToExecute,
    buildExecutionPatchForRequest,
    canExecuteApprovedRequestNow,
  } = await import("@/lib/marriage-counselor-assignment-execution");

  const revocations = store.participantCounselorRevocations.filter(
    (r) => r.journeyId === request.journeyId,
  );
  const acknowledgments = store.assignmentAcknowledgments.filter(
    (a) => a.requestId === requestId,
  );

  if (
    !canExecuteApprovedRequestNow({
      request,
      currentCounselorUserId: journey.counselorUserId,
      revocations,
      acknowledgments,
    })
  ) {
    return { executed: false, journeyId: request.journeyId };
  }

  assertApprovedRequestReadyToExecute({
    request,
    currentCounselorUserId: journey.counselorUserId,
    revocations,
    acknowledgments,
  });

  const patch = buildExecutionPatchForRequest(request);
  if (counselorJourneyAccessChangeRequiresInvalidation(journey, patch)) {
    store.sharingConsents = invalidateAllCounselorDisclosureForJourneyInMemory(
      store.sharingConsents,
      request.journeyId,
      now,
    );
  }
  store.journeys[journeyIndex] = {
    ...journey,
    counselorUserId:
      patch.counselorUserId !== undefined ? patch.counselorUserId : journey.counselorUserId,
    counselorAccessRevokedAt:
      patch.counselorAccessRevokedAt !== undefined
        ? patch.counselorAccessRevokedAt
        : journey.counselorAccessRevokedAt,
    updatedAt: now,
  };
  store.participantCounselorRevocations = store.participantCounselorRevocations.filter(
    (r) => r.journeyId !== request.journeyId,
  );
  store.assignmentRequests[reqIndex] = {
    ...request,
    status: "executed",
    executedAt: now,
  };
  await writeStore(store);
  return { executed: true, journeyId: request.journeyId };
}

export async function approveCounselorAssignmentRequestAtomic(input: {
  requestId: string;
  seniorPastorUserId: string;
  decisionNote?: string | null;
  requireExplicitSelfApproval: boolean;
}): Promise<{ executed: boolean; journeyId: string }> {
  const now = new Date().toISOString();
  const store = await readStore();
  const reqIndex = store.assignmentRequests.findIndex((r) => r.id === input.requestId);
  if (reqIndex === -1) throw new Error("Request not found.");
  const request = store.assignmentRequests[reqIndex]!;
  const journeyIndex = store.journeys.findIndex((j) => j.id === request.journeyId);
  if (journeyIndex === -1) throw new Error("Journey not found.");
  const journey = store.journeys[journeyIndex]!;

  const { validateJourneySnapshotMatchesRequest, canExecuteApprovedRequestNow } =
    await import("@/lib/marriage-counselor-assignment-execution");

  if (request.status !== "pending") throw new Error("Request is not pending.");
  if (
    request.requestedByUserId === input.seniorPastorUserId &&
    input.requireExplicitSelfApproval
  ) {
    throw new Error("Explicit approval confirmation required.");
  }
  validateJourneySnapshotMatchesRequest(request, journey.counselorUserId);

  store.assignmentRequests[reqIndex] = {
    ...request,
    status: "approved",
    reviewedByUserId: input.seniorPastorUserId,
    reviewedAt: now,
    decisionNote: input.decisionNote ?? null,
  };
  await writeStore(store);

  const result = await tryExecuteCounselorAssignmentRequestAtomic(input.requestId);
  return result;
}

export async function acknowledgeCounselorAssignmentRestorationAtomic(input: {
  requestId: string;
  participantUserId: string;
  counselorUserId: string;
}): Promise<{ executed: boolean; journeyId: string }> {
  const now = new Date().toISOString();
  const store = await readStore();
  const reqIndex = store.assignmentRequests.findIndex((r) => r.id === input.requestId);
  if (reqIndex === -1) throw new Error("Request not found.");
  const request = store.assignmentRequests[reqIndex]!;

  if (request.status !== "approved") {
    throw new Error("This assignment is not awaiting participant authorization.");
  }
  if (request.executedAt) throw new Error("This assignment is already active.");
  if (request.requestType === "remove") {
    throw new Error("Removal requests do not require acknowledgment.");
  }
  const approvedCounselor = request.requestedCounselorUserId?.trim();
  if (!approvedCounselor || approvedCounselor !== input.counselorUserId.trim()) {
    throw new Error("Acknowledgment does not match the approved counselor.");
  }

  const revocations = store.participantCounselorRevocations.filter(
    (r) => r.journeyId === request.journeyId,
  );
  if (!revocations.some((r) => r.userId === input.participantUserId)) {
    throw new Error("You are not required to authorize this restoration.");
  }

  const ackIndex = store.assignmentAcknowledgments.findIndex(
    (a) => a.requestId === input.requestId && a.userId === input.participantUserId,
  );
  const ack = {
    requestId: input.requestId,
    journeyId: request.journeyId,
    userId: input.participantUserId,
    counselorUserId: input.counselorUserId,
    acknowledgedAt: now,
  };
  if (ackIndex === -1) store.assignmentAcknowledgments.push(ack);
  else store.assignmentAcknowledgments[ackIndex] = ack;
  await writeStore(store);

  return tryExecuteCounselorAssignmentRequestAtomic(input.requestId);
}

export async function revokeParticipantCounselorAccessAtomic(
  journeyId: string,
  participantUserId: string,
) {
  const now = new Date().toISOString();
  const store = await readStore();
  const journeyIndex = store.journeys.findIndex((j) => j.id === journeyId);
  if (journeyIndex === -1) throw new Error("Journey not found.");
  const journey = store.journeys[journeyIndex]!;

  const revIndex = store.participantCounselorRevocations.findIndex(
    (r) => r.journeyId === journeyId && r.userId === participantUserId,
  );
  const rev = { journeyId, userId: participantUserId, revokedAt: now };
  if (revIndex === -1) store.participantCounselorRevocations.push(rev);
  else store.participantCounselorRevocations[revIndex] = rev;

  for (const r of store.assignmentRequests) {
    if (r.journeyId !== journeyId) continue;
    if (r.status === "pending" || (r.status === "approved" && !r.executedAt)) {
      r.status = "cancelled";
      r.reviewedAt = now;
      r.decisionNote = "Cancelled because a participant revoked counselor access.";
    }
  }

  const patch = { counselorAccessRevokedAt: now, counselorUserId: null };
  if (counselorJourneyAccessChangeRequiresInvalidation(journey, patch)) {
    store.sharingConsents = invalidateAllCounselorDisclosureForJourneyInMemory(
      store.sharingConsents,
      journeyId,
      now,
    );
  }
  store.journeys[journeyIndex] = {
    ...journey,
    counselorUserId: null,
    counselorAccessRevokedAt: now,
    updatedAt: now,
  };
  await writeStore(store);
}

export async function setJourneyAdministrativeCoordinator(
  record: MarriageJourneyAdministrativeCoordinatorRecord,
) {
  const store = await readStore();
  const index = store.administrativeCoordinators.findIndex((r) => r.journeyId === record.journeyId);
  if (index === -1) store.administrativeCoordinators.push(record);
  else store.administrativeCoordinators[index] = record;
  await writeStore(store);
  return record;
}

export async function removeJourneyAdministrativeCoordinator(journeyId: string) {
  const store = await readStore();
  store.administrativeCoordinators = store.administrativeCoordinators.filter(
    (r) => r.journeyId !== journeyId,
  );
  await writeStore(store);
}

export async function getJourneyAdministrativeCoordinator(journeyId: string) {
  const store = await readStore();
  return store.administrativeCoordinators.find((r) => r.journeyId === journeyId) ?? null;
}

export async function listJourneyIdsForAdministrativeCoordinator(coordinatorUserId: string) {
  const store = await readStore();
  return store.administrativeCoordinators
    .filter((r) => r.coordinatorUserId === coordinatorUserId)
    .map((r) => r.journeyId);
}

export async function listActiveJourneysForAdministrativeCoordinator(coordinatorUserId: string) {
  const store = await readStore();
  const ids = new Set(
    store.administrativeCoordinators
      .filter((r) => r.coordinatorUserId === coordinatorUserId)
      .map((r) => r.journeyId),
  );
  return store.journeys.filter((j) => j.status === "active" && ids.has(j.id));
}

export async function getMarriagePrepDefaultCounselorSetting(): Promise<MarriagePrepDefaultCounselorSettingRecord | null> {
  const store = await readStore();
  return store.defaultPremaritalCounselor ?? null;
}

export async function saveMarriagePrepDefaultCounselorSetting(
  record: MarriagePrepDefaultCounselorSettingRecord,
): Promise<MarriagePrepDefaultCounselorSettingRecord> {
  const store = await readStore();
  store.defaultPremaritalCounselor = record;
  await writeStore(store);
  return record;
}

export async function listPremaritalProgramSessionsForJourney(journeyId: string) {
  const store = await readStore();
  return store.premaritalProgramSessions!.filter((s) => s.journeyId === journeyId);
}

export async function savePremaritalProgramSession(
  record: MarriagePremaritalProgramSessionRecord,
): Promise<MarriagePremaritalProgramSessionRecord> {
  const store = await readStore();
  const index = store.premaritalProgramSessions!.findIndex(
    (s) => s.journeyId === record.journeyId && s.sessionKey === record.sessionKey,
  );
  if (index === -1) store.premaritalProgramSessions!.push(record);
  else store.premaritalProgramSessions![index] = record;
  await writeStore(store);
  return record;
}

export async function getPremaritalProgramMeta(journeyId: string) {
  const store = await readStore();
  return store.premaritalProgramMeta!.find((m) => m.journeyId === journeyId) ?? null;
}

export async function savePremaritalProgramMeta(
  record: MarriagePremaritalProgramMetaRecord,
): Promise<MarriagePremaritalProgramMetaRecord> {
  const store = await readStore();
  const index = store.premaritalProgramMeta!.findIndex((m) => m.journeyId === record.journeyId);
  if (index === -1) store.premaritalProgramMeta!.push(record);
  else store.premaritalProgramMeta![index] = record;
  await writeStore(store);
  return record;
}

export async function listPremaritalSessionClinicalForJourney(journeyId: string) {
  const store = await readStore();
  return store.premaritalSessionClinical!.filter((r) => r.journeyId === journeyId);
}

export async function savePremaritalSessionClinical(
  record: import("@/lib/marriage-counseling-types").MarriagePremaritalSessionClinicalRecord,
) {
  const store = await readStore();
  const index = store.premaritalSessionClinical!.findIndex(
    (r) => r.journeyId === record.journeyId && r.sessionKey === record.sessionKey,
  );
  if (index === -1) store.premaritalSessionClinical!.push(record);
  else store.premaritalSessionClinical![index] = record;
  await writeStore(store);
  return record;
}

export async function getPremaritalReadinessReview(journeyId: string) {
  const store = await readStore();
  return store.premaritalReadinessReviews!.find((r) => r.journeyId === journeyId) ?? null;
}

export async function savePremaritalReadinessReview(
  record: import("@/lib/marriage-counseling-types").MarriagePremaritalReadinessReviewRecord,
) {
  const store = await readStore();
  const index = store.premaritalReadinessReviews!.findIndex((r) => r.journeyId === record.journeyId);
  if (index === -1) store.premaritalReadinessReviews!.push(record);
  else store.premaritalReadinessReviews![index] = record;
  await writeStore(store);
  return record;
}

export async function listPremaritalReadinessReviewAudit(journeyId: string) {
  const store = await readStore();
  return store
    .premaritalReadinessAudit!.filter((a) => a.journeyId === journeyId)
    .sort((a, b) => b.revisedAt.localeCompare(a.revisedAt));
}

export async function savePremaritalReadinessReviewAudit(
  record: import("@/lib/marriage-counseling-types").MarriagePremaritalReadinessReviewAuditRecord,
) {
  const store = await readStore();
  store.premaritalReadinessAudit!.push(record);
  await writeStore(store);
  return record;
}

export async function listActivePremaritalJourneyIds() {
  const store = await readStore();
  return store.journeys
    .filter((j) => j.programType === "premarital" && j.status === "active")
    .map((j) => j.id);
}

export async function tryRecordPremaritalReminderDelivery(input: {
  id: string;
  kind: string;
  referenceKey: string;
  journeyId: string;
  sentAt: string;
}) {
  const store = await readStore();
  if (!store.premaritalReminderDeliveries) store.premaritalReminderDeliveries = [];
  const exists = store.premaritalReminderDeliveries.some(
    (d) => d.kind === input.kind && d.referenceKey === input.referenceKey,
  );
  if (exists) return false;
  store.premaritalReminderDeliveries.push(input);
  await writeStore(store);
  return true;
}
