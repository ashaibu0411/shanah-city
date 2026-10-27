import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import type {
  MarriageCounselorStructuredFeedback,
  MarriageSelfPacedSessionReviewRecord,
  MarriageSessionClarificationMessageRecord,
  SelfPacedWorkflowStatus,
} from "@/lib/marriage-self-paced-types";

function mapReview(row: {
  id: string;
  journeyId: string;
  sessionKey: string;
  assignedModuleIdsJson: string;
  workflowStatus: string;
  assignedByUserId: string;
  assignedAt: Date;
  readyForReviewAt: Date | null;
  feedbackDraftJson: string | null;
  feedbackPublishedJson: string | null;
  feedbackPublishedAt: Date | null;
  approvedAt: Date | null;
  approvedByUserId: string | null;
  pastoralFollowUpAt: Date | null;
  updatedAt: Date;
}): MarriageSelfPacedSessionReviewRecord {
  return {
    id: row.id,
    journeyId: row.journeyId,
    sessionKey: row.sessionKey,
    assignedModuleIds: JSON.parse(row.assignedModuleIdsJson) as string[],
    workflowStatus: row.workflowStatus as SelfPacedWorkflowStatus,
    assignedByUserId: row.assignedByUserId,
    assignedAt: row.assignedAt.toISOString(),
    readyForReviewAt: row.readyForReviewAt?.toISOString() ?? null,
    feedbackDraft: row.feedbackDraftJson
      ? (JSON.parse(row.feedbackDraftJson) as MarriageCounselorStructuredFeedback)
      : null,
    feedbackPublished: row.feedbackPublishedJson
      ? (JSON.parse(row.feedbackPublishedJson) as MarriageCounselorStructuredFeedback)
      : null,
    feedbackPublishedAt: row.feedbackPublishedAt?.toISOString() ?? null,
    approvedAt: row.approvedAt?.toISOString() ?? null,
    approvedByUserId: row.approvedByUserId,
    pastoralFollowUpAt: row.pastoralFollowUpAt?.toISOString() ?? null,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getSelfPacedSessionReview(journeyId: string, sessionKey: string) {
  const row = await prisma.marriageSelfPacedSessionReview.findUnique({
    where: { journeyId_sessionKey: { journeyId, sessionKey } },
  });
  return row ? mapReview(row) : null;
}

export async function listSelfPacedSessionReviewsForJourney(journeyId: string) {
  const rows = await prisma.marriageSelfPacedSessionReview.findMany({
    where: { journeyId },
    orderBy: { assignedAt: "asc" },
  });
  return rows.map(mapReview);
}

export async function listSelfPacedReviewsForCounselor(counselorUserId: string) {
  const journeys = await prisma.marriageCounselingJourney.findMany({
    where: { counselorUserId, status: "active" },
    select: { id: true },
  });
  const journeyIds = journeys.map((j) => j.id);
  if (journeyIds.length === 0) return [];
  const rows = await prisma.marriageSelfPacedSessionReview.findMany({
    where: {
      journeyId: { in: journeyIds },
      workflowStatus: {
        in: [
          "ready_for_review",
          "feedback_draft",
          "feedback_published",
          "homework_review",
          "clarification_open",
          "pastoral_follow_up",
        ],
      },
    },
    orderBy: { updatedAt: "desc" },
  });
  return rows.map(mapReview);
}

export async function saveSelfPacedSessionReview(record: MarriageSelfPacedSessionReviewRecord) {
  const row = await prisma.marriageSelfPacedSessionReview.upsert({
    where: { journeyId_sessionKey: { journeyId: record.journeyId, sessionKey: record.sessionKey } },
    create: {
      id: record.id,
      journeyId: record.journeyId,
      sessionKey: record.sessionKey,
      assignedModuleIdsJson: JSON.stringify(record.assignedModuleIds),
      workflowStatus: record.workflowStatus,
      assignedByUserId: record.assignedByUserId,
      assignedAt: new Date(record.assignedAt),
      readyForReviewAt: record.readyForReviewAt ? new Date(record.readyForReviewAt) : null,
      feedbackDraftJson: record.feedbackDraft ? JSON.stringify(record.feedbackDraft) : null,
      feedbackPublishedJson: record.feedbackPublished
        ? JSON.stringify(record.feedbackPublished)
        : null,
      feedbackPublishedAt: record.feedbackPublishedAt ? new Date(record.feedbackPublishedAt) : null,
      approvedAt: record.approvedAt ? new Date(record.approvedAt) : null,
      approvedByUserId: record.approvedByUserId,
      pastoralFollowUpAt: record.pastoralFollowUpAt ? new Date(record.pastoralFollowUpAt) : null,
      updatedAt: new Date(record.updatedAt),
    },
    update: {
      assignedModuleIdsJson: JSON.stringify(record.assignedModuleIds),
      workflowStatus: record.workflowStatus,
      readyForReviewAt: record.readyForReviewAt ? new Date(record.readyForReviewAt) : null,
      feedbackDraftJson: record.feedbackDraft ? JSON.stringify(record.feedbackDraft) : null,
      feedbackPublishedJson: record.feedbackPublished
        ? JSON.stringify(record.feedbackPublished)
        : null,
      feedbackPublishedAt: record.feedbackPublishedAt ? new Date(record.feedbackPublishedAt) : null,
      approvedAt: record.approvedAt ? new Date(record.approvedAt) : null,
      approvedByUserId: record.approvedByUserId,
      pastoralFollowUpAt: record.pastoralFollowUpAt ? new Date(record.pastoralFollowUpAt) : null,
      updatedAt: new Date(record.updatedAt),
    },
  });
  return mapReview(row);
}

export async function listSelfPacedSessionAudits(journeyId: string, sessionKey: string) {
  const rows = await prisma.marriageSelfPacedSessionAudit.findMany({
    where: { journeyId, sessionKey },
    orderBy: { createdAt: "asc" },
  });
  return rows.map((row) => ({
    id: row.id,
    journeyId: row.journeyId,
    sessionKey: row.sessionKey,
    action: row.action,
    actorUserId: row.actorUserId,
    previousStatus: row.previousStatus,
    newStatus: row.newStatus,
    metaJson: row.metaJson,
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function appendSelfPacedSessionAudit(input: {
  journeyId: string;
  sessionKey: string;
  action: string;
  actorUserId: string;
  previousStatus?: string | null;
  newStatus?: string | null;
  metaJson?: string | null;
}) {
  await prisma.marriageSelfPacedSessionAudit.create({
    data: {
      id: randomUUID(),
      journeyId: input.journeyId,
      sessionKey: input.sessionKey,
      action: input.action,
      actorUserId: input.actorUserId,
      previousStatus: input.previousStatus ?? null,
      newStatus: input.newStatus ?? null,
      metaJson: input.metaJson ?? null,
      createdAt: new Date(),
    },
  });
}

export async function appendCounselingDeliveryModeAudit(input: {
  journeyId: string;
  previousMode: string | null;
  newMode: string;
  actorUserId: string;
  note?: string | null;
}) {
  await prisma.marriageCounselingDeliveryModeAudit.create({
    data: {
      id: randomUUID(),
      journeyId: input.journeyId,
      previousMode: input.previousMode,
      newMode: input.newMode,
      actorUserId: input.actorUserId,
      note: input.note ?? null,
      createdAt: new Date(),
    },
  });
}

export async function listClarificationMessages(journeyId: string, sessionKey: string) {
  const rows = await prisma.marriageSessionClarificationMessage.findMany({
    where: { journeyId, sessionKey },
    orderBy: { createdAt: "asc" },
  });
  return rows.map(
    (row): MarriageSessionClarificationMessageRecord => ({
      id: row.id,
      journeyId: row.journeyId,
      sessionKey: row.sessionKey,
      authorUserId: row.authorUserId,
      authorRole: row.authorRole as "counselor" | "partner",
      body: row.body,
      createdAt: row.createdAt.toISOString(),
    }),
  );
}

export async function saveClarificationMessage(record: MarriageSessionClarificationMessageRecord) {
  await prisma.marriageSessionClarificationMessage.create({
    data: {
      id: record.id,
      journeyId: record.journeyId,
      sessionKey: record.sessionKey,
      authorUserId: record.authorUserId,
      authorRole: record.authorRole,
      body: record.body,
      createdAt: new Date(record.createdAt),
    },
  });
  return record;
}
