import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getChangedCounselorConsentQuestionIds } from "@/lib/marriage-assessment-answer-changes";
import {
  computeAnswerFingerprint,
  isAnswerDisclosableToCounselor,
} from "@/lib/marriage-counselor-consent";
import {
  acquireAssessmentDraftAdvisoryLock,
  lockCounselingJourneyRow,
  lockRevisionRequestRow,
  type MarriageDbTransaction,
} from "@/lib/marriage-concurrency-protocol";
import {
  counselorJourneyAccessChangeRequiresInvalidation,
  assertNoCounselorFieldsInGenericJourneyPatch,
  type CounselorJourneyAccessPatch,
} from "@/lib/marriage-counselor-assignment-change";
import {
  invalidateCounselorQuestionsInTransaction,
  mapSharingConsentRow,
} from "@/lib/marriage-counselor-consent-invalidation";
import { invalidateAllCounselorDisclosureForJourneyInTransaction } from "@/lib/marriage-counselor-journey-consent-invalidation";
import {
  assertCounselorSharingConsentGrant,
  buildCounselorConsentRevocationRecord,
  mergePartnerSharingConsentPatch,
} from "@/lib/marriage-sharing-consent-persistence";
import type { MarriageQuestionDefinition } from "@/lib/marriage-counseling-types";
import type {
  MarriageAssessmentResponseRecord,
  MarriagePartnerSharingConsentPatch,
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
} from "@/lib/marriage-counseling-types";

function mapJourney(row: {
  id: string;
  coupleLinkId: string;
  programType: string;
  status: string;
  currentModuleId: string | null;
  counselorUserId: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
  pairingMode?: string | null;
  participantAId?: string | null;
  participantBId?: string | null;
  guidedModuleIdsJson?: string | null;
  curriculumVersion?: string | null;
  counselorAccessRevokedAt?: Date | null;
  deletionRequestedAt?: Date | null;
}): MarriageCounselingJourneyRecord {
  return {
    id: row.id,
    coupleLinkId: row.coupleLinkId,
    programType: row.programType as MarriageCounselingJourneyRecord["programType"],
    status: row.status as MarriageCounselingJourneyRecord["status"],
    currentModuleId: row.currentModuleId,
    counselorUserId: row.counselorUserId,
    createdBy: row.createdBy,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    completedAt: row.completedAt?.toISOString(),
    pairingMode: (row.pairingMode as MarriageCounselingJourneyRecord["pairingMode"]) ?? undefined,
    participantAId: row.participantAId ?? undefined,
    participantBId: row.participantBId ?? null,
    guidedModuleIds: row.guidedModuleIdsJson
      ? (JSON.parse(row.guidedModuleIdsJson) as string[])
      : undefined,
    curriculumVersion: row.curriculumVersion ?? undefined,
    counselorAccessRevokedAt: row.counselorAccessRevokedAt?.toISOString() ?? null,
    deletionRequestedAt: row.deletionRequestedAt?.toISOString() ?? null,
  };
}

export async function listJourneysForCoupleLink(coupleLinkId: string) {
  const rows = await prisma.marriageCounselingJourney.findMany({
    where: { coupleLinkId },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(mapJourney);
}

export async function getJourneyById(id: string) {
  const row = await prisma.marriageCounselingJourney.findUnique({ where: { id } });
  return row ? mapJourney(row) : null;
}

export async function getActiveJourneyForCoupleLink(coupleLinkId: string) {
  const row = await prisma.marriageCounselingJourney.findFirst({
    where: { coupleLinkId, status: "active" },
    orderBy: { createdAt: "desc" },
  });
  return row ? mapJourney(row) : null;
}

export async function getActiveJourneyForUser(userId: string) {
  const row = await prisma.marriageCounselingJourney.findFirst({
    where: {
      status: "active",
      OR: [{ participantAId: userId }, { participantBId: userId }],
    },
    orderBy: { createdAt: "desc" },
  });
  if (row) return mapJourney(row);
  const { getCoupleLinksForUser } = await import("@/lib/stores/couple-link-db");
  const links = await getCoupleLinksForUser(userId);
  const activeLink = links.find((l) => l.status === "active");
  if (!activeLink) return null;
  return getActiveJourneyForCoupleLink(activeLink.id);
}

export async function createJourney(input: {
  id?: string;
  coupleLinkId: string;
  programType: string;
  status: string;
  currentModuleId: string | null;
  counselorUserId: string | null;
  createdBy: string;
  pairingMode?: string;
  participantAId?: string;
  participantBId?: string | null;
  guidedModuleIds?: string[];
  curriculumVersion?: string;
}) {
  const now = new Date();
  const row = await prisma.marriageCounselingJourney.create({
    data: {
      id: input.id ?? `mj-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      coupleLinkId: input.coupleLinkId,
      programType: input.programType,
      status: input.status,
      currentModuleId: input.currentModuleId,
      counselorUserId: input.counselorUserId,
      createdBy: input.createdBy,
      createdAt: now,
      updatedAt: now,
      pairingMode: input.pairingMode ?? "spouse_link",
      participantAId: input.participantAId ?? null,
      participantBId: input.participantBId ?? null,
      guidedModuleIdsJson: input.guidedModuleIds?.length
        ? JSON.stringify(input.guidedModuleIds)
        : null,
      curriculumVersion: input.curriculumVersion ?? null,
    },
  });
  return mapJourney(row);
}

export async function updateJourney(
  id: string,
  patch: Partial<{
    status: string;
    currentModuleId: string | null;
    counselorUserId: string | null;
    completedAt: string;
    participantBId: string | null;
    guidedModuleIds: string[];
    curriculumVersion: string;
    counselorAccessRevokedAt: string | null;
    deletionRequestedAt: string | null;
  }>,
) {
  assertNoCounselorFieldsInGenericJourneyPatch(patch);
  const row = await prisma.marriageCounselingJourney.update({
    where: { id },
    data: {
      status: patch.status,
      currentModuleId: patch.currentModuleId,
      completedAt: patch.completedAt ? new Date(patch.completedAt) : undefined,
      participantBId: patch.participantBId,
      guidedModuleIdsJson: patch.guidedModuleIds
        ? JSON.stringify(patch.guidedModuleIds)
        : undefined,
      curriculumVersion: patch.curriculumVersion,
      deletionRequestedAt: patch.deletionRequestedAt
        ? new Date(patch.deletionRequestedAt)
        : patch.deletionRequestedAt === null
          ? null
          : undefined,
      updatedAt: new Date(),
    },
  });
  return mapJourney(row);
}

export async function applyCounselorJourneyAccessChange(
  journeyId: string,
  patch: CounselorJourneyAccessPatch,
) {
  const now = new Date().toISOString();

  return prisma.$transaction(async (tx) => {
    await lockCounselingJourneyRow(tx, journeyId);
    const journeyRow = await tx.marriageCounselingJourney.findUnique({ where: { id: journeyId } });
    if (!journeyRow) throw new Error("Journey not found.");

    const journey = mapJourney(journeyRow);
    const shouldInvalidate = counselorJourneyAccessChangeRequiresInvalidation(journey, patch);
    if (shouldInvalidate) {
      await invalidateAllCounselorDisclosureForJourneyInTransaction(tx, journeyId, now);
    }

    const row = await tx.marriageCounselingJourney.update({
      where: { id: journeyId },
      data: {
        counselorUserId:
          patch.counselorUserId !== undefined ? patch.counselorUserId : undefined,
        counselorAccessRevokedAt:
          patch.counselorAccessRevokedAt !== undefined
            ? patch.counselorAccessRevokedAt
              ? new Date(patch.counselorAccessRevokedAt)
              : null
            : undefined,
        updatedAt: new Date(),
      },
    });
    return mapJourney(row);
  });
}

export async function upsertConsent(record: MarriageJourneyConsentRecord) {
  await prisma.marriageJourneyConsent.upsert({
    where: { journeyId_userId: { journeyId: record.journeyId, userId: record.userId } },
    create: {
      journeyId: record.journeyId,
      userId: record.userId,
      consentVersion: record.consentVersion,
      consentedAt: new Date(record.consentedAt),
    },
    update: {
      consentVersion: record.consentVersion,
      consentedAt: new Date(record.consentedAt),
    },
  });
  return record;
}

export async function getConsentsForJourney(journeyId: string) {
  const rows = await prisma.marriageJourneyConsent.findMany({ where: { journeyId } });
  return rows.map((r) => ({
    journeyId: r.journeyId,
    userId: r.userId,
    consentVersion: r.consentVersion,
    consentedAt: r.consentedAt.toISOString(),
  }));
}

export async function getResponse(journeyId: string, moduleId: string, userId: string) {
  const row = await prisma.marriageAssessmentResponse.findFirst({
    where: { journeyId, moduleId, userId },
  });
  if (!row) return null;
  return {
    id: row.id,
    journeyId: row.journeyId,
    moduleId: row.moduleId,
    contentVersion: row.contentVersion,
    userId: row.userId,
    status: row.status as MarriageAssessmentResponseRecord["status"],
    answers: JSON.parse(row.answersJson) as Record<string, unknown>,
    lastSavedAt: row.lastSavedAt.toISOString(),
    submittedAt: row.submittedAt?.toISOString(),
    revisionGeneration: row.revisionGeneration ?? 0,
  };
}

export async function listResponsesForJourneyModule(journeyId: string, moduleId: string) {
  const rows = await prisma.marriageAssessmentResponse.findMany({ where: { journeyId, moduleId } });
  return rows.map((row) => ({
    id: row.id,
    journeyId: row.journeyId,
    moduleId: row.moduleId,
    contentVersion: row.contentVersion,
    userId: row.userId,
    status: row.status as MarriageAssessmentResponseRecord["status"],
    answers: JSON.parse(row.answersJson) as Record<string, unknown>,
    lastSavedAt: row.lastSavedAt.toISOString(),
    submittedAt: row.submittedAt?.toISOString(),
    revisionGeneration: row.revisionGeneration ?? 0,
  }));
}

function assessmentResponseUpsertArgs(record: MarriageAssessmentResponseRecord) {
  return {
    where: {
      journeyId_moduleId_userId: {
        journeyId: record.journeyId,
        moduleId: record.moduleId,
        userId: record.userId,
      },
    },
    create: {
      id: record.id,
      journeyId: record.journeyId,
      moduleId: record.moduleId,
      contentVersion: record.contentVersion,
      userId: record.userId,
      status: record.status,
      answersJson: JSON.stringify(record.answers),
      lastSavedAt: new Date(record.lastSavedAt),
      submittedAt: record.submittedAt ? new Date(record.submittedAt) : null,
      revisionGeneration: record.revisionGeneration ?? 0,
    },
    update: {
      status: record.status,
      answersJson: JSON.stringify(record.answers),
      contentVersion: record.contentVersion,
      lastSavedAt: new Date(record.lastSavedAt),
      submittedAt: record.submittedAt ? new Date(record.submittedAt) : null,
      revisionGeneration: record.revisionGeneration ?? 0,
    },
  };
}

async function saveResponseWithClient(client: MarriageDbTransaction, record: MarriageAssessmentResponseRecord) {
  await client.marriageAssessmentResponse.upsert(assessmentResponseUpsertArgs(record));
  return record;
}

export async function saveResponse(record: MarriageAssessmentResponseRecord) {
  await saveResponseWithClient(prisma, record);
  return record;
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

  await prisma.$transaction(async (tx) => {
    await acquireAssessmentDraftAdvisoryLock(tx, journeyId, moduleId, userId);

    const row = await tx.marriageAssessmentResponse.findFirst({
      where: { journeyId, moduleId, userId },
    });

    if (row?.status === "submitted") {
      throw new Error("This assessment is submitted. Contact your counselor to revise.");
    }

    const previousAnswers = row
      ? (JSON.parse(row.answersJson) as Record<string, unknown>)
      : {};
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
      contentVersion: row?.contentVersion ?? contentVersion,
      userId,
      status: "draft",
      answers: mergedAnswers,
      lastSavedAt,
      submittedAt: undefined,
      revisionGeneration: row?.revisionGeneration ?? 0,
    };

    await saveResponseWithClient(tx, record);

    if (changedCounselorQuestionIds.length > 0) {
      await invalidateCounselorQuestionsInTransaction(tx, {
        journeyId,
        moduleId,
        userId,
        questionIds: changedCounselorQuestionIds,
        revokedAt: lastSavedAt,
      });
    }
  });

  return { lastSavedAt };
}

/** @deprecated Use applyAssessmentDraftPatch with an answer patch. */
export async function saveAssessmentResponseWithCounselorConsentInvalidation(
  record: MarriageAssessmentResponseRecord,
  invalidateCounselorQuestionIds: string[],
) {
  await prisma.$transaction(async (tx) => {
    await acquireAssessmentDraftAdvisoryLock(tx, record.journeyId, record.moduleId, record.userId);
    await saveResponseWithClient(tx, record);
    if (invalidateCounselorQuestionIds.length > 0) {
      await invalidateCounselorQuestionsInTransaction(tx, {
        journeyId: record.journeyId,
        moduleId: record.moduleId,
        userId: record.userId,
        questionIds: invalidateCounselorQuestionIds,
        revokedAt: record.lastSavedAt,
      });
    }
  });
  return record;
}

export async function approveAssessmentRevisionRequest(
  revisionRequestId: string,
  resolvedByUserId: string,
  counselorConsentQuestionIds: string[],
): Promise<{ ok: true; idempotent: boolean }> {
  const now = new Date().toISOString();

  const result = await prisma.$transaction(async (tx) => {
    await lockRevisionRequestRow(tx, revisionRequestId);
    const request = await tx.marriageRevisionRequest.findUnique({
      where: { id: revisionRequestId },
    });
    if (!request) throw new Error("Request not found.");
    if (request.status !== "pending") {
      return { ok: true as const, idempotent: true };
    }

    await acquireAssessmentDraftAdvisoryLock(
      tx,
      request.journeyId,
      request.moduleId,
      request.userId,
    );

    const row = await tx.marriageAssessmentResponse.findFirst({
      where: {
        journeyId: request.journeyId,
        moduleId: request.moduleId,
        userId: request.userId,
      },
    });
    if (!row) throw new Error("Assessment response not found.");

    await tx.marriageRevisionRequest.update({
      where: { id: revisionRequestId },
      data: {
        status: "approved",
        resolvedAt: new Date(now),
        resolvedBy: resolvedByUserId,
      },
    });

    const answers = JSON.parse(row.answersJson) as Record<string, unknown>;
    const reopened: MarriageAssessmentResponseRecord = {
      id: row.id,
      journeyId: row.journeyId,
      moduleId: row.moduleId,
      contentVersion: row.contentVersion,
      userId: row.userId,
      status: "draft",
      answers,
      lastSavedAt: now,
      submittedAt: undefined,
      revisionGeneration: (row.revisionGeneration ?? 0) + 1,
    };
    await saveResponseWithClient(tx, reopened);

    if (counselorConsentQuestionIds.length > 0) {
      await invalidateCounselorQuestionsInTransaction(tx, {
        journeyId: request.journeyId,
        moduleId: request.moduleId,
        userId: request.userId,
        questionIds: counselorConsentQuestionIds,
        revokedAt: now,
      });
    }

    return { ok: true as const, idempotent: false };
  });

  return result;
}

export async function getUnlock(journeyId: string, moduleId: string, contentVersion: string) {
  const row = await prisma.marriageComparisonUnlock.findUnique({
    where: { journeyId_moduleId_contentVersion: { journeyId, moduleId, contentVersion } },
  });
  if (!row) return null;
  return {
    journeyId: row.journeyId,
    moduleId: row.moduleId,
    contentVersion: row.contentVersion,
    unlockedAt: row.unlockedAt.toISOString(),
  };
}

export async function createUnlock(record: MarriageComparisonUnlockRecord) {
  await prisma.marriageComparisonUnlock.upsert({
    where: {
      journeyId_moduleId_contentVersion: {
        journeyId: record.journeyId,
        moduleId: record.moduleId,
        contentVersion: record.contentVersion,
      },
    },
    create: {
      journeyId: record.journeyId,
      moduleId: record.moduleId,
      contentVersion: record.contentVersion,
      unlockedAt: new Date(record.unlockedAt),
    },
    update: {},
  });
  return record;
}

export async function listJournal(journeyId: string, viewerId: string) {
  const rows = await prisma.marriageJournalEntry.findMany({
    where: {
      journeyId,
      OR: [{ visibility: "shared" }, { authorId: viewerId }],
    },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(
    (r): MarriageJournalEntryRecord => ({
      id: r.id,
      journeyId: r.journeyId,
      authorId: r.authorId,
      authorName: r.authorName,
      visibility: r.visibility as MarriageJournalEntryRecord["visibility"],
      kind: r.kind as MarriageJournalEntryRecord["kind"],
      body: r.body,
      moduleId: r.moduleId ?? undefined,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }),
  );
}

export async function addJournalEntry(entry: MarriageJournalEntryRecord) {
  await prisma.marriageJournalEntry.create({
    data: {
      id: entry.id,
      journeyId: entry.journeyId,
      authorId: entry.authorId,
      authorName: entry.authorName,
      visibility: entry.visibility,
      kind: entry.kind,
      body: entry.body,
      moduleId: entry.moduleId ?? null,
      createdAt: new Date(entry.createdAt),
      updatedAt: new Date(entry.updatedAt),
    },
  });
  return entry;
}

function mapSession(r: {
  id: string;
  journeyId: string;
  scheduledAt: Date;
  zoomUrl: string | null;
  notes: string | null;
  topic: string | null;
  status: string;
  prepModuleIdsJson: string | null;
  homeworkAssignmentIdsJson: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date | null;
  completedAt: Date | null;
  cancelledAt: Date | null;
}): MarriageCounselingSessionRecord {
  return {
    id: r.id,
    journeyId: r.journeyId,
    scheduledAt: r.scheduledAt.toISOString(),
    zoomUrl: r.zoomUrl ?? undefined,
    notes: r.notes ?? undefined,
    topic: r.topic ?? undefined,
    status: r.status as MarriageCounselingSessionRecord["status"],
    prepModuleIds: r.prepModuleIdsJson ? (JSON.parse(r.prepModuleIdsJson) as string[]) : undefined,
    homeworkAssignmentIds: r.homeworkAssignmentIdsJson
      ? (JSON.parse(r.homeworkAssignmentIdsJson) as string[])
      : undefined,
    createdBy: r.createdBy,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt?.toISOString(),
    completedAt: r.completedAt?.toISOString(),
    cancelledAt: r.cancelledAt?.toISOString(),
  };
}

export async function listSessions(journeyId: string) {
  const rows = await prisma.marriageCounselingSession.findMany({
    where: { journeyId, NOT: { status: "cancelled" } },
    orderBy: { scheduledAt: "asc" },
  });
  return rows.map(mapSession);
}

export async function saveSession(session: MarriageCounselingSessionRecord) {
  const data = {
    journeyId: session.journeyId,
    scheduledAt: new Date(session.scheduledAt),
    zoomUrl: session.zoomUrl ?? null,
    notes: session.notes ?? null,
    topic: session.topic ?? null,
    status: session.status ?? "scheduled",
    prepModuleIdsJson: session.prepModuleIds?.length ? JSON.stringify(session.prepModuleIds) : null,
    homeworkAssignmentIdsJson: session.homeworkAssignmentIds?.length
      ? JSON.stringify(session.homeworkAssignmentIds)
      : null,
    createdBy: session.createdBy,
    createdAt: new Date(session.createdAt),
    updatedAt: session.updatedAt ? new Date(session.updatedAt) : new Date(),
    completedAt: session.completedAt ? new Date(session.completedAt) : null,
    cancelledAt: session.cancelledAt ? new Date(session.cancelledAt) : null,
  };
  await prisma.marriageCounselingSession.upsert({
    where: { id: session.id },
    create: { id: session.id, ...data },
    update: data,
  });
  return session;
}

export async function getSessionById(id: string) {
  const r = await prisma.marriageCounselingSession.findUnique({ where: { id } });
  return r ? mapSession(r) : null;
}

export async function listAssignments(journeyId: string) {
  const rows = await prisma.marriageCounselorAssignment.findMany({
    where: { journeyId },
    orderBy: { dueAt: "asc" },
  });
  return rows.map(
    (r): MarriageCounselorAssignmentRecord => ({
      id: r.id,
      journeyId: r.journeyId,
      counselorUserId: r.counselorUserId,
      title: r.title,
      description: r.description ?? undefined,
      moduleId: r.moduleId ?? undefined,
      dueAt: r.dueAt?.toISOString(),
      completedByUserIds: JSON.parse(r.completedByJson) as string[],
      createdAt: r.createdAt.toISOString(),
      sessionId: r.sessionId ?? undefined,
    }),
  );
}

export async function getAssignmentById(id: string) {
  const r = await prisma.marriageCounselorAssignment.findUnique({ where: { id } });
  if (!r) return null;
  return {
    id: r.id,
    journeyId: r.journeyId,
    counselorUserId: r.counselorUserId,
    title: r.title,
    description: r.description ?? undefined,
    moduleId: r.moduleId ?? undefined,
    dueAt: r.dueAt?.toISOString(),
    completedByUserIds: JSON.parse(r.completedByJson) as string[],
    createdAt: r.createdAt.toISOString(),
    sessionId: r.sessionId ?? undefined,
  };
}

export async function saveAssignment(assignment: MarriageCounselorAssignmentRecord) {
  await prisma.marriageCounselorAssignment.upsert({
    where: { id: assignment.id },
    create: {
      id: assignment.id,
      journeyId: assignment.journeyId,
      counselorUserId: assignment.counselorUserId,
      title: assignment.title,
      description: assignment.description ?? null,
      moduleId: assignment.moduleId ?? null,
      dueAt: assignment.dueAt ? new Date(assignment.dueAt) : null,
      completedByJson: JSON.stringify(assignment.completedByUserIds),
      sessionId: assignment.sessionId ?? null,
      createdAt: new Date(assignment.createdAt),
    },
    update: {
      title: assignment.title,
      description: assignment.description ?? null,
      moduleId: assignment.moduleId ?? null,
      dueAt: assignment.dueAt ? new Date(assignment.dueAt) : null,
      completedByJson: JSON.stringify(assignment.completedByUserIds),
    },
  });
  return assignment;
}

export async function listCounselorNotes(journeyId: string) {
  const rows = await prisma.marriageCounselorNote.findMany({
    where: { journeyId },
    orderBy: { updatedAt: "desc" },
  });
  return rows.map(
    (r): MarriageCounselorNoteRecord => ({
      id: r.id,
      journeyId: r.journeyId,
      counselorUserId: r.counselorUserId,
      body: r.body,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }),
  );
}

export async function saveCounselorNote(note: MarriageCounselorNoteRecord) {
  await prisma.marriageCounselorNote.upsert({
    where: { id: note.id },
    create: {
      id: note.id,
      journeyId: note.journeyId,
      counselorUserId: note.counselorUserId,
      body: note.body,
      createdAt: new Date(note.createdAt),
      updatedAt: new Date(note.updatedAt),
    },
    update: {
      body: note.body,
      updatedAt: new Date(note.updatedAt),
    },
  });
  return note;
}

export async function createInvite(record: MarriageJourneyInviteRecord) {
  const active = await prisma.marriageJourneyInvite.findFirst({
    where: {
      journeyId: record.journeyId,
      revokedAt: null,
      acceptedAt: null,
      expiresAt: { gt: new Date() },
    },
  });
  if (active) throw new Error("An active invitation already exists for this journey.");
  await prisma.marriageJourneyInvite.create({
    data: {
      id: record.id,
      code: record.code,
      journeyId: record.journeyId,
      createdBy: record.createdBy,
      intendedEmail: record.intendedEmail ?? null,
      expiresAt: new Date(record.expiresAt),
      revokedAt: record.revokedAt ? new Date(record.revokedAt) : null,
      acceptedByUserId: record.acceptedByUserId ?? null,
      acceptedAt: record.acceptedAt ? new Date(record.acceptedAt) : null,
      createdAt: new Date(record.createdAt),
    },
  });
  return record;
}

export async function getInviteByCode(code: string) {
  const r = await prisma.marriageJourneyInvite.findUnique({
    where: { code: code.trim().toUpperCase() },
  });
  if (!r) return null;
  return {
    id: r.id,
    code: r.code,
    journeyId: r.journeyId,
    createdBy: r.createdBy,
    intendedEmail: r.intendedEmail ?? undefined,
    expiresAt: r.expiresAt.toISOString(),
    revokedAt: r.revokedAt?.toISOString(),
    acceptedByUserId: r.acceptedByUserId ?? undefined,
    acceptedAt: r.acceptedAt?.toISOString(),
    createdAt: r.createdAt.toISOString(),
  };
}

export async function updateInvite(id: string, patch: Partial<MarriageJourneyInviteRecord>) {
  await prisma.marriageJourneyInvite.update({
    where: { id },
    data: {
      revokedAt: patch.revokedAt ? new Date(patch.revokedAt) : undefined,
      acceptedByUserId: patch.acceptedByUserId,
      acceptedAt: patch.acceptedAt ? new Date(patch.acceptedAt) : undefined,
    },
  });
  const r = await prisma.marriageJourneyInvite.findUnique({ where: { id } });
  if (!r) throw new Error("Invite not found.");
  return {
    id: r.id,
    code: r.code,
    journeyId: r.journeyId,
    createdBy: r.createdBy,
    expiresAt: r.expiresAt.toISOString(),
    createdAt: r.createdAt.toISOString(),
  };
}

export async function listInvitesForJourney(journeyId: string) {
  const rows = await prisma.marriageJourneyInvite.findMany({ where: { journeyId } });
  return rows.map((r) => ({
    id: r.id,
    code: r.code,
    journeyId: r.journeyId,
    createdBy: r.createdBy,
    intendedEmail: r.intendedEmail ?? undefined,
    expiresAt: r.expiresAt.toISOString(),
    revokedAt: r.revokedAt?.toISOString(),
    acceptedByUserId: r.acceptedByUserId ?? undefined,
    acceptedAt: r.acceptedAt?.toISOString(),
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function createRevisionRequest(record: MarriageRevisionRequestRecord) {
  await prisma.marriageRevisionRequest.create({
    data: {
      id: record.id,
      journeyId: record.journeyId,
      moduleId: record.moduleId,
      userId: record.userId,
      reason: record.reason ?? null,
      status: record.status,
      requestedAt: new Date(record.requestedAt),
      resolvedAt: record.resolvedAt ? new Date(record.resolvedAt) : null,
      resolvedBy: record.resolvedBy ?? null,
    },
  });
  return record;
}

export async function updateRevisionRequest(id: string, patch: Partial<MarriageRevisionRequestRecord>) {
  await prisma.marriageRevisionRequest.update({
    where: { id },
    data: {
      status: patch.status,
      resolvedAt: patch.resolvedAt ? new Date(patch.resolvedAt) : undefined,
      resolvedBy: patch.resolvedBy,
    },
  });
  const r = await prisma.marriageRevisionRequest.findUnique({ where: { id } });
  if (!r) throw new Error("Revision request not found.");
  return {
    id: r.id,
    journeyId: r.journeyId,
    moduleId: r.moduleId,
    userId: r.userId,
    reason: r.reason ?? undefined,
    status: r.status as MarriageRevisionRequestRecord["status"],
    requestedAt: r.requestedAt.toISOString(),
    resolvedAt: r.resolvedAt?.toISOString(),
    resolvedBy: r.resolvedBy ?? undefined,
  };
}

export async function listRevisionRequests(journeyId: string) {
  const rows = await prisma.marriageRevisionRequest.findMany({ where: { journeyId } });
  return rows.map(
    (r): MarriageRevisionRequestRecord => ({
      id: r.id,
      journeyId: r.journeyId,
      moduleId: r.moduleId,
      userId: r.userId,
      reason: r.reason ?? undefined,
      status: r.status as MarriageRevisionRequestRecord["status"],
      requestedAt: r.requestedAt.toISOString(),
      resolvedAt: r.resolvedAt?.toISOString(),
      resolvedBy: r.resolvedBy ?? undefined,
    }),
  );
}

export async function getRevisionRequestById(id: string) {
  const r = await prisma.marriageRevisionRequest.findUnique({ where: { id } });
  if (!r) return null;
  return {
    id: r.id,
    journeyId: r.journeyId,
    moduleId: r.moduleId,
    userId: r.userId,
    reason: r.reason ?? undefined,
    status: r.status as MarriageRevisionRequestRecord["status"],
    requestedAt: r.requestedAt.toISOString(),
    resolvedAt: r.resolvedAt?.toISOString(),
    resolvedBy: r.resolvedBy ?? undefined,
  };
}

export async function appendAuditLog(record: MarriageAuditLogRecord) {
  await prisma.marriageAuditLog.create({
    data: {
      id: record.id,
      at: new Date(record.at),
      actorUserId: record.actorUserId,
      action: record.action,
      journeyId: record.journeyId ?? null,
      targetUserId: record.targetUserId ?? null,
      metaJson: record.meta ? JSON.stringify(record.meta) : null,
    },
  });
  return record;
}

export async function listAuditLogs(journeyId?: string) {
  const rows = await prisma.marriageAuditLog.findMany({
    where: journeyId ? { journeyId } : undefined,
    orderBy: { at: "desc" },
    take: 200,
  });
  return rows.map(
    (r): MarriageAuditLogRecord => ({
      id: r.id,
      at: r.at.toISOString(),
      actorUserId: r.actorUserId,
      action: r.action,
      journeyId: r.journeyId ?? undefined,
      targetUserId: r.targetUserId ?? undefined,
      meta: r.metaJson ? (JSON.parse(r.metaJson) as MarriageAuditLogRecord["meta"]) : undefined,
    }),
  );
}

export async function archiveJourneyData(journeyId: string) {
  return updateJourney(journeyId, { status: "archived" });
}

export async function listJourneysForCounselor(counselorUserId: string) {
  const rows = await prisma.marriageCounselingJourney.findMany({
    where: { counselorUserId, status: { not: "archived" } },
  });
  return rows.map(mapJourney);
}

export async function listAllActiveJourneys() {
  const rows = await prisma.marriageCounselingJourney.findMany({ where: { status: "active" } });
  return rows.map(mapJourney);
}

function discussedAtForCreate(mark: MarriageDiscussionMarkRecord): Date | null {
  if (mark.discussedAt === null) return null;
  if (mark.discussedAt) return new Date(mark.discussedAt);
  return new Date(mark.markedAt);
}

function discussedAtForUpdate(mark: MarriageDiscussionMarkRecord): Date | null | undefined {
  if (mark.discussedAt === undefined) return undefined;
  if (mark.discussedAt === null) return null;
  return new Date(mark.discussedAt);
}

export async function upsertDiscussionMark(mark: MarriageDiscussionMarkRecord) {
  const discussedUpdate = discussedAtForUpdate(mark);
  await prisma.marriageDiscussionMark.upsert({
    where: {
      journeyId_moduleId_questionId_markedByUserId: {
        journeyId: mark.journeyId,
        moduleId: mark.moduleId,
        questionId: mark.questionId,
        markedByUserId: mark.markedByUserId,
      },
    },
    create: {
      id: mark.id,
      journeyId: mark.journeyId,
      moduleId: mark.moduleId,
      questionId: mark.questionId,
      markedByUserId: mark.markedByUserId,
      sharedNote: mark.sharedNote ?? null,
      markedAt: new Date(mark.markedAt),
      discussedAt: discussedAtForCreate(mark),
    },
    update: {
      markedAt: new Date(mark.markedAt),
      ...(mark.sharedNote !== undefined ? { sharedNote: mark.sharedNote ?? null } : {}),
      ...(discussedUpdate !== undefined ? { discussedAt: discussedUpdate } : {}),
    },
  });
  return mark;
}

export async function getDiscussionMarks(journeyId: string, moduleId: string) {
  const rows = await prisma.marriageDiscussionMark.findMany({ where: { journeyId, moduleId } });
  return rows.map(
    (r): MarriageDiscussionMarkRecord => ({
      id: r.id,
      journeyId: r.journeyId,
      moduleId: r.moduleId,
      questionId: r.questionId,
      markedByUserId: r.markedByUserId,
      sharedNote: r.sharedNote ?? undefined,
      markedAt: r.markedAt.toISOString(),
      discussedAt: r.discussedAt ? r.discussedAt.toISOString() : r.discussedAt === null ? null : undefined,
    }),
  );
}

type ReopenDiscussionMarkClient = {
  marriageDiscussionMark: {
    updateMany: (args: {
      where: { journeyId: string; moduleId: string; questionId: string };
      data: { discussedAt: null };
    }) => Promise<{ count: number }>;
  };
};

/** Non-destructive reopen: clears discussed status only (Test 9L). */
export async function reopenDiscussionForQuestionWithClient(
  client: ReopenDiscussionMarkClient,
  journeyId: string,
  moduleId: string,
  questionId: string,
) {
  const result = await client.marriageDiscussionMark.updateMany({
    where: { journeyId, moduleId, questionId },
    data: { discussedAt: null },
  });
  return result.count;
}

export async function reopenDiscussionForQuestion(
  journeyId: string,
  moduleId: string,
  questionId: string,
) {
  return reopenDiscussionForQuestionWithClient(prisma, journeyId, moduleId, questionId);
}

export async function listActionPlans(journeyId: string) {
  const rows = await prisma.marriageActionPlan.findMany({
    where: { journeyId },
    orderBy: { updatedAt: "desc" },
  });
  return rows.map(mapActionPlan);
}

export async function getActionPlanById(id: string) {
  const row = await prisma.marriageActionPlan.findUnique({ where: { id } });
  return row ? mapActionPlan(row) : null;
}

function mapActionPlan(row: {
  id: string;
  journeyId: string;
  moduleId: string | null;
  title: string;
  createdByUserId: string;
  itemsJson: string;
  status: string;
  agreedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): MarriageActionPlanRecord {
  return {
    id: row.id,
    journeyId: row.journeyId,
    moduleId: row.moduleId ?? undefined,
    title: row.title,
    createdByUserId: row.createdByUserId,
    items: JSON.parse(row.itemsJson),
    status: row.status as MarriageActionPlanRecord["status"],
    agreedAt: row.agreedAt?.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function saveActionPlan(plan: MarriageActionPlanRecord) {
  await prisma.marriageActionPlan.upsert({
    where: { id: plan.id },
    create: {
      id: plan.id,
      journeyId: plan.journeyId,
      moduleId: plan.moduleId ?? null,
      title: plan.title,
      createdByUserId: plan.createdByUserId,
      itemsJson: JSON.stringify(plan.items),
      status: plan.status,
      agreedAt: plan.agreedAt ? new Date(plan.agreedAt) : null,
      createdAt: new Date(plan.createdAt),
      updatedAt: new Date(plan.updatedAt),
    },
    update: {
      title: plan.title,
      itemsJson: JSON.stringify(plan.items),
      status: plan.status,
      agreedAt: plan.agreedAt ? new Date(plan.agreedAt) : null,
      updatedAt: new Date(plan.updatedAt),
    },
  });
  return plan;
}

export async function listSharedGoals(journeyId: string) {
  const rows = await prisma.marriageSharedGoal.findMany({
    where: { journeyId },
    orderBy: { updatedAt: "desc" },
  });
  return rows.map(mapSharedGoal);
}

export async function getSharedGoalById(id: string) {
  const row = await prisma.marriageSharedGoal.findUnique({ where: { id } });
  return row ? mapSharedGoal(row) : null;
}

function mapSharedGoal(row: {
  id: string;
  journeyId: string;
  title: string;
  description: string | null;
  category: string;
  createdByUserId: string;
  acknowledgedByJson: string;
  targetDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): MarriageSharedGoalRecord {
  return {
    id: row.id,
    journeyId: row.journeyId,
    title: row.title,
    description: row.description ?? undefined,
    category: row.category as MarriageSharedGoalRecord["category"],
    createdByUserId: row.createdByUserId,
    acknowledgedByUserIds: JSON.parse(row.acknowledgedByJson) as string[],
    targetDate: row.targetDate?.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function saveSharedGoal(goal: MarriageSharedGoalRecord) {
  await prisma.marriageSharedGoal.upsert({
    where: { id: goal.id },
    create: {
      id: goal.id,
      journeyId: goal.journeyId,
      title: goal.title,
      description: goal.description ?? null,
      category: goal.category,
      createdByUserId: goal.createdByUserId,
      acknowledgedByJson: JSON.stringify(goal.acknowledgedByUserIds),
      targetDate: goal.targetDate ? new Date(goal.targetDate) : null,
      createdAt: new Date(goal.createdAt),
      updatedAt: new Date(goal.updatedAt),
    },
    update: {
      title: goal.title,
      description: goal.description ?? null,
      acknowledgedByJson: JSON.stringify(goal.acknowledgedByUserIds),
      targetDate: goal.targetDate ? new Date(goal.targetDate) : null,
      updatedAt: new Date(goal.updatedAt),
    },
  });
  return goal;
}

export async function listSharingConsents(journeyId: string, moduleId: string) {
  const rows = await prisma.marriageSharingConsent.findMany({ where: { journeyId, moduleId } });
  return rows.map(mapSharingConsentRow);
}

export async function getSharingConsentByKey(
  journeyId: string,
  moduleId: string,
  questionId: string,
  userId: string,
): Promise<MarriageSharingConsentRecord | null> {
  const row = await prisma.marriageSharingConsent.findUnique({
    where: {
      journeyId_moduleId_questionId_userId: { journeyId, moduleId, questionId, userId },
    },
  });
  return row ? mapSharingConsentRow(row) : null;
}

/** Stage 2 partner comparison — updates granted only; preserves counselor metadata columns. */
export async function savePartnerSharingConsent(patch: MarriagePartnerSharingConsentPatch) {
  const existingRow = await prisma.marriageSharingConsent.findUnique({
    where: {
      journeyId_moduleId_questionId_userId: {
        journeyId: patch.journeyId,
        moduleId: patch.moduleId,
        questionId: patch.questionId,
        userId: patch.userId,
      },
    },
  });
  const merged = mergePartnerSharingConsentPatch(
    existingRow ? mapSharingConsentRow(existingRow) : null,
    patch,
  );
  await prisma.marriageSharingConsent.upsert({
    where: {
      journeyId_moduleId_questionId_userId: {
        journeyId: patch.journeyId,
        moduleId: patch.moduleId,
        questionId: patch.questionId,
        userId: patch.userId,
      },
    },
    create: {
      journeyId: merged.journeyId,
      moduleId: merged.moduleId,
      questionId: merged.questionId,
      userId: merged.userId,
      granted: merged.granted,
      counselorDisclosureGranted: merged.counselorDisclosureGranted === true,
      updatedAt: new Date(merged.updatedAt),
      consentedCounselorUserId: merged.consentedCounselorUserId ?? null,
      generationAtGrant: merged.generationAtGrant ?? null,
      answerFingerprint: merged.answerFingerprint ?? null,
      grantedAt: merged.grantedAt ? new Date(merged.grantedAt) : null,
    },
    update: {
      granted: merged.granted,
      updatedAt: new Date(merged.updatedAt),
    },
  });
  return merged;
}

/** Counselor answer disclosure consent — full metadata read/write. */
export async function saveCounselorSharingConsent(record: MarriageSharingConsentRecord) {
  if (record.counselorDisclosureGranted) {
    assertCounselorSharingConsentGrant(record);
  }
  const counselorActive = record.counselorDisclosureGranted === true;
  await prisma.marriageSharingConsent.upsert({
    where: {
      journeyId_moduleId_questionId_userId: {
        journeyId: record.journeyId,
        moduleId: record.moduleId,
        questionId: record.questionId,
        userId: record.userId,
      },
    },
    create: {
      journeyId: record.journeyId,
      moduleId: record.moduleId,
      questionId: record.questionId,
      userId: record.userId,
      granted: record.granted,
      counselorDisclosureGranted: counselorActive,
      updatedAt: new Date(record.updatedAt),
      consentedCounselorUserId: counselorActive ? record.consentedCounselorUserId ?? null : null,
      generationAtGrant: counselorActive ? record.generationAtGrant ?? null : null,
      answerFingerprint: counselorActive ? record.answerFingerprint ?? null : null,
      grantedAt: counselorActive && record.grantedAt ? new Date(record.grantedAt) : null,
    },
    update: {
      counselorDisclosureGranted: counselorActive,
      updatedAt: new Date(record.updatedAt),
      consentedCounselorUserId: counselorActive ? record.consentedCounselorUserId ?? null : null,
      generationAtGrant: counselorActive ? record.generationAtGrant ?? null : null,
      answerFingerprint: counselorActive ? record.answerFingerprint ?? null : null,
      grantedAt: counselorActive && record.grantedAt ? new Date(record.grantedAt) : null,
    },
  });
  return record;
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

export type ApplyCounselorConsentGrantInput = {
  journeyId: string;
  moduleId: string;
  questionId: string;
  userId: string;
  expectedCounselorUserId: string;
  answerFingerprint: string;
};

export type ApplyCounselorConsentRevokeInput = {
  journeyId: string;
  moduleId: string;
  questionId: string;
  userId: string;
};

async function upsertCounselorSharingConsentInTransaction(
  tx: MarriageDbTransaction,
  record: MarriageSharingConsentRecord,
) {
  if (record.counselorDisclosureGranted) assertCounselorSharingConsentGrant(record);
  const counselorActive = record.counselorDisclosureGranted === true;
  await tx.marriageSharingConsent.upsert({
    where: {
      journeyId_moduleId_questionId_userId: {
        journeyId: record.journeyId,
        moduleId: record.moduleId,
        questionId: record.questionId,
        userId: record.userId,
      },
    },
    create: {
      journeyId: record.journeyId,
      moduleId: record.moduleId,
      questionId: record.questionId,
      userId: record.userId,
      granted: record.granted,
      counselorDisclosureGranted: counselorActive,
      updatedAt: new Date(record.updatedAt),
      consentedCounselorUserId: counselorActive ? record.consentedCounselorUserId ?? null : null,
      generationAtGrant: counselorActive ? record.generationAtGrant ?? null : null,
      answerFingerprint: counselorActive ? record.answerFingerprint ?? null : null,
      grantedAt: counselorActive && record.grantedAt ? new Date(record.grantedAt) : null,
    },
    update: {
      counselorDisclosureGranted: counselorActive,
      updatedAt: new Date(record.updatedAt),
      consentedCounselorUserId: counselorActive ? record.consentedCounselorUserId ?? null : null,
      generationAtGrant: counselorActive ? record.generationAtGrant ?? null : null,
      answerFingerprint: counselorActive ? record.answerFingerprint ?? null : null,
      grantedAt: counselorActive && record.grantedAt ? new Date(record.grantedAt) : null,
    },
  });
}

export async function applyCounselorConsentGrant(
  input: ApplyCounselorConsentGrantInput,
): Promise<{ idempotent: boolean }> {
  const now = new Date().toISOString();

  return prisma.$transaction(async (tx) => {
    await lockCounselingJourneyRow(tx, input.journeyId);
    const journey = await tx.marriageCounselingJourney.findUnique({
      where: { id: input.journeyId },
    });
    if (!journey?.counselorUserId?.trim()) {
      throw new Error("No counselor is assigned to your journey yet.");
    }
    if (journey.counselorAccessRevokedAt) {
      throw new Error("Counselor access has been revoked for this journey.");
    }
    if (journey.counselorUserId !== input.expectedCounselorUserId) {
      throw new Error("Counselor assignment does not match.");
    }

    await acquireAssessmentDraftAdvisoryLock(
      tx,
      input.journeyId,
      input.moduleId,
      input.userId,
    );

    const response = await tx.marriageAssessmentResponse.findFirst({
      where: {
        journeyId: input.journeyId,
        moduleId: input.moduleId,
        userId: input.userId,
      },
    });
    if (!response || response.status !== "submitted") {
      throw new Error("Submit this assessment before sharing answers with your counselor.");
    }

    const answers = JSON.parse(response.answersJson) as Record<string, unknown>;
    const answer = answers[input.questionId];
    if (!isAnswerDisclosableToCounselor(answer)) {
      throw new Error("This answer cannot be shared until you provide a response.");
    }

    const fingerprint = computeAnswerFingerprint(answer);
    if (fingerprint !== input.answerFingerprint) {
      throw new Error("Answer changed. Refresh and try again.");
    }

    const genRow = await tx.marriageAnswerChangeGeneration.findUnique({
      where: {
        journeyId_moduleId_questionId_userId: {
          journeyId: input.journeyId,
          moduleId: input.moduleId,
          questionId: input.questionId,
          userId: input.userId,
        },
      },
    });
    const generation = genRow?.generation ?? 0;

    const existingRow = await tx.marriageSharingConsent.findUnique({
      where: {
        journeyId_moduleId_questionId_userId: {
          journeyId: input.journeyId,
          moduleId: input.moduleId,
          questionId: input.questionId,
          userId: input.userId,
        },
      },
    });
    const existing = existingRow ? mapSharingConsentRow(existingRow) : null;
    if (
      existing?.counselorDisclosureGranted &&
      existing.consentedCounselorUserId === journey.counselorUserId &&
      existing.generationAtGrant === generation &&
      existing.answerFingerprint === fingerprint
    ) {
      return { idempotent: true };
    }

    const record: MarriageSharingConsentRecord = {
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
    };
    await upsertCounselorSharingConsentInTransaction(tx, record);
    return { idempotent: false };
  });
}

export async function applyCounselorConsentRevoke(
  input: ApplyCounselorConsentRevokeInput,
): Promise<{ idempotent: boolean }> {
  const now = new Date().toISOString();

  return prisma.$transaction(async (tx) => {
    await lockCounselingJourneyRow(tx, input.journeyId);
    await acquireAssessmentDraftAdvisoryLock(
      tx,
      input.journeyId,
      input.moduleId,
      input.userId,
    );

    const existingRow = await tx.marriageSharingConsent.findUnique({
      where: {
        journeyId_moduleId_questionId_userId: {
          journeyId: input.journeyId,
          moduleId: input.moduleId,
          questionId: input.questionId,
          userId: input.userId,
        },
      },
    });
    const existing = existingRow ? mapSharingConsentRow(existingRow) : null;
    const revocation = buildCounselorConsentRevocationRecord(
      existing,
      input,
      now,
    );
    if (!revocation) {
      return { idempotent: true };
    }
    await upsertCounselorSharingConsentInTransaction(tx, revocation);
    return { idempotent: false };
  });
}

export async function getAnswerChangeGeneration(
  journeyId: string,
  moduleId: string,
  questionId: string,
  userId: string,
): Promise<number> {
  const row = await prisma.marriageAnswerChangeGeneration.findUnique({
    where: {
      journeyId_moduleId_questionId_userId: { journeyId, moduleId, questionId, userId },
    },
  });
  return row?.generation ?? 0;
}

export async function incrementAnswerChangeGeneration(
  journeyId: string,
  moduleId: string,
  questionId: string,
  userId: string,
): Promise<number> {
  const row = await prisma.marriageAnswerChangeGeneration.upsert({
    where: {
      journeyId_moduleId_questionId_userId: { journeyId, moduleId, questionId, userId },
    },
    create: {
      journeyId,
      moduleId,
      questionId,
      userId,
      generation: 1,
    },
    update: {
      generation: { increment: 1 },
    },
  });
  return row.generation;
}

export async function getActivitySyncSession(journeyId: string, moduleId: string) {
  const row = await prisma.marriageActivitySyncSession.findFirst({
    where: { journeyId, moduleId, status: "open" },
  });
  if (!row) return null;
  return {
    id: row.id,
    journeyId: row.journeyId,
    moduleId: row.moduleId,
    startedByUserId: row.startedByUserId,
    status: row.status as MarriageActivitySyncSessionRecord["status"],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function saveActivitySyncSession(session: MarriageActivitySyncSessionRecord) {
  await prisma.marriageActivitySyncSession.upsert({
    where: { id: session.id },
    create: {
      id: session.id,
      journeyId: session.journeyId,
      moduleId: session.moduleId,
      startedByUserId: session.startedByUserId,
      status: session.status,
      createdAt: new Date(session.createdAt),
      updatedAt: new Date(session.updatedAt),
    },
    update: {
      status: session.status,
      updatedAt: new Date(session.updatedAt),
    },
  });
  return session;
}
